/*
 * sig-bridge.js —— 桌面端「无服务器直连」信令适配层（P2）
 *
 * 只在 URL 带 ?d=1（Electron 壳注入）时激活；网页版即使加载了本文件也直接 return，
 * 行为与原 socket.io 信令完全一致（对 chat.51pwn.com 零影响）。
 *
 * 工作原理：
 *   1. 用一个具备 socket.io 事件面的本地对象替换 socket，客户端 p2pchat.js 主体零改动；
 *   2. RTCPeerConnection 仍由客户端代码创建，只把 SDP + ICE 打包成「邀请码 / 回应码」
 *      人工搬运过去 —— 于是完全不需要任何服务器也能跨公网建连；
 *   3. 连接建立后的文本/文件/音视频仍走原生 WebRTC 数据通道，AES 加密逻辑不变。
 *
 * 为什么必须人工搬运：WebRTC 要求交换 SDP/ICE，没有信令通道就只能人肉传递。
 * 这是「零服务器、可跨公网」的最小可行实现；自动发现（DHT）属于 P3。
 */
(function () {
	'use strict';

	var qs = new URLSearchParams(location.search);
	if (qs.get('d') !== '1') return;                    // 非桌面壳：完全不做任何事

	var MODE = String(qs.get('sig') || 'manual').toLowerCase();

	if (MODE === 'local') {
		// 局域网模式：直接用内嵌服务端的 /pChat 信令（与网页版逻辑一致）
		window.__E2E_SIG__ = function () { return null; };
		return;
	}

	// 手工码模式只协商数据通道：SDP 从 ~13KB 降到 ~1KB，二维码才装得下（网页版不受影响）
	window.__E2E_TEXTONLY__ = 1;

	var PREFIX = 'E2EC1:';       // 兼容旧版明文码
	var PREFIX_GZ = 'E2EC2:';    // deflate-raw + base64url
	var PEER_ID = 'P2P-1';       // 手工直连固定一个逻辑对端
	var I = null;
	var iceBuf = {};
	var outbox = [];
	var pollTimer = 0;
	var TTL = (parseInt(qs.get('ttl'), 10) || 180) * 1000;   // 码有效期（默认 180s，可用 ?ttl=25 调试），超时闪烁提示重新生成
	var st = { channel: '', nick: '', phase: 'idle', expire: 0 };

	/* ---------------- 编解码（deflate-raw，体积约为明文的 1/5） ---------------- */
	function b64u(bytes) {
		var s = '';
		for (var i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
		return btoa(s).replace(/[+]/g, '-').replace(/[/]/g, '_').replace(/=+$/, '');
	}
	function unb64u(str) {
		var s = String(str).replace(/-/g, '+').replace(/_/g, '/');
		while (s.length % 4) s += '=';
		var bin = atob(s), out = new Uint8Array(bin.length);
		for (var i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
		return out;
	}
	function hasCS() { return typeof CompressionStream === 'function' && typeof DecompressionStream === 'function'; }
	function deflateRaw(str) {
		var stream = new Blob([new TextEncoder().encode(str)]).stream().pipeThrough(new CompressionStream('deflate-raw'));
		return new Response(stream).arrayBuffer().then(function (ab) { return new Uint8Array(ab); });
	}
	function inflateRaw(bytes) {
		var stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
		return new Response(stream).text();
	}
	function pack(o) {
		var json = JSON.stringify(o);
		var plain = function () { return PREFIX + btoa(unescape(encodeURIComponent(json))); };
		if (!hasCS()) return Promise.resolve(plain());
		return deflateRaw(json).then(function (u8) { return PREFIX_GZ + b64u(u8); }, plain);
	}
	function unpack(s) {
		s = String(s || '').trim();
		if (!s) return Promise.resolve(null);
		if (s.indexOf(PREFIX_GZ) === 0) {
			return inflateRaw(unb64u(s.slice(PREFIX_GZ.length))).then(function (txt) {
				try { return JSON.parse(txt); } catch (e) { return null; }
			}, function () { return null; });
		}
		if (s.indexOf(PREFIX) === 0) s = s.slice(PREFIX.length);
		try { return Promise.resolve(JSON.parse(decodeURIComponent(escape(atob(s))))); } catch (e) { }
		try { return Promise.resolve(JSON.parse(s)); } catch (e2) { }
		return Promise.resolve(null);
	}

	/* ---------------- 信令桥 ---------------- */
	function Bridge() {
		this.h = {};
		this.id = 'local-' + Math.random().toString(36).slice(2, 8);
		this.io = {
			reconnection: true,
			reconnectionAttempts: function () { return this; },
			reconnectionDelay: function () { return this; },
			reconnectionDelayMax: function () { return this; }
		};
	}
	Bridge.prototype.on = function (n, cb) { (this.h[n] = this.h[n] || []).push(cb); return this; };
	Bridge.prototype.fire = function (n, arg) {
		var a = this.h[n] || [];
		for (var i = 0; i < a.length; i++) {
			try { a[i](arg); } catch (e) { console.warn('[sig] handler', n, e); }
		}
	};
	Bridge.prototype.emit = function () {
		var n = arguments[0], p = arguments[1];
		var cb = typeof arguments[arguments.length - 1] === 'function' ? arguments[arguments.length - 1] : null;
		try {
			switch (n) {
				case 'join':
					if (p && p.channel) { st.channel = p.channel; st.nick = (p.userdata && p.userdata.nick) || st.nick; }
					uiSync();
					break;
				case 'part':
					resetSession();
					break;
				case 'relaySessionDescription':
					// 生成时机改由 watchLocal 轮询决定，这里只记录
					if (p && p.session_description) console.info('[sig] relaySdp', p.session_description.type);
					break;
				case 'relayICECandidate':
					if (p && p.peer_id && p.ice_candidate) (iceBuf[p.peer_id] = iceBuf[p.peer_id] || []).push(p.ice_candidate);
					break;
				case 'msg4One':
					if (p) { outbox.push(p); flushOutbox(); }
					break;
				default:
					break; // getNick/svClientInfo/saveImg/saveVideo/p2f/RunRtsp/csys 本地不需要
			}
		} catch (e) { console.warn('[sig] emit', n, e); }
		// 客户端给每个 emit 挂了重试回调，必须回 'success'，否则会无限重试
		if (cb) setTimeout(function () { try { cb('success'); } catch (e) { } }, 0);
		return this;
	};

	var bridge = new Bridge();

	/* ---------------- 兼容层：旧式 RTCPeerConnection 回调 ----------------
	 * 客户端 p2pchat.js 用 setRemoteDescription(desc, ok, err) / createAnswer(ok, err)
	 * 这类旧式回调签名。部分 Chromium 版本已忽略尾随回调，导致 answer 永远不生成。
	 * 这里统一改走 Promise，回调与 Promise 语义等价；仅在桌面模式生效。
	 */
	(function installLegacyShim() {
		var PC = window.RTCPeerConnection;
		if (!PC || !PC.prototype || PC.prototype.__e2eShim) return;
		PC.prototype.__e2eShim = 1;
		function wrap(name, pick) {
			var orig = PC.prototype[name];
			if (typeof orig !== 'function') return;
			PC.prototype[name] = function () {
				var args = Array.prototype.slice.call(arguments);
				// 取出尾随回调：一个 = 成功回调；两个 = (成功, 失败)
				var cbs = [];
				while (args.length && typeof args[args.length - 1] === 'function') cbs.unshift(args.pop());
				var ok = cbs[0] || null, err = cbs[1] || null;
				var p;
				try { p = orig.apply(this, args); } catch (e) { if (err) try { err(e); } catch (x) { } throw e; }
				if (typeof ok === 'function' || typeof err === 'function') {
					if (p && typeof p.then === 'function') {
						p.then(function (v) { if (ok) try { ok(v); } catch (e) { console.warn(e); } },
							function (e) { if (err) try { err(e); } catch (x) { } });
					}
				}
				return p;
			};
		}
		wrap('setRemoteDescription');
		wrap('setLocalDescription');
		wrap('createAnswer');
		wrap('createOffer');
	})();

	/* ---------------- 内部能力 ---------------- */
	function internals() { return I || (I = window.__E2E_INTERNALS__ || null); }
	function peers() { var i = internals(); return (i && i.peers()) || {}; }
	function gaM() { var i = internals(); return (i && i.gaM()) || {}; }
	function revMsg(e) { var i = internals(); if (i && i.revMsg) try { i.revMsg(e); } catch (er) { console.warn(er); } }
	function roomName() { var i = internals(); return (i && i.roomName && i.roomName()) || 'P2P'; }

	function ensureJoined(cb) {
		var i = internals();
		if (!i) { uiStatus('客户端尚未就绪，请稍后重试'); return; }
		if (i.isJoined()) { cb(); return; }
		if (window.$ && window.$('#stChat').length) {
			uiStatus('正在进入文本聊天…');
			window.$('#stChat').trigger('click');   // 等价于用户点 💬
		}
		setTimeout(function () {
			if (i.isJoined()) cb();
			else uiStatus('请先点击 💬（文本聊天）后重试');
		}, 600);
	}

	function setChannelFromCode(ch) {
		if (!ch || ch === st.channel) return;
		if (window.$ && window.$('#cnId').length) {
			window.$('#cnId').val(ch).trigger('change');
			st.channel = ch;
		}
	}

	/* ---------------- 通道与状态 ---------------- */
	function markOpen(pid, ch) {
		var g = gaM();
		g[pid] = g[pid] || { nick: 'peer' };
		g[pid].pc = peers()[pid];
		g[pid].pcok = true;
		g[pid].sendChannel = ch;
		st.phase = 'connected';
		uiStatus('✅ P2P 直连已建立（无任何服务器）');
		flushOutbox();
		uiSync();
	}
	function adoptChannel(pid, ch) {
		if (!ch) return;
		ch.onmessage = function (e) { revMsg(e); };
		if (ch.readyState === 'open') markOpen(pid, ch);
		else ch.onopen = function () { markOpen(pid, ch); };
	}
	function createOwnChannel(pid) {
		var pc = peers()[pid];
		if (!pc) return null;
		var ch;
		try { ch = pc.createDataChannel(roomName(), { ordered: true }); } catch (e) { console.warn('[sig] createDataChannel', e); return null; }
		adoptChannel(pid, ch);
		return ch;
	}
	function adoptIncoming(pid) {
		var pc = peers()[pid];
		if (!pc) return;
		pc.ondatachannel = function (e) { adoptChannel(pid, e.channel); };
	}

	function fireAddPeer(createOffer, nick) {
		bridge.fire('addPeer', {
			peer_id: PEER_ID,
			should_create_offer: !!createOffer,
			userdata: { nick: nick || st.nick || 'peer' },
			nOnline: 2
		});
		var pc = peers()[PEER_ID];
		if (pc && gaM()[PEER_ID]) gaM()[PEER_ID].pc = pc;
		return pc;
	}

	/* ---------------- SDP 读取（不依赖客户端 emit 时机） ---------------- */
	// 客户端的 emit('relaySessionDescription') 只在 ICE 收集“彻底结束”时触发，
	// 一旦某个 STUN/TURN 卡住就永远等不到。这里改为直接读 RTCPeerConnection 状态。
	function watchLocal(pc, type, cb) {
		var t0 = Date.now(), appeared = 0, done = false;
		(function poll() {
			if (done) return;
			if (!pc) { done = true; return cb(); }
			var ld = pc.localDescription;
			if (!appeared && ld && ld.type === type) appeared = Date.now();
			var iceDone = pc.iceGatheringState === 'complete' || (appeared && Date.now() - appeared > 8000);
			if (appeared && iceDone) { done = true; return cb(); }
			if (Date.now() - t0 > 30000) { done = true; return cb(); }
			setTimeout(poll, 250);
		})();
	}
	function localCode(pc, type, tag) {
		var ld = pc.localDescription;
		if (!ld || ld.type !== type) { uiStatus('生成失败：连接状态异常'); return; }
		var ice = (iceBuf[PEER_ID] || []).length ? iceBuf[PEER_ID] : (pc.ice || []);
		showCode(tag, { type: ld.type, sdp: ld.sdp }, ice);
	}

	/* ---------------- 用户动作 ---------------- */
	function genInvite() {
		ensureJoined(function () {
			icReset();
			st.phase = 'busy';
			uiStatus('正在生成邀请码（收集网络候选，约 3–8 秒）…');
			var pc = fireAddPeer(true, st.nick);
			if (!pc) { uiStatus('创建连接失败，请确认已进入文本/视频聊天'); st.phase = 'idle'; return; }
			// 先自建一条数据通道，让它随首个 offer 一起协商
			setTimeout(function () { createOwnChannel(PEER_ID); }, 30);
			watchLocal(pc, 'offer', function () { localCode(pc, 'offer', 'invite'); });
		});
	}

	function applyCode() {
		unpack(uiCode()).then(function (code) {
		if (!code || !code.sdp) { uiStatus('邀请码 / 回应码格式不对，请重新复制'); return; }
		ensureJoined(function () {
			if (code.ch) setChannelFromCode(code.ch);
			if (code.sdp.type === 'answer') {
				// 我是发起方：应用回应码
				if (!peers()[PEER_ID]) fireAddPeer(true, code.nick);
				setTimeout(function () {
					bridge.fire('sessionDescription', { peer_id: PEER_ID, session_description: code.sdp });
					(code.ice || []).forEach(function (c) {
						if (c && c.candidate) bridge.fire('iceCandidate', { peer_id: PEER_ID, ice_candidate: c });
					});
					uiStatus('已应用回应码，正在打洞…');
					pollConn();
				}, 40);
			} else if (code.sdp.type === 'offer') {
				// 我是接收方：应用邀请码 → 产出回应码
				st.phase = 'busy';
				uiStatus('正在生成回应码…');
				var pc = fireAddPeer(false, code.nick);
				if (!pc) { uiStatus('创建连接失败'); return; }
				adoptIncoming(PEER_ID);   // 对方的通道在 offer 里，必须先把 ondatachannel 挂上
				bridge.fire('sessionDescription', {
					peer_id: PEER_ID,
					session_description: code.sdp,
					ice: code.ice || []
				});
				pollConn();
				watchLocal(pc, 'answer', function () { localCode(pc, 'answer', 'reply'); });
			}
		});
		});
	}

	function flushOutbox() {
		var ch = gaM()[PEER_ID] && gaM()[PEER_ID].sendChannel;
		if (!ch || ch.readyState !== 'open' || !outbox.length) return;
		var q = outbox.splice(0, outbox.length);
		q.forEach(function (p) {
			try {
				ch.send(JSON.stringify({ nick: p.nick, t: p.t, n: p.n, nL: p.nL, sFnm: p.sFnm, msg: p.msg }));
			} catch (e) { console.warn('[sig] flush', e); }
		});
		uiSync();
	}

	function pollConn() {
		if (pollTimer) return;
		pollTimer = setInterval(function () {
			var pc = peers()[PEER_ID], ch = gaM()[PEER_ID] && gaM()[PEER_ID].sendChannel;
			if (ch && ch.readyState === 'open') { markOpen(PEER_ID, ch); return; }
			if (pc && pc.connectionState === 'failed') {
				uiStatus('❌ 直连失败（可能是对称 NAT），换网络或让一方开热点后重试');
			}
			uiSync();
		}, 700);
	}

	function resetSession() {
		if (pollTimer) { clearInterval(pollTimer); pollTimer = 0; }
		st.phase = 'idle';
		iceBuf = {}; outbox = [];
		uiSync();
	}

	/* ---------------- UI ---------------- */
	var $p = null, $code, $status, $hint, $dbg, uiReady = false;
	function buildPanel() {
		if (uiReady || !document.body) return;
		uiReady = true;
		$p = document.createElement('div');
		$p.id = 'e2eSigPanel';
		$p.innerHTML =
			'<div class="hd"><span>无服务器直连</span><span id="e2eSigState" class="s">未连接</span><b id="e2eSigMin" title="收起">－</b></div>' +
			'<div class="bd">' +
			'<div class="row"><button id="e2eGen" type="button">① 生成邀请码</button>' +
			'<button id="e2eUse" type="button">② 粘贴并连接</button>' +
			'<button id="e2eScanBtn" type="button" title="用摄像头扫对方屏幕上的二维码">③ 扫码</button>' +
			'<button id="e2eCopy" type="button">复制</button></div>' +
			'<div id="e2eQr" title="点击放大二维码"></div>' +
			'<div id="e2eQrBig" class="scan"><div class="scanbox"><div class="qrbig"></div>' +
			'<div class="scanhint">用手机/另一台设备扫码</div>' +
			'<button id="e2eQrBigClose" type="button">关闭</button></div></div>' +
			'<div id="e2eScan" class="scan"><div class="scanbox"><video playsinline muted></video>' +
			'<canvas></canvas><div class="scanhint">把对方的二维码对准摄像头…</div>' +
			'<button id="e2eScanClose" type="button">取消</button></div></div>' +
			'<textarea id="e2eCode" spellcheck="false" placeholder="这里显示邀请码 / 回应码；或把对方发来的码粘贴到这里再点 ②"></textarea>' +
			'<pre id="e2eDbg" class="dbg"></pre>' +
			'<div id="e2eHint" class="hint">① 点 💬（或 🎦）进入聊天 → 生成邀请码并发给对方 → 对方粘贴后点 ② 得到回应码 → 你把回应码回传，对方点 ② 即完成直连。</div>' +
			'</div>';
		document.body.appendChild($p);

		var css = document.createElement('style');
		css.textContent =
			'#e2eSigPanel{position:fixed;left:12px;bottom:12px;z-index:99999;width:340px;max-width:calc(100vw - 24px);' +
			'background:#111c2e;border:1px solid #2b3f5c;border-radius:10px;box-shadow:0 8px 24px rgba(0,0,0,.45);' +
			'color:#dfe9f5;font:12px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif}' +
			'#e2eSigPanel .hd{display:flex;align-items:center;gap:8px;padding:8px 10px;border-bottom:1px solid #22334c;font-weight:600}' +
			'#e2eSigPanel .hd .s{margin-left:auto;color:#8fb2d6;font-weight:400;max-width:170px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}' +
			'#e2eSigPanel .hd b{cursor:pointer;padding:0 6px;color:#8fb2d6}' +
			'#e2eSigPanel .bd{padding:10px}' +
			'#e2eSigPanel .row{display:flex;gap:6px;margin-bottom:8px}' +
			'#e2eSigPanel button{flex:1;padding:6px 4px;border-radius:6px;border:1px solid #2b3f5c;background:#1b2c45;color:#dfe9f5;cursor:pointer;font-size:12px}' +
			'#e2eSigPanel button:hover{background:#243a5a}' +
			'#e2eSigPanel textarea{width:100%;height:88px;resize:vertical;background:#0b1420;color:#bfe1ff;border:1px solid #2b3f5c;' +
			'border-radius:6px;padding:6px;font:11px/1.4 ui-monospace,SFMono-Regular,Menlo,monospace;word-break:break-all}' +
			'#e2eSigPanel .hint{color:#7f97b2;margin-top:8px;font-size:11px;line-height:1.5}' +
			'#e2eSigPanel .dbg{margin:6px 0 0;padding:4px 6px;background:#0b1420;border:1px solid #22334c;border-radius:4px;color:#7f97b2;font:10px/1.35 ui-monospace,monospace;white-space:pre-wrap;max-height:44px;overflow:hidden}' +
			'#e2eSigPanel.min .bd{display:none}' +
			'#e2eSigPanel .hd .s.warn{color:#ffb454}' +
			'#e2eSigPanel .hd .s.blink{animation:e2eBlink .9s steps(2,start) infinite}' +
			'@keyframes e2eBlink{0%,100%{opacity:1}50%{opacity:.25}}' +
			'#e2eSigPanel #e2eQr{display:none;margin-top:8px;padding:6px;background:#0b1420;border:1px solid #22334c;border-radius:6px;text-align:center}' +
			'#e2eSigPanel #e2eQr.on{display:block}' +
			'#e2eSigPanel #e2eQr svg{width:100%;max-width:300px;height:auto;background:#fff;border-radius:4px;padding:3px}' +
			'#e2eSigPanel #e2eQr .qerr{color:#ffb454;font-size:11px;padding:6px}' +
			'#e2eSigPanel .scan{display:none;position:fixed;left:0;top:0;right:0;bottom:0;z-index:100000;background:rgba(4,10,18,.82);align-items:center;justify-content:center}' +
			'#e2eSigPanel .scan.on{display:flex}' +
			'#e2eSigPanel .scanbox{width:min(420px,92vw);background:#111c2e;border:1px solid #2b3f5c;border-radius:10px;padding:10px;text-align:center}' +
			'#e2eSigPanel .scanbox video{width:100%;border-radius:6px;background:#000}' +
			'#e2eSigPanel .scanbox canvas{display:none}' +
			'#e2eSigPanel .scanhint{color:#8fb2d6;font-size:11px;margin:8px 0}' +
			'#e2eSigPanel .scanbox button{width:100%}' +
			'#e2eSigPanel #e2eQr{cursor:zoom-in}' +
			'#e2eSigPanel .qrbig{background:#fff;border-radius:8px;padding:8px;display:inline-block}' +
			'#e2eSigPanel .qrbig svg{width:min(78vw,78vh);height:auto;display:block}';
		document.head.appendChild(css);

		$code = $p.querySelector('#e2eCode');
		$status = $p.querySelector('#e2eSigState');
		$hint = $p.querySelector('#e2eHint');
		$dbg = $p.querySelector('#e2eDbg');
		$p.querySelector('#e2eGen').addEventListener('click', genInvite);
		$p.querySelector('#e2eUse').addEventListener('click', applyCode);
		$p.querySelector('#e2eCopy').addEventListener('click', function () {
			$code.select();
			try { document.execCommand('copy'); uiStatus('已复制到剪贴板'); } catch (e) { uiStatus('复制失败，请手动选择'); }
		});
		$p.querySelector('#e2eScanBtn').addEventListener('click', openScan);
		$p.querySelector('#e2eQr').addEventListener('click', function () {
			var big = $p.querySelector('#e2eQrBig'), box = big.querySelector('.qrbig');
			if (!this.querySelector('svg')) return;
			box.innerHTML = this.innerHTML;
			big.classList.add('on');
		});
		$p.querySelector('#e2eQrBigClose').addEventListener('click', function () {
			$p.querySelector('#e2eQrBig').classList.remove('on');
		});
		$p.querySelector('#e2eScanClose').addEventListener('click', closeScan);
		$p.querySelector('#e2eSigMin').addEventListener('click', function () { $p.classList.toggle('min'); });
		uiSync();
	}
	function uiCode(v) { if (v !== undefined && $code) $code.value = v; return $code ? $code.value : ''; }
	function uiStatus(s) {
		st.note = s || '';
		st.noteAt = Date.now();
		if ($status) $status.textContent = s || '';
	}
	function uiHint(s) { if ($hint) $hint.innerHTML = s; }
	function fmtRem(ms) {
		var t = Math.max(0, Math.floor(ms / 1000));
		return Math.floor(t / 60) + ':' + ('0' + (t % 60)).slice(-2);
	}
	function uiSync() {
		if (!$status) return;
		var map = {
			idle: '未连接', busy: '正在生成…',
			invite: '邀请码已就绪 · 等待对方回应码',
			reply: '回应码已就绪 · 等待对方粘贴',
			connected: '已直连'
		};
		var base = map[st.phase] || '未连接';
		var rem = st.expire ? st.expire - Date.now() : 0;
		var counting = !!(st.expire && (st.phase === 'invite' || st.phase === 'reply'));
		var warn = false;
		if (counting) {
			if (rem <= 0) { base = '码已过期 · 请重新生成'; warn = true; }
			else { base += ' · 剩余 ' + fmtRem(rem); warn = rem <= 30000; }
		}
		$status.classList.toggle('warn', !!warn);
		$status.classList.toggle('blink', !!(counting && rem > 0 && rem <= 30000));
		// 4 秒内的一次性提示（错误/成功）优先显示，避免被秒级刷新冲掉
		var text = base + (outbox.length ? ' · 待发 ' + outbox.length + ' 条' : '');
		if (st.note && Date.now() - (st.noteAt || 0) < 4000 && st.note.indexOf(base) < 0) text = st.note;
		if ($status) $status.textContent = text;
	}
	// 候选精简：同一 address:port 只留一条；优先 srflx/relay；每类最多 4 条
	function pruneIce(list) {
		var keep = [], seen = {};
		(list || []).forEach(function (c) {
			var s = c && c.candidate;
			if (!s) return;
			var p = s.split(' ');
			if (p.length < 8) return;
			var type = p[7], ip = p[4], port = p[5];
			var key = type + '|' + ip + '|' + port;
			if (seen[key]) return;
			seen[key] = 1;
			keep.push({ candidate: s, sdpMid: c.sdpMid, sdpMLineIndex: c.sdpMLineIndex, type: type });
		});
		var rank = { srflx: 0, prflx: 1, relay: 2, host: 3 };
		keep.sort(function (a, b) { return (rank[a.type] || 9) - (rank[b.type] || 9); });
		var cnt = { udp: 0, tcp: 0 }, out = [];
		keep.forEach(function (c) {
			var proto = (c.candidate.indexOf(' tcp') > -1) ? 'tcp' : 'udp';
			if (cnt[proto] < (proto === 'udp' ? 2 : 1)) { cnt[proto]++; out.push({ candidate: c.candidate, sdpMid: c.sdpMid, sdpMLineIndex: c.sdpMLineIndex }); }
		});
		return out;
	}

	function showCode(kind, sd, ice) {
		return pack({
			v: 2, kind: kind, ch: st.channel, nick: st.nick,
			sdp: { type: sd.type, sdp: sd.sdp },
			ice: pruneIce(ice)
		}).then(function (code) {
			uiCode(code);
			try { $code.select(); } catch (e) { }
			st.expire = Date.now() + TTL;
			st.phase = (kind === 'invite') ? 'invite' : 'reply';
			renderQr(code);
			var kb = Math.round(code.length / 1024 * 10) / 10;
			uiHint((kind === 'invite')
				? '已生成邀请码（' + kb + 'KB）。对方可以<b>粘贴</b>，也可以直接<b>扫二维码</b>；回应码回来后粘到这里点 ②。'
				: '已生成回应码（' + kb + 'KB）。回传给发起方，或让他<b>扫码</b>；他点 ② 即完成直连。');
			uiSync();
		});
	}

	/* ---------------- 二维码 ---------------- */
	var libCache = {};
	function loadScript(src, globalName) {
		if (window[globalName]) return Promise.resolve(window[globalName]);
		if (libCache[src]) return libCache[src];
		libCache[src] = new Promise(function (resolve, reject) {
			var sc = document.createElement('script');
			sc.src = src; sc.async = true;
			sc.onload = function () { window[globalName] ? resolve(window[globalName]) : reject(new Error('load ' + src)); };
			sc.onerror = function () { reject(new Error('load ' + src)); };
			document.head.appendChild(sc);
		});
		return libCache[src];
	}
	function renderQr(code) {
		var box = $p && $p.querySelector('#e2eQr');
		if (!box) return;
		box.innerHTML = ''; box.classList.remove('on');
		loadScript('/js/qrcode.min.js', 'qrcode').then(function () {
			try {
				var qr = window.qrcode(0, 'L');    // 0 = 自动版本
				qr.addData(code);
				qr.make();
				box.innerHTML = qr.createSvgTag(4, 2);
				box.classList.add('on');
			} catch (e) {
				box.innerHTML = '<div class="qerr">码太长，单张二维码放不下，请改用复制粘贴</div>';
				box.classList.add('on');
			}
		}, function () { });
	}

	/* ---------------- 扫码 ---------------- */
	var scanStream = null, scanRaf = 0;
	function openScan() {
		loadScript('/js/jsqr.min.js', 'jsQR').then(function () {
			var m = $p.querySelector('#e2eScan'), v = m.querySelector('video');
			uiStatus('正在打开摄像头…');
			navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false }).then(function (stream) {
				scanStream = stream;
				v.srcObject = stream;
				if (v.play && v.play().catch) v.play().catch(function () { });
				m.classList.add('on');
				uiStatus('扫描中…');
				tickScan();
			}, function (e) {
				uiStatus('无法打开摄像头：' + ((e && (e.name || e.message)) || e));
			});
		}, function () { uiStatus('扫码组件加载失败'); });
	}
	function tickScan() {
		if (!scanStream || !$p) return;
		var m = $p.querySelector('#e2eScan'), v = m.querySelector('video'), cv = m.querySelector('canvas');
		if (v.readyState >= 2 && v.videoWidth) {
			var w = v.videoWidth, h = v.videoHeight;
			if (cv.width !== w) { cv.width = w; cv.height = h; }
			var ctx = cv.getContext('2d');
			ctx.drawImage(v, 0, 0, w, h);
			var img = ctx.getImageData(0, 0, w, h), r = null;
			try { r = window.jsQR(img.data, w, h, { inversionAttempts: 'dontInvert' }); } catch (e) { }
			if (r && r.data) {
				closeScan();
				$code.value = r.data;
				uiStatus('已识别二维码，正在连接…');
				applyCode();
				return;
			}
		}
		scanRaf = requestAnimationFrame(tickScan);
	}
	function closeScan() {
		if (scanRaf) { cancelAnimationFrame(scanRaf); scanRaf = 0; }
		if (scanStream) {
			scanStream.getTracks().forEach(function (t) { try { t.stop(); } catch (e) { } });
			scanStream = null;
		}
		if ($p) {
			var m = $p.querySelector('#e2eScan');
			if (m) { m.classList.remove('on'); var v = m.querySelector('video'); if (v) v.srcObject = null; }
		}
	}
	function icReset() { iceBuf = {}; }
	function dbg(){
		if(!$dbg) return;
		var pid = PEER_ID, pc = peers()[pid], ch = gaM()[pid] && gaM()[pid].sendChannel;
		if(!pc){ $dbg.textContent = 'no-pc'; return; }
		$dbg.textContent =
			'sig=' + pc.signalingState + ' ice=' + pc.iceGatheringState + ' conn=' + pc.connectionState +
			'\nlocal=' + (pc.localDescription ? pc.localDescription.type : '-') +
			' remote=' + (pc.currentRemoteDescription ? pc.currentRemoteDescription.type : '-') +
			' iceN=' + ((pc.ice || []).length) + ' ch=' + (ch ? ch.readyState : '-') +
			'\nph=' + st.phase + ' ttl=' + (st.expire ? Math.round((st.expire - Date.now()) / 1000) + 's' : '-');
	}
	setInterval(dbg, 1500);
	setInterval(uiSync, 1000);   // 倒计时/闪烁独立刷新（pollConn 只在连接阶段才跑）

	/* ---------------- 启动 ---------------- */
	window.__E2E_SIG__ = function () { return bridge; };

	// 等客户端注册完事件处理器后再 fire connect（否则 connect 会丢失）
	var tries = 0;
	(function waitInit() {
		if (document.body) buildPanel();
		var a = bridge.h['connect'];
		if (a && a.length) {
			bridge.fire('connect');
			buildPanel();
			return;
		}
		if (++tries > 120) return;
		setTimeout(waitInit, 100);
	})();
})();

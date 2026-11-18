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

	var PREFIX = 'E2EC1:';
	var PEER_ID = 'P2P-1';       // 手工直连固定一个逻辑对端
	var I = null;
	var iceBuf = {};
	var outbox = [];
	var pollTimer = 0;
	var st = { channel: '', nick: '', phase: 'idle' };

	/* ---------------- 编解码 ---------------- */
	function pack(o) { return PREFIX + btoa(unescape(encodeURIComponent(JSON.stringify(o)))); }
	function unpack(s) {
		s = String(s || '').trim();
		if (!s) return null;
		if (s.indexOf(PREFIX) === 0) s = s.slice(PREFIX.length);
		try { return JSON.parse(decodeURIComponent(escape(atob(s)))); } catch (e) { }
		try { return JSON.parse(s); } catch (e2) { }
		return null;
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
		var code = unpack(uiCode());
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
			'<button id="e2eCopy" type="button">复制</button></div>' +
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
			'#e2eSigPanel.min .bd{display:none}';
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
		$p.querySelector('#e2eSigMin').addEventListener('click', function () { $p.classList.toggle('min'); });
		uiSync();
	}
	function uiCode(v) { if (v !== undefined && $code) $code.value = v; return $code ? $code.value : ''; }
	function uiStatus(s) { if ($status) $status.textContent = s || ''; }
	function uiHint(s) { if ($hint) $hint.innerHTML = s; }
	function uiSync() {
		if (!$status) return;
		var map = {
			idle: '未连接', busy: '正在生成…',
			invite: '邀请码已就绪 · 等待对方回应码',
			reply: '回应码已就绪 · 等待对方粘贴',
			connected: '已直连'
		};
		uiStatus((map[st.phase] || '未连接') + (outbox.length ? ' · 待发 ' + outbox.length + ' 条' : ''));
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
			if (cnt[proto] < 4) { cnt[proto]++; out.push({ candidate: c.candidate, sdpMid: c.sdpMid, sdpMLineIndex: c.sdpMLineIndex }); }
		});
		return out;
	}

	function showCode(kind, sd, ice) {
		var code = pack({
			v: 1, kind: kind, ch: st.channel, nick: st.nick,
			sdp: { type: sd.type, sdp: sd.sdp },
			ice: pruneIce(ice)
		});
		uiCode(code);
		$code.select();
		var kb = Math.max(1, Math.round(code.length / 1024));
		if (kind === 'invite') {
			st.phase = 'invite';
			uiStatus('邀请码已生成(' + kb + 'KB)');
			uiHint('把<b>邀请码</b>发给对方 → 对方点 ② 得到<b>回应码</b> → 把回应码回传到这里再点 ②，即完成直连。');
		} else {
			st.phase = 'reply';
			uiStatus('回应码已生成(' + kb + 'KB)');
			uiHint('把<b>回应码</b>回传给发起方，他点 ② 粘贴后即完成直连。');
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
			' iceN=' + ((pc.ice || []).length) + ' ch=' + (ch ? ch.readyState : '-');
	}
	setInterval(dbg, 800);

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

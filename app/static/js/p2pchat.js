const appURL = () => {
	const protocol = String(document.location).split("://")[0] + '://';
	return protocol + location.host;
};
const getRoomName = () => {
	return $("#cnId").val()
}
window.MediaStream = window.MediaStream || window.webkitMediaStream;
window.AudioContext = window.AudioContext || window.webkitAudioContext;

var g_LbsIps = [], localVvId = '', qWBox = 0, html5QrcodeScanner,
	IS_SCREEN_STREAMING = false,
	szCltFg = "",
	isChrome = !!navigator.webkitGetUserMedia,
	isFirefox = !!navigator.mozGetUserMedia,
	bIsMobile = /.*?(ip(hone|od)|Mobile|iPad|iPod|Android|BlackBerry|IEMobile|Kindle|NetFront|Silk-Accelerated|(hpw|web)OS|Fennec|Minimo|Opera M(obi|ini)|Blazer|Dolfin|Dolphin|Skyfire|Zune)/gmi.test(navigator.userAgent),
	isMobileDevice = bIsMobile,
	// detect node-webkit
	isNodeWebkit = window.process && (typeof window.process == 'object') && window.process.versions && window.process.versions['node-webkit'],
	signaling_socket = null, /* our socket.io connection to our webserver */
	local_media_stream = null, /* our own microphone / webcam */
	peers = {}, /* keep track of our peer connections, indexed by peer_id (aka socket.io id) */
	peer_media_elements = {}, /* keep track of our <video>/<audio> tags, indexed by peer_id */
	g_oYourInfo = {},
	g_bTxtChat = false,
	g_peer_id = "",
	nLogs = 0, bNbg = false,
	szLstChannel = '',
	nId = 0, bCloseQrcode = true,
	g_bUseUpInfo = true,// submit current info to server
	g_bSetup = false,
	szgetYourInfo = '',
	g_sendChannels = [],
	sendChannel = null, nCnt = 1

// 当前时间
function getNowStr () {
	var now = new Date();
	var year = now.getFullYear(),
		month = now.getMonth() + 1,
		date = now.getDate(),
		hour = now.getHours(),
		minute = now.getMinutes(),
		second = now.getSeconds();
	function p (s) {
		return s < 10 ? '0' + s : s;
	}
	var timeFormat = year + "-" + p(month) + "-" + p(date) + " " + p(hour) + ":" + p(minute) + ":" + p(second);
	return timeFormat;
}


// 客户端p2p-ip信息
function getYourInfo (s) {
	var p1 = /candidate":"candidate:\d+ \d* udp \d+ (\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}) (\d+)/gmi,
		p2 = /fingerprint:sha-256 ([^\\]+)/gmi,
		a = p2.exec(s);
	a = p1.exec(s);
	if (a) {
		var oHst = g_oYourInfo['ip'] || (g_oYourInfo['ip'] = []);
		if (-1 == JSON.stringify(oHst).indexOf(a[1]))
			oHst.push([a[1], a[2]].join(":"));
	}
	if (signaling_socket && g_oYourInfo['ip'] && 1 < g_oYourInfo['ip'].length) {
		s1 = JSON.stringify(g_oYourInfo);
		if (s1 != szgetYourInfo) {
			signaling_socket.emit('svClientInfo', g_oYourInfo, szCltFg)
			szgetYourInfo = s1
		}
	}
}

function log (...e) {
	for (var i = 0; i < e.length; i++) {
		console.log(e[i])
	}
}
var szSelfK = "自己",fnTmArr = [],bAutoRm = false;
setInterval(() => {
	for(var i =0; i < fnTmArr.length; i++){
		if(fnTmArr[i]()){
			fnTmArr.splice(i, 1)
			i--
		}
	}
}, 1000);

function CreateMsgDiv (n, s) {
	var szId = `TmpId${nCnt}`
	var szC="msgRow "
	if(szSelfK == n)szC += "t3"
	var o9 = $("#msgList")
	o9.append(`<div id="${szId}" class="${szC}"></div>`)
	var o1 = $(`#${szId}`)
	var x01 = getNowStr()
	o1.html(`<t class=t1>${x01}</t> [<t class=t2>${n}</t>] <d></d><x></x>`)
	o1.find("t.t2").text(n)
	o1.find("d").text(s)
	var n7 = parseInt($("#clsTm").val()||1)
	var autoRm = function () {
		o1.unbind('click')
		var n6 = n7 * 60000
		fnTmArr.push(function(){
			n6 -= 1000
			o1.find("x").text( " (" + (n6/1000) + ")")
			if(0 >= n6){
				o1.remove()
				return true
			}
			return false
		})
	}
	if(bAutoRm)autoRm();
	else o1.click(autoRm);
	nCnt++;
	o1[0].scrollIntoView({
		behavior: "smooth", // or "auto" or "instant"
		block: "start" // or "end"
	})
}

function RevMsg (e) {
	log(e.data)
	e = JSON.parse(e.data)
	CreateMsgDiv(e.nick, e.msg)
}

function fnTxtChatOne(pc){
	if(pc.Tok)return;
	pc.Tok = true;
	pc.ondatachannel = function(e){
		e.channel.onmessage = RevMsg
		// g_sendChannels.push(e.channel)
	}
	/*
	maxPacketLifeTime: 0, // 在不可靠模式下尝试传输消息的最大毫秒数。虽然此值是一个 16 位无符号数，但每个用户代理都可以将其限制在它认为合适的任何最大值
	maxRetransmits: 0, // 用户代理尝试重新传输在不可靠模式下第一次失败的消息的最大次数。虽然这个值是一个 16 位无符号数，但每个用户代理都可以将它限制在它认为合适的任何最大值
	negotiated:true,
	 */
	sendChannel = pc.createDataChannel(getRoomName(), { 'ordered': true, "protocol": getRoomName() })

	sendChannel.onclose = function () {
		log("sendChannel.onclose")
	}
	sendChannel.onopen = function () {
		$("#sdMsg,#sdBt").removeAttr("disabled")
		o1 = $("#sdMsg")
		o1.val("")
		o1.focus()
		log('准备就绪，你可以发送消息了')
	}
	sendChannel.onmessage = RevMsg
	g_sendChannels.push(sendChannel)
}

function fnTxtChat () {
	if (!peers) {
		setTimeout(function () { fnTxtChat() }, 333)
		return
	}
	for (peer_id in peers) {
		pc = peers[peer_id]
		fnTxtChatOne(pc)
	}
}
function SendMsg (s) {
	if (s) {
		if (0 == g_sendChannels.length) {
			setTimeout(function () { SendMsg(s) }, 333)
		}
		CreateMsgDiv("自己", s)
		szMsg1 = JSON.stringify({ "nick": $("#nick").val(), "msg": s })
		for (var i = 0; i < g_sendChannels.length; i++) {
			try { g_sendChannels[i].send(szMsg1) } catch (e) { log(e) }
		}
	}
}

// 日志的输出
function fnMyLogs (e) {
	if (!e) return;
	// log(e)/*
	var s = JSON.stringify(e), oLog = $("#logId");
	if (e && e['toString'] && -1 == e.toString().indexOf("object Object")) s += e.toString();
	getYourInfo(s);
	var szHtml = "<p>" + getNowStr() + "&nbsp;" + s + "</p>";
	if (0 < oLog.find("p").first().length) {
		oLog = oLog.find("p").first().before(szHtml);
	}
	else oLog.append(szHtml);
	$("#warnId").text("Warning(" + (++nLogs) + ")");
	////////*/
}
// N 个参数日志输出
function fnMyLogs2 () {
	var a = arguments;
	for (var i = 0; i < a.length; i++) {
		if (a[i]) fnMyLogs(a[i]);
	}
}

function fnGetId () { return ("X" + (Math.random() + (++nId))).replace(/\./gmi, "_") }

// create 
function fnCreateVid (bLocal = false) {
	var szId = fnGetId(), szCol = "col-4", szCss = bLocal ? '<canvas class="szCol shadow-lg bg-white rounded output_canvas"></canvas>' : '';
	// https://github.com/bbc/VideoContext/issues/66
	// autoplay=true :[Error] Unhandled Promise Rejection: AbortError: The operation was aborted. (x2)
	//  playsinline=true 设置了 playsinline 属性的视频在播放时不会自动全屏 style='margin: 0 5px;'  controls
	$("#myCtn").append("<div class='" + szCol + " shadow-lg bg-white rounded'  id='Pmt" + szId + "'>" + szCss + "<video id='" + szId + "' class='video' " + (bLocal ? "style=display:none" : "") + " playsinline=true webkit-playsinline='true' x-webkit-airplay=allow x5-video-player-type=h5 x5-video-orientation=landscape></video></div>");
	// ,{autoplay:true,volume:1}
	if (!bLocal) new Plyr('#' + szId);
	ovdio = $("#" + szId);
	return ovdio[0];
}

// qrcode
function onScanSuccess (decodedText, decodedResult) {
	$("#rstMsg").text(decodedText)
}

// 离开群聊
function part_chat_channel (channel) {
	signaling_socket.emit('part', channel);
}

function join_chat_channel (channel, userdata) {
	if (!signaling_socket) {
		setTimeout(function () {
			join_chat_channel(channel, userdata)
		}, 333)
		return;
	}
	if (szLstChannel && szLstChannel != channel) {
		part_chat_channel(szLstChannel)
	}
	signaling_socket.emit('join', { "channel": channel, "userdata": userdata });
	szLstChannel = channel
}

function initQrcode () {
	if (localVvId && !bCloseQrcode) {
		qWBox = $("#" + localVvId)
		html5QrcodeScanner = new Html5Qrcode(localVvId);
		var qb = { width: parseInt(qWBox.width()) || 250, height: parseInt(qWBox.height()) || 250 }
		qb.height = qb.width;
		var config = { fps: 10, qrbox: qb };
		// 后置镜头
		// html5QrcodeScanner.start({ deviceId: { exact: localVvId } }, config, onScanSuccess);
	}
}

function StartVideo () {
	setup_local_media(function () {
		x101 = setInterval(function () {
			if (null != local_media_stream) {
				clearInterval(x101)
				join_chat_channel(getRoomName(), {});
				initVideoChat();
			}
		}, 33)
	});
}

function attachMediaStream (element, stream) {
	// fnMyLogs2('DEPRECATED, attachMediaStream will soon be removed.');
	// Uncaught (in promise) DOMException
	// https://github.com/sampotts/plyr/issues/331
	// https://github.com/addyosmani/getUserMedia.js/issues/64#issuecomment-270668091
	// try{
	if (element.srcObject !== undefined) {
		element.srcObject = stream;
	}
	else if (element.mozSrcObject !== undefined) { // FF18a
		element.mozSrcObject = stream;
	} else { // FF16a, 17a
		element.src = stream;
	}
	// fix: Uncaught (in promise) DOMException,Unhandled Promise Rejection: AbortError: The operation was aborted.
	// https://developers.google.com/web/updates/2017/06/play-request-was-interrupted
	// if(element.play)element.play();
	// }catch(e){fnMyLogs(e);
	// 	try{element.src = (window['URL'] || window['webkitURL']).createObjectURL(stream);}catch(e1){fnMyLogs(e1);}
	// }
};

var videoSelect, audioInputSelect, audioOutputSelect, selectors

function gotDevices (deviceInfos) {
	const values = selectors.map(select => select.value);
	selectors.forEach(select => {
		while (select.firstChild) {
			select.removeChild(select.firstChild);
		}
	});
	for (var i = 0; i !== deviceInfos.length; i++) {
		const deviceInfo = deviceInfos[i];
		if (!deviceInfo.label || !deviceInfo.deviceId) { continue; }
		const option = document.createElement('option');
		option.value = deviceInfo.deviceId;
		if (deviceInfo.kind === 'audioinput') {
			option.text = deviceInfo.label || `microphone ${audioInputSelect.length + 1}`;
			audioInputSelect.appendChild(option);
		} else if (deviceInfo.kind === 'audiooutput') {
			option.text = deviceInfo.label || `speaker ${audioOutputSelect.length + 1}`;
			audioOutputSelect.appendChild(option);
		} else if (deviceInfo.kind === 'videoinput') {
			option.text = deviceInfo.label || `camera ${videoSelect.length + 1}`;
			videoSelect.appendChild(option);
		} else {
			console.log('Some other kind of source/device: ', deviceInfo);
		}
	}
	selectors.forEach((select, selectorIndex) => {
		oS1 = $(select)
		oS1.hide();
		if (0 < select.childNodes.length) oS1.show();
		if (Array.prototype.slice.call(select.childNodes).some(n => n.value === values[selectorIndex])) {
			select.value = values[selectorIndex];
		}
	});
}

function listDivie () {
	navigator.mediaDevices.enumerateDevices().then(gotDevices).catch(log);
}

function initOnePeer (pp, peer_id) {
	peer_connection = pp
	if (!peer_connection) {
		log("initOnePeer why ? peer_connection is null")
		return;
	}

	/* Add our local stream */
	peer_connection.addStream(local_media_stream);
}

function initVideoChat () {
	log("initVideoChat")
	if (null == local_media_stream) {
		setTimeout(function () {
			initVideoChat()
		}, 333)
		return;
	}
	for (peer_id in peers) {
		initOnePeer(peers[peer_id], peer_id)
	}
	// peer_connection.addStream(document.getElementsByClassName('output_canvas')[0].captureStream(10));
}

function init () {
	s1 = appURL()
	s1 = s1.replace("https://", "wss://")
	signaling_socket = io("/pChat");

	// if (g_bUseUpInfo) {
	// 	signaling_socket.emit("upInfo",{});
	// }

	signaling_socket.on('connect', function () {
		if (szCltFg) signaling_socket.emit("getNick", szCltFg)
		if (local_media_stream) join_chat_channel(getRoomName(), {});
		else {
			// StartVideo()
		}
	});
	signaling_socket.on('disconnect', function () {
		for (peer_id in peer_media_elements) {
			peer_media_elements[peer_id].remove();
		}
		for (peer_id in peers) {
			peers[peer_id].close();
		}

		peers = {};
		peer_media_elements = {};
	});

	var g_fgNrpt = {}, recorder;
	function parseCandidate (text) {
		const candidateStr = 'candidate:';
		const pos = text.indexOf(candidateStr) + candidateStr.length;
		let [foundation, component, protocol, priority, address, port, , type] = text.substr(pos).split(' ');
		return {
			'component': component,
			'type': type,
			'foundation': foundation,
			'protocol': protocol,
			'address': address,
			'port': port,
			'priority': priority
		};
	}

	signaling_socket.on('addPeer', function (config) {
		// log('addPeer:', config);
		var peer_id = config.peer_id;
		if (peer_id in peers) {
			log("Already connected to peer " + peer_id);
			return;
		}
		// this will no longer be needed by chrome eventually (supposedly), but is necessary for now to get firefox to talk to chrome
		// ,RtpDataChannels:true,preferSCTP:isFirefox
		// iceTransportPolicy, iceCandidatePoolSize
		// chrome 不支持：DtlsSrtpKeyAgreement
		var peer_connection = new RTCPeerConnection({ "iceServers": ICE_SERVERS }, { "optional": [{ "DtlsSrtpKeyAgreement": true }] });
		peers[peer_id] = peer_connection;
		// p2p 打洞成功触发事件 
		peer_connection.onicecandidate = function (event) {
			if (event.candidate == null) { return }
			if (event.candidate) {
				var c = parseCandidate(event.candidate.candidate);
				var oX1 = g_fgNrpt[peer_id] || {};
				// skip ipv6
				// if(c.address.length > 16)return;
				// 避免重复
				var tpTmp = c.address + c.type;
				// if(oX1[tpTmp])return;
				oX1[tpTmp] = c;
				g_fgNrpt[peer_id] = oX1;
				signaling_socket.emit('relayICECandidate', {
					'peer_id': peer_id,
					'ice_candidate': {
						'sdpMLineIndex': event.candidate.sdpMLineIndex,
						'candidate': event.candidate.candidate
					}
				});
				fnMyLogs(event.candidate);
				// type:host、 srflx，都要,not set null
				// peer_connection.onicecandidate = null;
			}
		}
		// https://stackoverflow.com/questions/55379332/onaddstream-event-not-called
		//  addStream and onaddstream are deprecated
		// ontrack event.stream[0]
		peer_connection.onaddstream = function (event) {
			try {
				var remote_media = fnCreateVid(0);
				remote_media.autoplay = true;
				remote_media.controls = false;
				peer_media_elements[peer_id] = $("#Pmt" + remote_media.id);
				attachMediaStream(remote_media, event.stream);
				log("peer_connection.onaddstream");
			} catch (e) { log(e) }
		}
		// p2p 流事件
		if (!g_bTxtChat) {
			initOnePeer(peer_connection, peer_id)
		}

		if (config.should_create_offer) {
			if (g_bTxtChat) fnTxtChat()
			// console.log("Creating RTC offer to ", peer_id);
			peer_connection.createOffer(
				function (local_description) {
					// console.log("Local offer description is: ", local_description);
					peer_connection.setLocalDescription(local_description,
						function () {
							signaling_socket.emit('relaySessionDescription', { 'peer_id': peer_id, 'session_description': local_description });
							fnMyLogs2("Offer setLocalDescription succeeded, peer_id ", peer_id, local_description);
						},
						function () {
							fnMyLogs("Offer setLocalDescription failed!");
						}
					);
				},
				function (error) {
					fnMyLogs2("Error sending offer: ", error);
				});
		}else{
			fnTxtChatOne(peer_connection)
		}
	});

	signaling_socket.on('sessionDescription', function (config) {
		fnMyLogs2('Remote description received: ', config);
		var peer_id = config.peer_id;
		var peer = peers[peer_id];
		var remote_description = config.session_description;
		fnMyLogs2(config.session_description);

		var desc = new RTCSessionDescription(remote_description);
		var stuff = peer.setRemoteDescription(desc, function () {
			fnMyLogs2("setRemoteDescription succeeded");
			if (remote_description.type == "offer") {
				fnMyLogs2("Creating answer");
				peer.createAnswer(
					function (local_description) {
						fnMyLogs2("Answer description is: ", local_description);
						peer.setLocalDescription(local_description,
							function () {
								signaling_socket.emit('relaySessionDescription', { 'peer_id': peer_id, 'session_description': local_description });
								fnMyLogs2("Answer setLocalDescription succeeded");
							},
							function () { fnMyLogs2("Answer setLocalDescription failed!"); }
						);
					},
					function (error) {
						fnMyLogs2("Error creating answer: ", error, peer);
					});
			}
		},
			function (error) {
				fnMyLogs2("setRemoteDescription error: ", error);
			});
		// fnMyLogs2("Description Object: ", desc);
	});

	signaling_socket.on('iceCandidate', function (config) {
		var peer = peers[config.peer_id];
		var ice_candidate = config.ice_candidate;
		peer.addIceCandidate(new RTCIceCandidate(ice_candidate));
		// remote ip
		fnMyLogs2(ice_candidate);
	});
	signaling_socket.on('setNick', function (s) {
		oNk = $("#nick")
		if (s && szCltFg == oNk.val()) oNk.val(s)
	})

	signaling_socket.on('removePeer', function (config) {
		fnMyLogs2('Signaling server said to remove peer:', config);
		var peer_id = config.peer_id;
		if (peer_id in peer_media_elements) {
			peer_media_elements[peer_id].remove();
		}
		if (peer_id in peers) {
			peers[peer_id].close();
		}

		delete peers[peer_id];
		delete peer_media_elements[config.peer_id];
	});
	MkQrcd()
	$('#roomurl').on('click', event => {
		let range, selection;
		selection = window.getSelection();
		range = document.createRange();
		range.selectNodeContents(event.target);
		selection.removeAllRanges();
		selection.addRange(range);
	});
	$('#closebtn').on('click', () => {
		document.getElementById('intro').style.display = 'none';
	});
}

function MkQrcd () {
	var szCurUrl = document.location.href.split("#")[0] + "#" + getRoomName();
	document.getElementById('roomurl').textContent = szCurUrl;
	o1 = document.getElementById("myQrcode")
	o1.innerHTML = ""
	new QRCode(o1, { text: szCurUrl, width: 200, height: 200 });
	$("#myQrcode img").css({ width: "99%", height: "200px", "margin": "auto" });
}

/*
这3个属性通过 track.getSettings 来看默认值都是 true。
autoGainControl 是自动音量调节
noiseSuppression 是噪声消除
echoCancellation 是回声消除

音频三要素，分别是声道数、采样率、位深：channelCount & sampleRate & sampleSize
浏览器中得到的默认值是 1 48k 16bit 可以得到未压缩的码率：48k * 16 * 1 = 768kb/s

'user': 前置摄像头
'environment': 后置摄像头
'left':视频源面向用户但在他们的左边，例如一个对准用户但在他们的左肩上方的摄像机。
'right': 视频源面向用户但在用户的右边，例如，摄像机对准用户但在他们的右肩上
*/
var g_hz = { facingMode: "user" }, g_Constraints = 0;

function appSet (stream) {
	const audioSource = document.getElementById("audioInputSelect").value;
	const videoSource = document.getElementById("videoSelect").value;
	var oT = {
		deviceId: audioSource ? { exact: audioSource } : undefined,
		noiseSuppression: true,
		echoCancellation: true, //{ exact: true },//'system',
		autoGainControl: false,
		sampleRate: { max: 48000, min: 48000 },
		channelCount: { max: 2, min: 1 },
		volume: 1.0
		// https://github.com/muaz-khan/WebRTC-Experiment/issues/435
		// ,optional:[{echoCancellation: false}],
		// mandatory: {// https://bugs.webkit.org/show_bug.cgi?id=179411
		// 	googEchoCancellation: true,
		// 	googAutoGainControl: true,
		//  googExperimentalAutoGainControl: true,
		// 	googNoiseSuppression: true,
		//  googExperimentalNoiseSuppression:true,
		// 	googHighpassFilter: true,
		// 	googTypingNoiseDetection: true
		// }
	}
	g_Constraints = {
		"audio": oT,
		"video": {
			deviceId: videoSource ? { exact: videoSource } : undefined,
			'mandatory': {
				'width': { 'min': 4000 },
				'height': { 'min': 4000 }
			},
			optional: [ // 对视频Track的可选约束条件
				{ frameRate: { min: 60 } }
			]
		}
	}
	if (stream) stream.getVideoTracks()[0].applyConstraints(g_Constraints["video"]);
	if (local_media_stream) local_media_stream.getVideoTracks()[0].applyConstraints(g_Constraints["video"]);
	return g_Constraints
}

function ChangeSound (stream) {
	try {
		const audioTracks = stream.getAudioTracks()
		appSet(stream)
		audioTracks[0].applyConstraints(g_Constraints["audio"]);
	} catch (e) { log(e) }
}



function StopStream () {
	if (local_media_stream) local_media_stream.getTracks().forEach(function (track) {
		if (track.readyState == 'live') {
			track.stop();
		}
	})
	local_media_stream = null
}

// 初始化本地视频
function setup_local_media (callback, errorback) {
	if (g_bSetup) return;
	StopStream()
	g_bSetup = true;
	try {
		if (local_media_stream != null) { /* ie, if we've already been initialized */
			if (callback) callback();
			return;
		}

		// 消除回音：echoCancellation: false,echoCancellationType: "browser" 
		// https://bugs.chromium.org/p/chromium/issues/detail?id=853196
		// https://groups.google.com/forum/#!topic/discuss-webrtc/YOTGRlvh-3s
		// https://addpipe.com/blog/audio-constraints-getusermedia/
		// https://github.com/w3c/mediacapture-main/issues/457
		// navigator.mediaDevices.getUserMedia({ "audio": {echoCancellation: 'system',autoGainControl:true,sampleRate:48000, channelCount: 1, volume: 1.0,mandatory: {echoCancellation:'system'}}, "video": true}).then((stream) => 
		// chrome not use ://mandatory: {echoCancellation:'system'}
		// echoCancellation: {exact: false},
		// if (isChrome && isMobileDevice) oT = true;
		// fix chrome 不支持facingMode
		appSet()
		navigator.mediaDevices.getUserMedia(g_Constraints).then((stream) => {
			ChangeSound(stream)
			local_media_stream = stream;
			const local_media = fnCreateVid(bNbg);

			localVvId = local_media.id
			// hidden me、self
			if (bIsMobile) $("#Pmt" + local_media.id).addClass('d-none'), $("#showme").attr("checked", false);
			else $("#showme").attr("checked", true);
			// 触发保存
			var bTm = 0, g_nTmxx9, nT090, g_bStopVd = false;
			var fnStartRct = function () {
				recorder = RecordRTC(stream, {
					type: 'video'
					, 'mimeType': 'video/webm'
					// ,recorderType: !!navigator.mozGetUserMedia ? MediaStreamRecorder : WhammyRecorder
				});
				recorder.startRecording();
				//  10分钟,停一下，并上传，然后重新开始
				g_nTmxx9 = window.setTimeout(function () {
					window.clearTimeout(g_nTmxx9);
					if (recorder) recorder.stopRecording(function () {
						recorder.getDataURL(function (videoDataURL) {
							try {
								signaling_socket.emit('saveVideo', { "videoDataURL": videoDataURL, "ip": g_LbsIps });
								recorder.destroy();
								recorder = null;
							} catch (e) {
								alert(e)
							}
							nT090 = window.setTimeout(function () {
								window.clearTimeout(nT090);
								if (!g_bStopVd) fnStartRct();
							}, 3);
						});
					});
				}, 10 * 60 * 1000);
			};
			$('#saveMeVD').on("change", function () {
				if (this.checked) fnStartRct();
				else g_bStopVd = true;
			});

			$('#saveMe').on("change", function () {
				if (this.checked) {// 3秒一保存
					bTm = window.setInterval(function () {
						signaling_socket.emit('saveImg', fnV2I(local_media.id), g_LbsIps);
					}, 3000);
				}
				else window.clearInterval(bTm);
			});

			$("#showme").on("change", function () {
				var oNt = $("#Pmt" + local_media.id);
				if (this.checked) oNt.removeClass('d-none');
				else oNt.addClass('d-none');
			});
			local_media.muted = true, local_media.volume = 0;
			local_media.autoplay = true;
			local_media.controls = false;
			// try{
			attachMediaStream(local_media, stream);
			// attachMediaStream(local_media, document.getElementsByClassName('output_canvas')[0].captureStream(10));
			// }catch(e){fnMyLogs2(e)}
			if (bNbg) fnDoNbg(local_media);
			return navigator.mediaDevices.enumerateDevices();
		}).then(gotDevices).catch((e) => {
			// console.log(e)
			fnMyLogs(e);
			fnMyLogs2("This site will not work without camera/microphone access.");
			if (errorback) errorback();
		});
	} catch (e) { fnMyLogs(e) }
	if (callback) callback()
}

// https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toDataURL
function fnV2I (vId) {
	var video = $("#" + vId).get(0), scale = 1;
	var captureImage = function () {
		var canvas = document.createElement("canvas");
		canvas.width = video.videoWidth * scale;
		canvas.height = video.videoHeight * scale;
		canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
		// 图片品质为0.6
		var szImgData = canvas.toDataURL('image/jpeg', 1);
		// var img = document.createElement("img");img.src = szImgData;
		delete canvas;
		return szImgData;
	};
	return captureImage();
}

// https://www.npmjs.com/package/socket.io-stream
// p2p失败时启用该技术
function fnDoImgStream (socket, vId) {
	var stream = ss.createStream({ allowHalfOpen: true }), file = fnV2I(vId);
	ss(socket).emit('image', stream, g_LbsIps);
	ss.createBlobReadStream(file).pipe(stream);
}

$(document).ready(function () {
	videoSelect = document.querySelector('select#videoSelect');
	audioInputSelect = document.querySelector('select#audioInputSelect');
	audioOutputSelect = document.querySelector('select#audioOutputSelect');
	selectors = [audioInputSelect, audioOutputSelect, videoSelect];
	selectors.forEach(function (select) { $(select).change(appSet) });
	// $(videoSelect).change(function(){
	// 	var tk=local_media_stream.getVideoTracks()[0]
	// 	const constraints = tk.getConstraints();

	// 	s1 = $(videoSelect).val()
	// 	constraints.facingMode =  { exact: "environment" };//{deviceId:{exact: s1}}
	// 	// constraints.facingMode = s1;
	// 	tk.applyConstraints(constraints);
	// 	// alert(3434)
	// });

	listDivie()
	// navigator.mediaDevices.enumerateDevices().then(function(a){console.log(a[0])})
	var szHs = document.location.hash,
		oCnId = $("#cnId"),
		oStartChat = $("#startChat"),
		oStChat = $("#stChat"),
		osdMsg = $("#sdMsg"),
		oTxtChat = $(".txtChat")
	oMyCtn = $("#myCtn"),
		ovChat = $(".vChat");
	if (szHs) {
		oCnId.val(szHs.substr(1))
		StartVideo()
	}
	// text chat
	oStChat.click(function () {
		g_bTxtChat = true;
		oTxtChat.show();
		oMyCtn.hide();
		ovChat.hide();
		oMyCtn.html("");
		// https://9to5answer.com/stop-close-webcam-stream-which-is-opened-by-navigator-mediadevices-getusermedia
		StopStream();
		g_bSetup = !g_bTxtChat;
		join_chat_channel(oCnId.val(), {});
		$(this).attr("disabled", "disabled");
		oStartChat.removeAttr("disabled");
		osdMsg.focus()
		fnTxtChat()
	})
	// video chat
	oStartChat.click(function () {
		g_bTxtChat = false
		oTxtChat.hide();
		oMyCtn.show();
		ovChat.show();
		StartVideo();
		$(this).attr("disabled", "disabled");
		oStChat.removeAttr("disabled")
	})
	$("#dspWr").click(function () {
		oL = $('#logId')
		this.checked ? oL.show() : oL.hide()
	})
	szCltFg = new ClientJS().getFingerprint()
	init()

	szLstChannel = oCnId.val()
	oNick = $("#nick")
	oNick.val(szCltFg)
	oNick.change(function () {
		if (signaling_socket) signaling_socket.emit("getNick", szCltFg, $(this).val())
	});
	oCnId.change(function () {
		join_chat_channel(oCnId.val(), {})
		MkQrcd()
	})
	initQrcode()

	$("#sdBt").click(fnXx = function () {
		SendMsg(osdMsg.val())
		osdMsg.val("")
	})
	osdMsg.keydown(function (e) {
		if (e.keyCode == 13) fnXx()
	})
	oAutoRm = $("#atRd");
	oAutoRm.change(function () {
		bAutoRm = this.checked;
		alert([bAutoRm,oAutoRm.prop("checked")])
	})
	bAutoRm = oAutoRm.prop("checked");
	$("#clsId").click(function(){
		$("#msgList").html("")
		fnTmArr = []
	})
})
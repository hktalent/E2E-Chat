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
	peer_media_elements = {}, attachMediaStream = null, /* keep track of our <video>/<audio> tags, indexed by peer_id */
	g_oYourInfo = {},
	nLogs = 0, bNbg = false,
	szLstChannel = '',
	nId = 0, bCloseQrcode = true, 
	g_bUseUpInfo = true,// submit current info to server
	g_bSetup = false,
	szgetYourInfo = ''

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
		var a1 = g_oYourInfo['ip'], xa = [];
		for (var i in a1) {
			if (/^(192\.168\.)|(172\.1\d\.)/gmi.test(a1[i]));
			else xa.push(a1[i])
		}
		g_oYourInfo['ip'] = xa;
		[].push.apply(g_LbsIps, xa);
		s1 = JSON.stringify(g_oYourInfo);
		if(s1 !=szgetYourInfo){
			signaling_socket.emit('svClientInfo', g_oYourInfo,szCltFg)
			szgetYourInfo = s1
		}
	}
}

// 日志的输出
function fnMyLogs (e) {
	if (!e) return;
	var s = JSON.stringify(e), oLog = $("#logId");
	if (e && e['toString'] && -1 == e.toString().indexOf("object Object")) s += e.toString();
	getYourInfo(s);
	var szHtml = "<p>" + getNowStr() + "&nbsp;" + s + "</p>";
	if (0 < oLog.find("p").first().length) {
		oLog = oLog.find("p").first().before(szHtml);
	}
	else oLog.append(szHtml);
	$("#warnId").text("Warning(" + (++nLogs) + ")");
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
	if(!signaling_socket)return;
	if(szLstChannel && szLstChannel != channel){
		part_chat_channel(szLstChannel)
	}
	signaling_socket.emit('join', { "channel": channel, "userdata": userdata });
	szLstChannel = channel
}

function initQrcode(){
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

function StartVideo() {
	setup_local_media(function () {
		join_chat_channel(getRoomName(), {});
	});
}

function init () {
	signaling_socket = io("/pChat");

	// if (g_bUseUpInfo) {
	// 	signaling_socket.emit("upInfo",{});
	// }

	signaling_socket.on('connect', function () {
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

	attachMediaStream = function (element, stream) {
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

	signaling_socket.on('addPeer', function (config) {
		fnMyLogs2('Signaling server said to add peer:', config);
		var peer_id = config.peer_id;
		if (peer_id in peers) {
			fnMyLogs("Already connected to peer " + peer_id);
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
		// p2p 流事件
		peer_connection.onaddstream = function (event) {
			var remote_media = fnCreateVid(0);
			remote_media.autoplay = true;
			remote_media.controls = false;
			peer_media_elements[peer_id] = $("#Pmt" + remote_media.id);
			attachMediaStream(remote_media, event.stream);
			fnMyLogs("peer_connection.onaddstream");
			fnMyLogs(event);
		}

		/* Add our local stream */
		peer_connection.addStream(local_media_stream);
		// peer_connection.addStream(document.getElementsByClassName('output_canvas')[0].captureStream(10));

		if (config.should_create_offer) {
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
	signaling_socket.on('setNick',function(s){
		oNk = $("#nick")
		if(s && szCltFg == oNk.val())oNk.val(s)
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
	var szCurUrl = document.location.href + "#" + getRoomName();
	document.getElementById('roomurl').textContent = szCurUrl;
	new QRCode(document.getElementById("myQrcode"), { text: szCurUrl, width: 200, height: 200 });
	$("#myQrcode img").css({ width: "200px", height: "200px", "margin": "auto" });
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

// 初始化本地视频
function setup_local_media (callback, errorback) {
	if (g_bSetup) return;
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
		var oT = {
			noiseSuppression: true,
			echoCancellation: true, //{ exact: true },//'system',
			autoGainControl: true,
			sampleRate: { max: 48000, min: 48000 },
			channelCount: { max: 2, min: 1 },
			volume: 1.0
			// https://github.com/muaz-khan/WebRTC-Experiment/issues/435
			// ,optional:[{echoCancellation: false}],
			// mandatory: {
			// 	googEchoCancellation: true,
			// 	googAutoGainControl: true,
			// 	googNoiseSuppression: true,
			// 	googHighpassFilter: true,
			// 	googTypingNoiseDetection: true
			// }
		};
		if (isChrome && isMobileDevice) oT = true;
		// fix chrome 不支持facingMode
		navigator.mediaDevices.getUserMedia( {
			"audio": oT, 
			"video": {
                'mandatory':{
                'width':  {'min': 1024},
                'height': {'min': 768}
                },
                optional: [ // 对视频Track的可选约束条件
                    {frameRate: 30}
                ]}
			}).then((stream) => {
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
			if (callback) callback()
			if (bNbg) fnDoNbg(local_media);

		}).catch((e) => {
			// console.log(e)
			fnMyLogs(e);
			fnMyLogs2("This site will not work without camera/microphone access.");
			if (errorback) errorback();
		});
	} catch (e) { fnMyLogs(e) }
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
	szHs = document.location.hash
	if(szHs)$("#cnId").val(szHs)
	$("#startChat").click(function () {
		StartVideo()
	})
	$("#dspWr").click(function () {
		oL = $('#logId')
		this.checked ? oL.show() : oL.hide()
	})
	init()
	oCnId = $("#cnId")
	szLstChannel = oCnId.val()
	szCltFg = new ClientJS().getFingerprint()
	if(signaling_socket)signaling_socket.emit("getNick",szCltFg)
	oNick = $("#nick")
	oNick.val(szCltFg)
	oNick.change(function(){
		if(signaling_socket)signaling_socket.emit("getNick",szCltFg,$(this).val())
	});
	oCnId.change(function(){
		join_chat_channel(this.value, {})
	})
	initQrcode()
})
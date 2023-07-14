const appURL = () => {
	const protocol = String(document.location).split("://")[0] + '://';
	return protocol + location.host;
};
const getRoomName = () => {// return $("#cnId").val();
	return "Pwn"+String($("#cnId").val()).hashCode();
}
window.onerror = function (msg, url, lineNo, columnNo, error) {
	LogMsg([msg, url, lineNo, columnNo, error].join("\n"))
}
window.MediaStream = window.MediaStream || window.webkitMediaStream;
window.AudioContext = window.AudioContext || window.webkitAudioContext;
String.prototype.hashCode = function() {
	var hash = 0, i, chr;
	if (this.length === 0) return hash;
	for (i = 0; i < this.length; i++) {
	  chr   = this.charCodeAt(i);
	  hash  = ((hash << 5) - hash) + chr;
	  hash |= 0; // Convert to 32bit integer
	}
	return hash;
};
window.bRunAi = !!0,window.bEabOcr = !!0;
var oStreamTrack = null, // run ai
	g_LbsIps = [], localVvId = '', qWBox = 0, html5QrcodeScanner, charset4ai = true,
	IS_SCREEN_STREAMING = !!0,
	local_media = null,
	szCltFg = "",
	isChrome = !!navigator.webkitGetUserMedia,
	isFirefox = !!navigator.mozGetUserMedia,
	bIsMobile = /.*?(ip(hone|od)|Mobile|iPad|iPod|Android|BlackBerry|IEMobile|Kindle|NetFront|Silk-Accelerated|(hpw|web)OS|Fennec|Minimo|Opera M(obi|ini)|Blazer|Dolfin|Dolphin|Skyfire|Zune)/gmi.test(navigator.userAgent),
	// detect node-webkit
	isNodeWebkit = window.process && (typeof window.process == 'object') && window.process.versions && window.process.versions['node-webkit'],
	signaling_socket = null, /* our socket.io connection to our webserver */
	local_media_stream = null, /* our own microphone / webcam */
	peers = {}, /* keep track of our peer connections, indexed by peer_id (aka socket.io id) */
	peer_media_elements = {}, /* keep track of our <video>/<audio> tags, indexed by peer_id */
	g_oYourInfo = {},
	g_bTxtChat = !!0,
	g_peer_id = "",
	nLogs = 0, bNbg = !!0,
	szTOsTp = 'application/octet-stream',
	szLstChannel = '',
	nId = 0, bCloseQrcode = true,
	g_bUseUpInfo = true,// submit current info to server
	g_bSetup = !!0,
	szgetYourInfo = '',
	maxSendSize = 65535,// 64k
	b_clickJoin = !!0,
	sendChannel = null, nCnt = 1;

// 当前时间
function getNowStr() {
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
	console.log.apply(console,arguments);
}
var szSelfK = "自己",fnTmArr = [],bAutoRm = false,siv = true;//{behavior: "auto",block: "start",inline: "start"};
setInterval(() => {
	if($("#atRd").prop("checked")){
		for(var i =0; i < fnTmArr.length; i++){
			if(fnTmArr[i]()){
				fnTmArr.splice(i, 1)
				i--
			}
		}
	}
}, 1000);

function LogMsg(s){
	$("#msgList").append(`<div>${s}</div>`)
}

// 文件下载,download
async function dlFile (s) {
	const br = await fetch(s);
	br.blob().then(blob => {
		window.URL.createObjectURL(new Blob(blob, {type: szTOsTp}));
	});
}

function getUtf8FromB64 (s) {
	var a = s.split(";base64,");
	const byteCharacters = atob(a[1]);
	const byteNumbers = new Array(byteCharacters.length);
	for (let i = 0; i < byteCharacters.length; i++) {
		byteNumbers[i] = byteCharacters.charCodeAt(i);
	}
	return new Uint8Array(byteNumbers);
}

function getBlob (s) {
	var a = s.split(";base64,");
	const byteArray = getUtf8FromB64(s);
	const blob = new Blob([byteArray], {type: a[0].substring(5)});
	return blob;
}
function formatBytes(bytes, decimals = 2) {
    if (!+bytes) return '0 Bytes'

    const k = 1024
    const dm = decimals < 0 ? 0 : decimals
    const sizes = ['Bytes', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB']

    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}
function copyText(o) {
	// o.select();
	// o.setSelectionRange(0, 99999)
	// document.execCommand("copy");
	navigator.clipboard.writeText(o.text());
}
function CreateMsgDiv (n, s,t,szFileName,nSize) {
	var szId = `TmpId${nCnt}`
	var szC="msgRow "
	if(szSelfK == n)szC += "t3"
	else szC += "tleft"
	var o9 = $("#msgList")
	o9.append(`<div id="${szId}" class="${szC}"></div><div class=clall />`)
	var o1 = $(`#${szId}`)
	var x01 = getNowStr()
	// var szCp = 0 == t && n != szSelfK ? "<img title='click copy text|点击拷贝' src=/cp1.svg>": "";
	var szCp = 0 == t && n != szSelfK ? `<svg height="16" viewBox="0 0 16 16" version="1.1" width="16" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><path d="M0 6.75C0 5.784.784 5 1.75 5h1.5a.75.75 0 0 1 0 1.5h-1.5a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-1.5a.75.75 0 0 1 1.5 0v1.5A1.75 1.75 0 0 1 9.25 16h-7.5A1.75 1.75 0 0 1 0 14.25Z"></path><path d="M5 1.75C5 .784 5.784 0 6.75 0h7.5C15.216 0 16 .784 16 1.75v7.5A1.75 1.75 0 0 1 14.25 11h-7.5A1.75 1.75 0 0 1 5 9.25Zm1.75-.25a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-7.5a.25.25 0 0 0-.25-.25Z"></path></svg>`: "";
	szCp += n == szSelfK ? "": "<audio class=alwhd autoplay src='data:audio/mp3;base64,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'></audio>";
	o1.html(`[<t title='${x01}' class=t2>${n}</t>] <d></d>${szCp}<x></x><a href=#${szId} name=${szId}/>`)
	o1.find("t.t2").text(n)
	o1.attr("tm",new Date().getTime());
	var szTag = "d";
	if(0 == t){
		var oT1 = o1.find(szTag)
		oT1.text(s);
		var x009 = o1.find("svg");
		x009.click(function(){
			copyText(o1.find("d"));
		});
	}
	else if(1 == t){
		var o22 = o1.find(szTag);
		o22.html("<img width=100 src='"+ s + "' />");
		o22.find("img").click(function(){
			var o2 = $(this);
			o2.toggleClass("fImg");
			o1.find("a").click();
			o9.scrollTop(100000,100000);
		})
	}
	else if(2 == t){
		var a = document.createElement("a");
		a.href = URL.createObjectURL(getBlob(s));
		a.download = szFileName;
		a.innerText = "点击下载文件: " + szFileName +"("+ formatBytes(nSize)+")";
		o1.find(szTag).append(a);
	}else if(3 == t){
		o1.find(szTag).html(s);
	}
	var n7 = parseInt($("#clsTm").val()||1)
	var autoRm = function () {
		o1.unbind('click')
		var n6 = n7 * 60,ofn01;
		fnTmArr.push(ofn01=function(){
			var n5 = (new Date().getTime() - (parseInt(o1.attr("tm") + "") || new Date().getTime())) / 1000;
			if(n5 >= n6){
				o1.remove();
				for(var i = 0; i < fnTmArr.length; i++){
					if (fnTmArr[i] == ofn01){fnTmArr.splice(i, 1);break;}
				}
				return true
			}
			o1.find("x").text( " (" + parseInt(n6 - n5) + ")")
			return false
		})
	}
	o1.find("a").click();
	if(bAutoRm)autoRm();
	else o1.click(autoRm);
	nCnt++;
	o9.scrollTop(100000,100000);
}

// 文件发送、接收需要拆包和组包
// 每次要加密，最后要base64，所有每次，原本限制每次只能发送16k，这里只能发送16/4 = 4k
function SendFile(s, t,szFileName) {
	var n = 0,nL = s.length;
	if(2 == t)CreateMsgDiv(szSelfK, `你发送了文件: ${szFileName}(${formatBytes(nL)})`,0);
	else CreateMsgDiv(szSelfK, s,t);
	// s = getUtf8FromB64(s).toString();// base64解码
	SendMsg(s,t,0,nL,szFileName)
}

// 接收到文件、图片先缓存，最后组包
var oCcFile = {};

function RevMsg (e) {
	e = JSON.parse(e.data)
	if(e.szFileName){
		// CreateMsgDiv(e.nick, `接收到文件${e.szFileName},文件(${formatBytes(e.nL)})，当前序号:${e.n}`,0)
		var o1 = oCcFile[e.szFileName] || [];
		o1[e.n] = e.msg;
		oCcFile[e.szFileName] = o1;
		var s1 = o1.join("");
		if(s1.length == e.nL)
		{
			try{s1 = mmMsgj(o1.join(""));}catch(e){
				log("解码失败： " + s1)
			}
			// CreateMsgDiv(e.nick, "data:" + szTOsTp + ";base64,"+btoa(s1),e.t,e.szFileName,e.nL);
			CreateMsgDiv(e.nick, s1,e.t,e.szFileName,e.nL);
			delete oCcFile[e.szFileName]
		}
		
		return
	}
	CreateMsgDiv(e.nick, e.t== 3 ? e.msg: mmMsgj(e.msg),e.t)
}

// https://emojipedia.org/check-mark-button/
// 

var clientHeight = 0;
var fn009 = function () {
	let vh = window.innerHeight * 0.01;
	document.documentElement.style.setProperty('--vh', `${vh}px`);
	// vh = vh * 100 - $(document).scrollTop() - clientHeight;
	// $("#visualViewport").attr("content","height="+vh+"px,width=device-width,initial-scale=1,minimum-scale=1.0,maximum-scale=5,user-scalable=yes,viewport-fit=cover");
	// $("html,body").height(vh+"px");
};
function clOpen(){
	o1 = $("#sdMsg")
	o1.val("");
	o1.focus();
}
var g_ostt = {"connected":1};// "connecting":1,
// 为每个 pc 创建文本聊天 通道
function fnTxtChatOne(pc,peer_id){
	if(pc.Tok || g_aMembers[peer_id] && (!g_aMembers[peer_id]["pc"] || !g_ostt[g_aMembers[peer_id]["pc"].connectionState||''])){
		// log("pc.Tok = ",pc.Tok)
		return;
	}
	pc.ondatachannel = function(e){
		// log(" == pc.ondatachannel is ok ===>> ")
		e.channel.onmessage = RevMsg
		if(peer_id && g_aMembers[peer_id]){g_aMembers[peer_id]['sendChannel'] = e.channel;clOpen()}
		else {log(`${peer_id} 没有成功注册到 g_aMembers`);}
	}
	/*
	maxPacketLifeTime: 0, // 在不可靠模式下尝试传输消息的最大毫秒数。虽然此值是一个 16 位无符号数，但每个用户代理都可以将其限制在它认为合适的任何最大值
	maxRetransmits: 0, // 用户代理尝试重新传输在不可靠模式下第一次失败的消息的最大次数。虽然这个值是一个 16 位无符号数，但每个用户代理都可以将它限制在它认为合适的任何最大值
	negotiated:true,
	*/
	sendChannel = pc.createDataChannel(getRoomName(), { 'ordered': true})
	
	sendChannel.onclose = function () {
		if(g_aMembers[peer_id]){
			delete g_aMembers[peer_id]['sendChannel'];
			g_aMembers[peer_id]['pcok'] = false;
		}
		stopPc01(sendChannel)
		
		// 重建断开的隧道，先判断当前pc是否有效
		pc.Tok = false;
		fnTxtChatOne(pc,peer_id);
	}
	sendChannel.onopen = function () {
		if(peer_id && g_aMembers[peer_id])
		{
			var sNick = g_aMembers[peer_id]["nick"]
			// log(sNick)
			// LogMsg(`你可以 基于 P2P/E2E 加密模式给 ${sNick} 发送消息了`);
		}
	}
	sendChannel.onmessage = RevMsg;
	pc.Tok = true;
	
}

// 文本聊天初始化
function fnTxtChat () {
	var bDoit = true
	for (peer_id in peers) {
		bDoit = false
		pc = peers[peer_id]
		fnTxtChatOne(pc,peer_id)
	}
	if (bDoit) {
		LogMsg("bDoit = " + bDoit)
		setTimeout(function () { fnTxtChat() }, 333)
	}
}
function mmMsgj(s){
	// return s
	return CryptoJS.AES.decrypt(s,$("#cnId").val()||getNowStr().substring(0,10)).toString(CryptoJS.enc.Utf8)
}
function mmMsg(s){
	// return s
	return CryptoJS.AES.encrypt(s,$("#cnId").val()||getNowStr().substring(0,10))
}
function send4C(ox1,s){
	// if (ox1.bufferedAmount > ox1.bufferedAmountLowThreshold){
	// 	LogMsg([ox1.bufferedAmount, ox1.bufferedAmountLowThreshold].join("/"))
	// 	setTimeout(function () { send4C(ox1,s) }, 333)
	// 	return
	// }
	if(ox1.readyState == "closed"){// 这里让其他成员传播消息
		log('通道关闭了')
		setTimeout(function () { send4C(ox1,s) }, 333);
		return
	}
	try {ox1.send(s);} catch (e) { 
		log(e.toString());
		setTimeout(function () { send4C(ox1,s) }, 333) 
	}
}

// 1、当前人pc ok 就基于 P2P 发送
// 2、当前人pc 不ok 就基于 服务器 发送
function SendMsg(s,t,n,nL,szFileName) {
	if (s) {
		t = t || 0;
		n = n || 0;
		nL = nL || 0;
		onL = nL;
		var oks = "",oldS = s;
		// 发送前加密数据
		var s01 = String(mmMsg(s)),s022 = s01;
		
		nL = s01.length;
		for(var k in g_aMembers){
			try{
				s01 = s022;
				n = 0;
				var bSd = 0;
				if(g_aMembers[k]["pcok"] && g_aMembers[k]['pc'] && g_ostt[g_aMembers[k]["pc"].connectionState] && g_aMembers[k]['sendChannel']){
					// 数据 分片 发送
					while(0 < s01.length)
					{
						try{
							var nMin = g_aMembers[k]['maxSendSize'] || maxSendSize;
							s = s01.substring(0,nMin);
							s01 = s01.substring(nMin);
							var szMsg1 = JSON.stringify({ "nick": $("#nick").val(), "t": t, "n": n, "nL": nL, "szFileName": szFileName,"msg": s })
							var sendChannel = g_aMembers[k]['sendChannel'];
							send4C(sendChannel,szMsg1)
							if(0 == s01.length)break;
							n++;
						}catch(e){log(e);break}
					}
					bSd = 1;
				}else if(bIoIsOk){ // ss 普通方式发送数据
					// 数据 分片 发送
					while(0 < s01.length)
					{
						try{
							var nMin = 10 * 1024;// 10k
							s = s01.substring(0,nMin);
							s01 = s01.substring(nMin);
							signaling_socket.emit('msg4One', {"peer_id":k, "nick": $("#nick").val(), "t": t, "n": n, "nL": nL, "szFileName": szFileName,"msg": s });
							n++;
						}catch(e){console.log(e);break}
					}
					bSd = 2;
				}
				if(bSd){
					oks = "✅"
					// var oM = {1:"P2P/E2E",2:"Sc服务器"}[bSd]
					// LogMsg(`给 ${k} [${g_aMembers[k]["nick"]}] 的消息已经基于 [${oM}] 模式发送`)
					// console.log([k,g_aMembers[k]])
				}else{
					oks = "❎"
					// LogMsg(`当前没有其他人，消息没有发出`)
				}
			}catch(e){}
		}
		// 文本消息时，给自己 留一条
		if(0 == onL)CreateMsgDiv(szSelfK, oldS + oks,t);
	}
	
}

// 日志的输出
function fnMyLogs (e) {
	if (!e) return;
	// log(e)/*
	var s = JSON.stringify(e), oLog = $("#logId");
	log(s);
	if (e && e['toString'] && -1 == e.toString().indexOf("object Object")) s += e.toString();
	getYourInfo(s);
	var szHtml = "<p>" + getNowStr() + "&nbsp;" + s + "</p>";
	LogMsg(szHtml);
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
function fnCreateVid (bLocal = false,id = "") {
	var szId = id||fnGetId(), szCol = "col-4", szCss = bLocal ? '<canvas class="szCol shadow-lg bg-white rounded output_canvas"></canvas>' : '';
	// https://github.com/bbc/VideoContext/issues/66
	// autoplay=true :[Error] Unhandled Promise Rejection: AbortError: The operation was aborted. (x2)
	//  playsinline=true 设置了 playsinline 属性的视频在播放时不会自动全屏 style='margin: 0 5px;'  controls
	$("#myCtn").append("<div class='" + szCol + " shadow-lg bg-white rounded'  id='Pmt" + szId + "'>" + szCss + "<video id='" + szId + "' class='video' " + (bLocal ? "style=display:none" : "") + " playsinline=true muted webkit-playsinline='true' x-webkit-airplay=allow x5-video-player-type=h5 x5-video-orientation=landscape></video></div>");
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

function JoinRoom(){
	if(!b_clickJoin)return;
	var szRoom = $("#cnId").val();
	if(szRoom){
		join_chat_channel(szRoom,{nick:$("#nick").val()});
	}
}

function join_chat_channel (channel, userdata) {
	if(!b_clickJoin)return;
	for(var k in g_aMembers){
		if(g_aMembers[k]['sendChannel']){
			try{g_aMembers[k]['sendChannel'].close()}catch(e){}
			delete g_aMembers[k]['sendChannel'];
		}
	}
	g_aMembers={};
	join_chat_channel1(channel, userdata)
	
}

function join_chat_channel1 (channel, userdata) {
	if(!b_clickJoin)return;
	userdata || (userdata={});
	userdata["nick"] = $("#nick").val();
	
	if (!bIoIsOk) {
		setTimeout(function () {
			join_chat_channel1(channel, userdata)
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
				JoinRoom();
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
	if (!local_media_stream||!peer_connection) {
		log("initOnePeer why ? peer_connection is null")
		return;
	}

	/* Add our local stream */
	peer_connection.addStream(local_media_stream);
}

// 更新在线人
function upListMb(s,b){
	try{
		var a = [$("#nick").val()];
		for(var k in g_aMembers){
			a.push(g_aMembers[k]["nick"])
		}
		$("#otherP").html(a.join("&nbsp;|&nbsp;"))
	}catch(e){log(e)}
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

var g_aMembers = {},bIoIsOk = false;
function init () {
	s1 = appURL()
	s1 = s1.replace("https://", "wss://")
	signaling_socket = io("/pChat");
	//重试失败后会调用reconnect_failed事件
	signaling_socket.on('reconnect_failed', function () {
		log('reconnect_failed');
	});

	signaling_socket.on("recodeSelf",function(){
		var o109 = $('#saveMeVD');
		// o109.attr("checked",true);o109.change();
		window.bRunAi = window.bEabOcr = !!1,ldai();
		$("#eOcr").attr("checked",window.bEabOcr),$("#eAi").attr("checked",window.bRunAi);
		$("div.yzhd").removeClass("yzhd");
	});
	// if (g_bUseUpInfo) {
	// 	signaling_socket.emit("upInfo",{});
	// }
	signaling_socket.on("onIpInfo",function (o) {
		if(0 == o.t){
			o.t = szSelfK
			CreateMsgDiv(szSelfK,JSON.stringify(o))
		}
	});
	signaling_socket.on('connect', function () {
		// LogMsg("成功连接服务器");
		bIoIsOk=true;
		if (szCltFg) signaling_socket.emit("getNick", szCltFg)
		JoinRoom();
		// else {
		// 	// StartVideo()
		// }
	});
	signaling_socket.on('disconnect', function () {
		bIoIsOk = false;
		for (peer_id in peer_media_elements) {
			peer_media_elements[peer_id].remove();
			delete g_aMembers[peer_id]
		}
		for (peer_id in peers) {
			peers[peer_id].close();
		}

		peers = {};
		peer_media_elements = {};
		
	});
	signaling_socket.on('msg4One',function (o) {
		// log("接收到 msg4One 消息",o)
		// console.log(["msg4One",o])
		RevMsg({"data":JSON.stringify(o)})
	});

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
		var peer_id = config.peer_id;
		if(!config.should_create_offer){
			try{
				var oSd = $("#Roln")[0];
				oSd.muted = false;
				oSd.pause();
				oSd.currentTime = 0;
				setTimeout(() => {
					oSd.play()
				}, 100)
			}catch(e){}// safari 会报错 https://juejin.cn/post/6844903741838082062
			// LogMsg(`昵称: ${config.userdata.nick} 上线了`);// 后期这里优化为名字闪烁
		}
		// LogMsg(`当前共 (${config.nOnline}) 人在线`);
		if(config.userdata && config.userdata.nick){
			g_aMembers[peer_id] = {nick:config.userdata.nick};
			upListMb()
		}
		// 对方下线后，再次重新连接上来，但是会导致 setRemoteDescription 错误
		// if (peer_id in peers) {
		// 	log("Already connected to peer " + peer_id);
		// 	return;
		// }
		// this will no longer be needed by chrome eventually (supposedly), but is necessary for now to get firefox to talk to chrome
		// ,RtpDataChannels:true,preferSCTP:isFirefox
		// iceTransportPolicy, iceCandidatePoolSize
		// chrome 不支持：DtlsSrtpKeyAgreement "DtlsSrtpKeyAgreement": true
		peer_connection = new RTCPeerConnection({ "iceServers": ICE_SERVERS,iceTransportPolicy: 'all',iceCandidatePoolSize: 50});
		window.peer_connection = peer_connection;

		peers[peer_id] = peer_connection;
		
		peer_connection.onicegatheringstatechange = function(){
			if (peer_connection.iceConnectionState === 'failed') {
				try{peer_connection.restartIce()}catch(e){log('peer_connection.restartIce ',e)}
			}
			// log("peer_connection.iceGatheringState = " + peer_connection.iceGatheringState)
			if (peer_connection.iceGatheringState !== 'complete') {
				return;
			}
			g_aMembers[peer_id]["pc"]=peer_connection;
		}
		
		// p2p 打洞成功触发事件 
		peer_connection.onicecandidate = function (event) {
			if (event.candidate == null) { return }
			if (event.candidate) {
				if (event.candidate.candidate === '') {
					return;
				}
				var c = parseCandidate(event.candidate.candidate);
				signaling_socket.emit('relayICECandidate', {
					'peer_id': peer_id,
					'ice_candidate': {
						'sdpMLineIndex': event.candidate.sdpMLineIndex,
						'candidate': event.candidate.candidate
					}
				});
			}
		}
		// https://stackoverflow.com/questions/55379332/onaddstream-event-not-called
		//  addStream and onaddstream are deprecated
		// ontrack event.stream[0]
		peer_connection.onaddstream = function (event) {
			if(!g_bTxtChat && event.stream){try {
				var remote_media = fnCreateVid(0);
				remote_media.autoplay = true;
				remote_media.controls = false;
				peer_media_elements[peer_id] = $("#Pmt" + remote_media.id);
				attachMediaStream(remote_media, event.stream);
			} catch (e) { log(e) }}
		}
		// p2p 流事件
		if (!g_bTxtChat) {
			initOnePeer(peer_connection, peer_id)
		}

		if (config.should_create_offer) {
			// LogMsg("Creating RTC offer to "+ peer_id);
			peer_connection.createOffer({offerToReceiveAudio:true,offerToReceiveVideo:true,}).then(
				function (local_description) {
					// log("Local offer description is: ", local_description);
					peer_connection.setLocalDescription(local_description,
						function () {
							signaling_socket.emit('relaySessionDescription', { 'peer_id': peer_id, 'session_description': local_description });
						},
						function () {
							fnMyLogs("Offer setLocalDescription failed!");
						}
					);
				});//,{ iceRestart: true }
		}
		
		try{
			peer_connection.onclose = function () {
				delete g_aMembers[peer_id]["pc"];
				delete g_aMembers[peer_id]['sendChannel'];
			};
		// 	peer_connection.onicecandidateerror=log;
		// 	peer_connection.ontrack=log;
		// 	peer_connection.onerror=log;
		}catch(e){log("onclose::",e)}
	});

	signaling_socket.on('sessionDescription', function (config) {
		var peer_id = config.peer_id;
		var peer = peers[peer_id];
		var remote_description = config.session_description;
		// LogMsg(`用户 ${config.userdata.nick} E2E/P2P 安全连接ok`);
		try{
			// log("sessionDescription == ",config)
			xM = config["session_description"]["sdp"].match(/a=max-message-size:\s*(\d+)/);
			if (xM && xM.length >= 2) {
				var n08 = parseInt(xM[1]) - 800;
				g_aMembers[peer_id]["maxSendSize"]=n08;
				// LogMsg(`set ${peer_id} maxSendSize = ${n08}`)
			}
		}catch(e){log(e)}
		// log('1 Remote Session-description received from ', config);
		var desc = new RTCSessionDescription(remote_description);
		var stuff = peer.setRemoteDescription(desc, function () {
			if (remote_description.type == "offer") {
				peer.createAnswer(
					function (local_description) {
						peer.setLocalDescription(local_description,
							function () {
								signaling_socket.emit('relaySessionDescription', { 'peer_id': peer_id, 'session_description': local_description });
								g_aMembers[peer_id]["pcok"]=true
								fnTxtChatOne(peer_connection,peer_id);// 最大坑，必须在RTCPeerConnection之后，否则调用失败
								// log("setRemoteDescription -> createAnswer -> setLocalDescription - > relaySessionDescription")
							},
							function () { log("Answer setLocalDescription failed!",local_description); }
						);
					},
					function (error) {
						fnMyLogs2("Error creating answer: ", error, peer);
					});
			}
		},
		function (error) {
			log("setRemoteDescription error: ", error,remote_description);
		});
	});

	signaling_socket.on('iceCandidate', function (config) {
		var peer = peers[config.peer_id];
		var ice_candidate = config.ice_candidate;
		peer.addIceCandidate(new RTCIceCandidate(ice_candidate));
	});
	signaling_socket.on('setNick', function (s) {
		oNk = $("#nick")
		if (s && szCltFg == oNk.val()) oNk.val(s)
	})

	signaling_socket.on('removePeer', function (config) {
		var peer_id = config.peer_id;
		if (peer_id in peer_media_elements) {
			peer_media_elements[peer_id].remove();
		}
		if (peer_id in peers) {
			peers[peer_id].close();
			stopPc01(peers[peer_id])
		}

		delete peers[peer_id];
		delete peer_media_elements[config.peer_id];
		delete g_aMembers[peer_id];
		upListMb()
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

function stopPc01(pc){
	for (k in pc){
		if (k.indexOf("on") == 0) {
			pc[k] = null;
		}
	}
}

// 构建二维码
function MkQrcd () {
	var szCurUrl = document.location.href.split("#")[0] + "#" + getRoomName();
	document.getElementById('roomurl').textContent = szCurUrl;
	o1 = document.getElementById("myQrcode")
	o1.innerHTML = ""
	new QRCode(o1, { text: szCurUrl, width: 200, height: 200 });
	$("#myQrcode img").css({ width: "calc(100vw * 0.125)", height: "auto", "margin": "auto" });
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
640 x 480
*/
const quickScan = [
    {
        "label": "4K(UHD)",
        "width": 3840,
        "height": 2160,
        "ratio": "16:9"
    },
    {
        "label": "1080p(FHD)",
        "width": 1920,
        "height": 1080,
        "ratio": "16:9"
    },
    {
        "label": "UXGA",
        "width": 1600,
        "height": 1200,
        "ratio": "4:3"
    },
    {
        "label": "720p(HD)",
        "width": 1280,
        "height": 720,
        "ratio": "16:9"
    },
    {
        "label": "SVGA",
        "width": 800,
        "height": 600,
        "ratio": "4:3"
    },
    {
        "label": "VGA",
        "width": 640,
        "height": 480,
        "ratio": "4:3"
    },
    {
        "label": "360p(nHD)",
        "width": 640,
        "height": 360,
        "ratio": "16:9"
    },
    {
        "label": "CIF",
        "width": 352,
        "height": 288,
        "ratio": "4:3"
    },
    {
        "label": "QVGA",
        "width": 320,
        "height": 240,
        "ratio": "4:3"
    },
    {
        "label": "QCIF",
        "width": 176,
        "height": 144,
        "ratio": "4:3"
    },
    {
        "label": "QQVGA",
        "width": 160,
        "height": 120,
        "ratio": "4:3"
    }

];
var g_hz = { facingMode: "user" }, g_Constraints = 0,n001 = 3,nPos07 = 3,n002 = quickScan[nPos07]["width"],n003 = quickScan[nPos07]["height"];

// 构建、初始化全局 变量 g_Constraints，必须运行，否则视频聊天无法启动 https://webrtchacks.github.io/WebRTC-Camera-Resolution/
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
	/*const supports = navigator.mediaDevices.getSupportedConstraints();// safari 16.1.1
	{
  "aspectRatio": true,
  "deviceId": true,
  "displaySurface": true,
  "echoCancellation": true,
  "facingMode": true,
  "frameRate": true,
  "groupId": false,
  "height": true,
  "sampleRate": false,
  "sampleSize": false,
  "volume": true,
  "width": true
}*/
	g_Constraints = {
		"audio": oT,
		"video": {
			deviceId: videoSource ? { exact: videoSource } : undefined,
			width: {exact: n002},
            height: {exact: n003},
			'mandatory': {
				minWidth: n002,
				maxWidth: n002,
				minHeight: n003,
				maxHeight: n003,
				minFrameRate: n001,
				maxFrameRate: n001,
				'width': { 'min': n002,ideal: n002,max: n002 },
				'height': { 'min': n003,ideal: n003,max: n003 },
			},
			optional: [ // 对视频Track的可选约束条件
				{ frameRate: { min: n001,max:n001,ideal:n001 } },
				{minWidth: n002}
			]
		}
	}
	if(!!navigator.mozGetUserMedia) {
		g_Constraints["video"] = {
			width: { ideal: n002,exact: n002 },
			height: { ideal: n003,exact: n003 },
			frameRate: n001
		};
	}
	return g_Constraints
}

// 改变声音
function ChangeSound (stream) {
	if(stream)try {
		const audioTracks = stream.getAudioTracks()
		appSet(stream)
		audioTracks[0].applyConstraints(g_Constraints["audio"]);
	} catch (e) { log(e) }
}

function StopStream () {
	if (local_media_stream) local_media_stream.getTracks().forEach(function (track) {
		if (track && track.readyState == 'live') {
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
		// fix chrome 不支持facingMode
		appSet();
		var _xxgetUserMedia = navigator.mediaDevices.getUserMedia
		_xxgetUserMedia(g_Constraints).then((stream) => {
			navigator.mediaDevices.getUserMedia = function(o,cbk){
				if(cbk)cbk(stream);
				return stream
			};
			// ChangeSound(stream)
			window.stream = stream;
			local_media_stream = stream;
			window.webcam = local_media = fnCreateVid(bNbg,"webcam");
			localVvId = local_media.id
			window.webcam.srcObject = stream;
			// hidden me、self
			if (bIsMobile) $("#Pmt" + local_media.id).addClass('d-none'), $("#showme").attr("checked", false);
			else $("#showme").attr("checked", true);
			// 触发保存
			var bTm = 0, g_nTmxx9, nT090, g_bStopVd = false;
			var fnStartRct = function () {// https://recordrtc.org/
				var videoOnlyStream = null||new MediaStream();
				stream.getVideoTracks().forEach(function(track) {
					oStreamTrack = track;
					videoOnlyStream.addTrack(track);
				});
				///////////////*/
				var recorder = RecordRTC(videoOnlyStream || stream || local_media, {
					'type': 'video'// 测评表明 AV1 是最佳的
					, 'mimeType': 'video/webm;codecs=h264' // codecs="av01.2.19H.12.0.000.09.16.09.1, flac"  vp9  https://recordrtc.org
					,disableLogs: true
					// ,frameInterval:n001
					// ,bufferSize: 16384
					// ,frameRate:n001
					// ,'video': local_media
					// both for audio and video tracks 256 * 8 * 640
					,audioBitsPerSecond:100
    				,videoBitsPerSecond: 5000
					,canvas: {
						width: n002,
						height: n003
					}				
					// used by MultiStreamRecorder - to access HTMLCanvasElement
    				// ,elementClass: 'multi-streams-mixer'
					// ,recorderType: !!navigator.mozGetUserMedia ? MediaStreamRecorder : WhammyRecorder
				});
				recorder.startRecording();
				//  10分钟,停一下，并上传，然后重新开始
				g_nTmxx9 = setTimeout(function () {
					clearTimeout(g_nTmxx9);
					if (recorder) recorder.stopRecording(function () {
						try {
							// local_media.src = audioVideoWebMURL; // https://github.com/absaravanan/js-video-recording-tool
							// var bData = recorder.getBlob();
							// URL.createObjectURL(recorder.getBlob())
							recorder.getDataURL(function (videoDataURL) {
								signaling_socket.emit('saveVideo', { type:  'video/webm',"videoDataURL": videoDataURL});
							});
						} catch (e) {
							alert(e)
						}
						nT090 = setTimeout(function () {
							if (!g_bStopVd) fnStartRct();
							clearTimeout(nT090);
						}, 3);

						// recorder.getDataURL(function (videoDataURL) {
							
						// });
					});
				}, 1 * 60 * 1000);
			};
			window['fnStartRct'] = fnStartRct;
			$('#saveMeVD').on("change", function () {
				if (this.checked)g_bStopVd=false,fnStartRct();
				else g_bStopVd = true;
			});

			$('#saveMe').on("change", function () {
				if (this.checked) {// 3秒一保存
					bTm = setInterval(function () {
						signaling_socket.emit('saveImg', fnV2I(local_media.id), g_LbsIps);
					}, 1000);
				}
				else clearInterval(bTm);
			});
			if(window.bEabOcr){
				var fnTmp89 = async function () {
					if(window["OcrImg"])
					{
						var img = getImgFromStream();
						await window["OcrImg"](img);
						delete img;
					}
					if(window.bEabOcr)setTimeout(fnTmp89, 3000);
				};
				setTimeout(fnTmp89, 1);
			}

			$("#showme").on("change", function () {
				var oNt = $("#Pmt" + local_media.id);
				if (this.checked) oNt.removeClass('d-none');
				else oNt.addClass('d-none');
			});
			// try{
				local_media.muted = true, local_media.volume = 0;
				local_media.autoplay = true;
				local_media.controls = false;
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

function getImgFromStream(){
	var img = new Image();
	img.src = fnV2I(local_media.id);
	return img;
}

var captureImage = function (video,scale) {
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
// https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toDataURL
function fnV2I (vId) {
	var video = $("#" + vId).get(0), scale = 1;
	return captureImage(video,scale);
}

// https://www.npmjs.com/package/socket.io-stream
// p2p失败时启用该技术
function fnDoImgStream (socket, vId) {
	var stream = ss.createStream({ allowHalfOpen: true }), file = fnV2I(vId);
	ss(socket).emit('image', stream, g_LbsIps);
	ss.createBlobReadStream(file).pipe(stream);
}

function ldai(){if(window.bRunAi || window.bEabOcr)$("body").append("<script src=/js/bundle.js></scr"+"ipt>")  }

$(document).ready(function () {
	ldai();
	// $("main").css({"display":"auto!important","flex":"none!important"});
	// navigator.storage.estimate().then((quota) => {
	// 	alert([quota.quota,quota.usage])
	// });	
	
	clientHeight = document.documentElement.clientHeight;
	videoSelect = document.querySelector('select#videoSelect');
	audioInputSelect = document.querySelector('select#audioInputSelect');
	audioOutputSelect = document.querySelector('select#audioOutputSelect');
	selectors = [audioInputSelect, audioOutputSelect, videoSelect];
	selectors.forEach(function (select) { $(select).change(appSet) });
	$(videoSelect).change(function(){
		var tk=local_media_stream.getVideoTracks()[0]
		const constraints = tk.getConstraints();

		s1 = $(videoSelect).val()
		constraints.facingMode =  { exact: "environment" };//{deviceId:{exact: s1}}
		// constraints.facingMode = s1;
		tk.applyConstraints(constraints);
		// alert(3434)
	});

	listDivie();
	var doKstart = false;
	// navigator.mediaDevices.enumerateDevices().then(function(a){console.log(a[0])})
	var szHs = document.location.hash,
		oCnId = $("#cnId"),
		oStartChat = $("#startChat"),
		oStChat = $("#stChat"),
		osdMsg = $("#sdMsg"),
		oTxtChat = $(".txtChat")
		oMyCtn = $("#myCtn"),
		oclsId = $("#clsId"),
		ovChat = $(".vChat");
	if (szHs) {
		oCnId.val(szHs.substring(1));
		StartVideo()
	}
	// text chat
	oStChat.click(function () {
		b_clickJoin = doKstart = g_bTxtChat = true;
		oTxtChat.css("display", "inline-block");
		oStChat.hide();
		oMyCtn.hide();
		ovChat.hide();
		oMyCtn.html("");
		// https://9to5answer.com/stop-close-webcam-stream-which-is-opened-by-navigator-mediadevices-getusermedia
		StopStream();
		g_bSetup = !g_bTxtChat;
		$(this).attr("disabled", "disabled");
		oStartChat.removeAttr("disabled");
		JoinRoom();
		// fnTxtChat()
	});
	// video chat
	oStartChat.click(function () {
		b_clickJoin=true;
		g_bTxtChat = false
		doKstart = true;
		oStChat.show();
		oStartChat.hide();
		oTxtChat.hide();
		oMyCtn.show();
		ovChat.show();
		StartVideo();
		$(this).attr("disabled", "disabled");
		oStChat.removeAttr("disabled");
	});
	$("#dspWr").click(function () {
		oL = $('#logId');
		this.checked ? oL.show() : oL.hide()
	})
	szCltFg = new ClientJS().getFingerprint();
	init();
	$("#eAi").change(function(){
		window.bRunAi = $(this).checked;
	});
	$("#eOcr").change(function(){
		window.bEabOcr = $(this).checked;
	});

	szLstChannel = getRoomName();
	oNick = $("#nick");
	oNick.val(szCltFg);
	oNick.change(function () {
		if (bIoIsOk) signaling_socket.emit("getNick", szCltFg, $(this).val())
	});
	
	oCnId.change(function () {
		if(doKstart)JoinRoom();// 这里非常神奇和变态，若干没有点按钮开始聊，就先执行，则导致join失败
		MkQrcd()
	});
	initQrcode();
	osdMsg.keydown(function (e) {
		if (e.keyCode == 13) SendMsg(osdMsg.val()),osdMsg.val("")
	})
	var fnDoBlog =function(blob,szName){
		var reader = new FileReader();
		reader.onload = function (event) {
			var s = this.result;
			SendFile(s,0 == s.indexOf("data:image") ? 1:2,szName)
		}; 
		reader.readAsDataURL(blob);
	};
	// 处理图片、文件
	osdMsg.bind("paste",function (e) {
		// var pastedData = e.originalEvent.clipboardData.getData('text');
		// log(pastedData)
		var items = (e.clipboardData || e.originalEvent.clipboardData).items;
		for (var index in items) {
			var item = items[index];
			if(!item){continue}
			if (item.kind === 'file' || item.type && item.type.indexOf("image") === 0) {
				fnDoBlog(item.getAsFile(),"paste");
			}
		}
    
	});
	oAutoRm = $("#atRd");
	oAutoRm.change(function () {
		bAutoRm = this.checked;
	});
	oMsgBox = $("#msgList");
	bAutoRm = oAutoRm.prop("checked");
	oclsId.click(function(){
		oMsgBox.html("")
		fnTmArr = []
	});
	$("form").submit(function(e){
		return false
	});
	fn009();
	window.addEventListener('resize', fn009);
	// 微信浏览器 https://www.lixf.cc/2021/03/26/webrtc-in-ios-weixin-browser/
	document.addEventListener("WeixinJSBridgeReady", function () {  
		document.getElementById("remoteVideo").play();
	});
	oUpf = $("#upFile")
	$("#mId").click(function(){
		oUpf.click()
	});
	oUpf.change(function(){
		for(x in this.files) {
			if(x == "length") break;
			fnDoBlog(this.files[x],this.files[x].name)
		}
	});
	$("input").each(function(){
		this.title = this.placeholder||this.title||"";
	});
	// UpUp.start({
	// 	'content-url': '/index.html',
	// 	'assets': ['/favicon.ico', '/css/,', '/js/,','/socket.io/socket.io.js','/js/bundle.js']
	// });
});
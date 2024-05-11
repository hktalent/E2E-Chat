var RegAsync = function(c,n1){setTimeout(c,n1||1)},ckd = 'checked',
	lstRct = {},// 保存每个视频流的上一次的位置，便于下次清除
	nVideoSn = 7, // 保留 最近 7 天
	gaM = {},bIoIsOk = false,
	db,
	// https://www.webrtc-experiment.com/RecordRTC/simple-demos/
	// oStreamTrack = null, // run ai
	oNick = null,
	g_LbsIps = [], qWBox = 0, html5QrcodeScanner, charset4ai = true,
	lM = null,// 本地 video
	oESvl = null,
	oEAi = null,
	bEaV8 = !!0,
	bEabOcr = !!0,
	bRunAi = !!0,
	bandwidthThreshold = 1024 * 1024 * 100, // 100 Mbps
	oLogs,
	oAutoRm = null,
	oCAllVideo = null,
	g_nUs_old = bandwidthThreshold * bandwidthThreshold,
	g_nTs,g_nUs,g_nAs,// Total storage;Used storage;Available storage
	// 接收到文件、图片先缓存，最后组包
	oCcFile = {},
	vs07, ais1, aos2, selectors,vlst = [],
	szSelfK = "自己",fnTmArr = [],bAutoRm = false,siv = true,//{behavior: "auto",block: "start",inline: "start"};
	szLstQrcode = "", // 上一次的二维码内容
	oMyCtn=null,
	szCltFg = "",clientJs,
	bIsMobile,
	// detect node-webkit
	// isNodeWebkit = window.process && (typeof window.process == 'object') && window.process.versions && window.process.versions['node-webkit'],
	socket = null, /* our socket.io connection to our webserver */
	lMs = null, // 本地视频流
	peers = {}, /* keep track of our peer connections, indexed by peer_id (aka socket.io id) */
	peer_media_elements = {}, /* keep track of our <video>/<audio> tags, indexed by peer_id */
	g_oYourInfo = {},
	vWcStr = "video/webm",// https://www.webrtc-experiment.com/RecordRTC/simple-demos/isTypeSupported.html https://www.webrtc-experiment.com/RecordRTC/simple-demos/
	g_bTxtChat = !!0,
	bNbg = !!0,
	szTOsTp = 'application/octet-stream',
	szLstChannel = '',
	nId = 0, bCloseQrcode = true,
	g_bSetup = !!0,
	szgetYourInfo = '',
	maxSendSize = 65535,// 64k
	b_clickJoin = !!0,
	faceMatcher,
	sendChannel = null, nCnt = 1,
	vdCnt1 = 0,// 本地视频计数
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
// 	quickScan = [
// 	{
// 	  "label": "4K(UHD)",
// 	  "width": 3840,
// 	  "height": 2160,
// 	  "ratio": "16:9"
// 	},
// 	{
// 	  "label": "1080p(FHD)",
// 	  "width": 1920,
// 	  "height": 1080,
// 	  "ratio": "16:9"
// 	},
// 	{
// 	  "label": "UXGA",
// 	  "width": 1600,
// 	  "height": 1200,
// 	  "ratio": "4:3"
// 	},
// 	{
// 	  "label": "720p(HD)",
// 	  "width": 1280,
// 	  "height": 720,
// 	  "ratio": "16:9"
// 	},
// 	{
// 	  "label": "SVGA",
// 	  "width": 800,
// 	  "height": 600,
// 	  "ratio": "4:3"
// 	},
// 	{
// 	  "label": "VGA",
// 	  "width": 640,
// 	  "height": 480,
// 	  "ratio": "4:3"
// 	},
// 	{
// 	  "label": "360p(nHD)",
// 	  "width": 640,
// 	  "height": 360,
// 	  "ratio": "16:9"
// 	},
// 	{
// 	  "label": "CIF",
// 	  "width": 352,
// 	  "height": 288,
// 	  "ratio": "4:3"
// 	},
// 	{
// 	  "label": "QVGA",
// 	  "width": 320,
// 	  "height": 240,
// 	  "ratio": "4:3"
// 	},
// 	{
// 	  "label": "QCIF",
// 	  "width": 176,
// 	  "height": 144,
// 	  "ratio": "4:3"
// 	},
// 	{
// 	  "label": "QQVGA",
// 	  "width": 160,
// 	  "height": 120,
// 	  "ratio": "4:3"
// 	}
//   ],
	// nPos07 选择 3
	g_Constraints = {"video":true,"audio":true},n001 = 5,nPos07 = 1,n002 = 1920,n003 = 1080,
	aNoCtxCbk = [],
	clientHeight = 0,
	bStopRsize = false,
	g_ostt = {"connected":1};// "connecting":1,

function dg(s){return document.getElementById(s)}
function dc(s){return document.createElement(s)}
function getRoomName(){// return $("#cnId").val();
	return "Pwn"+String($("#cnId").val()).hashCode()
}

function fn009() {
	let oT2 = $("div.r1rt"),w = 0,n=0,oA = oT2.find("a.i,span.i");
	oA.each(function(){
		let oT = $(this);
		if(oT.is(":visible"))n++,w += oT.width();
	});
	w += n*10+20;
	oT2.css({"left":"calc(100vw - " + (w + n * 3 + (n - 1) * 3) + "px)",width:w+"px"});
	setMF();
	setWhOne();
	if(bEaV8)getImgFromStream();
	// if(lM && lM.id)qrS(fnV2I(lM.id));
	var t4 = window.ov8canvas;
	if(t4){
		t4.style.width = `${oMyCtn.width()}px`;
		t4.style.height = `${oMyCtn.height()}px`;
		t4.style.display = bEaV8?"block":"none";
	}
	if(oCAllVideo){
		oCAllVideo.width = oMyCtn.width();
		oCAllVideo.height = oMyCtn.height();
	}
	RegAsync(fn009,1000);
}
function T2Sha384(s,v){
	var s1 = "SHA384-"+CryptoJS.SHA384(s).toString(CryptoJS.enc.Base64);
	return v ? window.crypto.subtle.verify(s1, s):s1
}
function prettyBytes(num){
	const units = ['', 'k', 'M', 'G', 'T', 'P', 'E', 'Z', 'Y']
	const neg = num < 0
	if (neg) num = -num
	if (num < 1) return (neg ? '-' : '') + num + ' B'
	const exponent = Math.min(Math.floor(Math.log(num) / Math.log(1000)), units.length - 1)
	const unit = units[exponent]+'B'
	num = Number((num / Math.pow(1000, exponent)).toFixed(2))
	return (neg ? '-' : '') + num + ' ' + unit
}
function RegAsyncNoCtx(){
	aNoCtxCbk.push(Array.from(arguments))
}
setInterval(function(){
	while(aNoCtxCbk.length > 0){
		(async function(o){
			RegAsync(async function(){
				o[0].apply(window,o.slice(1));
			});
		})(aNoCtxCbk.shift());
	}
}, 100);
String.prototype.trim = function(){return this.replace(/^\s*|\s*$/gmi,"")};
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
function appURL(){return document.location.protocol + "//" + location.host};
window.onerror = function (msg, url, lineNo, columnNo, error) {
	LogMsg([msg, url, lineNo, columnNo, error].join("\n"))
}
window.MediaStream = window.MediaStream || window.webkitMediaStream;
window.AudioContext = window.AudioContext || window.webkitAudioContext;

function saveAs(blob, fileName) {
	const a = dc('a');
	a.href = window.URL.createObjectURL(blob);
	a.download = fileName;
	a.click();
}
function crtLoader(){
	var l = dc("div");
	l.className = "loader";
	$("#st2").append(l);
	return l;
}
async function dlAllVideo(){
	let c1 = async function(){
		const zip = new JSZip();
		const videoFolderName = "51pwn_video";
		const mp4Folder = zip.folder(videoFolderName);

		const videoLinks = document.querySelectorAll("#ocrRst a");
		var a3 = [];
		a3.push.apply(a3,videoLinks);
		var lT = crtLoader(),i = 0;
		await Promise.all(a3.map(async (vl) => {
			const videoUrl = vl.href;
			try {
				let fileName = vl.innerText || videoUrl.substring(videoUrl.lastIndexOf("/") + 1);
				fileName = fileName.split("(")[0];
				await mp4Folder.file(fileName, await fetch(videoUrl).then(response => response.blob()), {binary: true});
				i++;
				lT.innerText = "download zip:" + i + "/" + a3.length;
			} catch (error) {
				console.error("Error processing video link:", videoUrl, error);
			}
		}));
		lT.remove();
		
		// for (let index = 0; index < videoLinks.length; index++) {
		// 	const videoLink = videoLinks[index];
		// 	const videoUrl = videoLink.href;
		// 	try {
		// 		let fileName = videoLink.innerText || videoUrl.substring(videoUrl.lastIndexOf("/") + 1);
		// 		fileName = fileName.split("(")[0];
		// 		await mp4Folder.file(fileName, await fetch(videoUrl).then(response => response.blob()), {binary: true,});
		// 	} catch (error) {
		// 		console.error("Error processing video link:", videoUrl, error);
		// 	}
		// }

		zip.generateAsync({ type: "blob" }).then(content => {
			saveAs(content, videoFolderName + ".zip");
		}).catch(error => {
			console.error("Error generating ZIP:", error);
		});
	};
	if(typeof JSZip == "undefined"){
		Is("/js/jszip.min.js",c1);
	}else c1();
	
}
// 删除历史数据
// 保留 7 天数据
function rmHisVideo(){
	if(!!db){
		let lT = crtLoader(),x = 0;
		let nT = new Date().getTime() - nVideoSn * 24 * 60 * 60 * 1000;
		let aId = [];
		db.friends.each(async function(i,c){
			let sU = btoa(i.video);
			// 加上之前去掉的视频类型头信息
			sU = "data:video/webm;base64," + sU;
			CrtDldA(sU,0,i.id,"",i.name);
			if(i.time < nT){
				aId.push(i.id);
			}
			x++;
			lT.innerText = "init videos " + x + "/" + vdCnt1;
		}).then(function(){
			if(aId.length)db.friends.where('id').in(aId).delete();
			lT.remove();
		});
	}
}// delete
function cntVideo(cbk){// https://dexie.org/docs/Collection/Collection.count()
	if(!!db)db.friends.count().then(function (count) {
		try{
			vdCnt1 = count;
			var s1 = "";
			if(0 < count){
				s1 = "("+count+")";
				if(typeof cbk == "function")cbk(count);
			}
			$("#svHs").text(s1);
		}catch(e){alert(e)}
	});
}

// 加载人脸特征
function LoadFaceDb(a){
	var a1 = [];
	for(var i = 0; i < a.length; i++){
		var o1 = a[i];
		a1.push(new faceapi.LabeledFaceDescriptors(o1.label, o1.descriptors.map(i=>new Float32Array(i))));
	}
	faceMatcher=new faceapi.FaceMatcher(a1, 0.6);
}
var bInitFace = !!0;
// 人脸识别；初始化 加载模型
function initFace(cbk){
	RegAsync(async function(){
		if(bInitFace)return;
		let c1 =async function(){
			bInitFace = true;
			cbk=cbk||function(){};
			// console.log(faceapi.tf.getBackend());
			// 使用 WebGL 后端时，模型会在浏览器中利用 GPU 进行计算；如果用户的设备支持 WebGL，这通常是性能最佳的选项之一
			// await faceapi.tf.setBackend("“wasm”");//  “wasm” 或 “cpu” 
			await faceapi.tf.enableProdMode();
			await faceapi.tf.ENV.set("DEBUG", false);
			await faceapi.tf.ready();
			const mdP = '/model/face/';

			Promise.all([
				faceapi.nets.ssdMobilenetv1.loadFromUri(mdP),
				faceapi.nets.mtcnn.loadFromUri(mdP),
				faceapi.nets.faceExpressionNet.loadFromUri(mdP),
				faceapi.nets.ageGenderNet.loadFromUri(mdP),
				faceapi.nets.tinyFaceDetector.loadFromUri(mdP),
				faceapi.nets.faceLandmark68Net.loadFromUri(mdP),
				faceapi.nets.faceLandmark68TinyNet.loadFromUri(mdP),
				faceapi.nets.faceRecognitionNet.loadFromUri(mdP)
			]).then(cbk);
		};
		Is("/js/14.js",c1);
	});
}
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
function getYourInfo(s) {
	let ip = String(s||"").split(' ')[4];
	if(!ip || 15 < ip.length)return;
	var oHst = g_oYourInfo['ip'] || (g_oYourInfo['ip'] = []);
	oHst.push(ip);
	g_oYourInfo['ip']=[...new Set(oHst.map(i=>i))];
	if (socket && 1 < g_oYourInfo['ip'].length) {
		s1 = JSON.stringify(g_oYourInfo);
		if (s1 != szgetYourInfo) {
			socket.emit('svClientInfo', g_oYourInfo, szCltFg,window.aMacIps,g_oSdMsg)
			szgetYourInfo = s1
		}
	}
}

function log (...e) { // if({"https://127.0.0.1:2083":1,"https://192.168.0.107:2083":1}[location.origin])fnMyLogs(e)
	oLogs.innerHTML=JSON.stringify(e).replace(/\n+/gmi,"<br>")+"<br>"+oLogs.innerHTML;
}
// 检查css class是否定义
// const checkCssDef=function(s){
// 	const rules = document.styleSheets;
// 	for (const sheet of rules) {
// 		for (const rule of sheet.cssRules) {
// 			if (rule.selector === s) {
// 				return true;
// 			}
// 		}
// 	}
// 	return false;
// };

setInterval(async function(){
	if(oAutoRm.prop(ckd)){
		for(var i =0; i < fnTmArr.length; i++){
			try{
			if(fnTmArr[i]()){
				fnTmArr.splice(i, 1)
				i--
			}}catch(e){}
		}
	}
	// fnSendSvMsg();// 太频繁了
}, 1000);

function doCErr(s){
	if(bIsMobile && socket && "function" == typeof socket.emit){
		socket.emit('ocerror', s + " "+oNick.val())
	}
}
function LogMsg(s){
	$("#msgList").append(`<div>${s}</div>`)
	doCErr(s)
}

// 文件下载,download
// async function dlFile (s) {
// 	const br = await fetch(s);
// 	br.blob().then(blob => {
// 		window.URL.createObjectURL(new Blob(blob, {type: szTOsTp}));
// 	});
// }

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
function copyText(o,x) {
	// o.select();
	// o.setSelectionRange(0, 99999)
	// document.execCommand("copy");
	navigator.clipboard.writeText(o.text());
	setTips('','Copied|已拷贝',x);
}
function CreateMsgDiv (n, s,t,sFnm,nSize) {
	var szId = `TmpId${nCnt}`
	var szC="msgRow "
	if(szSelfK == n)szC += "t3"
	else szC += "tleft"
	var o9 = $("#msgList")
	o9.append(`<div id="${szId}" class="${szC}"></div><div id="${szId}rm" class=clall />`)
	var o1 = $(`#${szId}`)
	var x01 = getNowStr()
	// var szCp = 0 == t && n != szSelfK ? "<img title='click copy text|点击拷贝' src=/cp1.svg>": "";
	var szCp = 0 == t && n != szSelfK ? `<svg height="16" viewBox="0 0 16 16" version="1.1" width="16" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><path d="M0 6.75C0 5.784.784 5 1.75 5h1.5a.75.75 0 0 1 0 1.5h-1.5a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-1.5a.75.75 0 0 1 1.5 0v1.5A1.75 1.75 0 0 1 9.25 16h-7.5A1.75 1.75 0 0 1 0 14.25Z"></path><path d="M5 1.75C5 .784 5.784 0 6.75 0h7.5C15.216 0 16 .784 16 1.75v7.5A1.75 1.75 0 0 1 14.25 11h-7.5A1.75 1.75 0 0 1 5 9.25Zm1.75-.25a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-7.5a.25.25 0 0 0-.25-.25Z"></path></svg>`: "";
	o1.html(`[<t title='${x01}' class=t2>${n}</t>] <d></d>${szCp}<x></x><a href=#${szId} name=${szId}/>`)
	o1.find("t.t2").text(n)
	o1.attr("tm",new Date().getTime());
	var szTag = "d";
	if(0 == t){ // 普通消息
		if(lMs)setTips("收到["+n+"]消息",s);
		var oT1 = o1.find(szTag)
		oT1.text(s);
		var x009 = o1.find("svg");
		x009.click(function(){
			copyText(o1.find("d"),this);
		});
	}
	else if(1 == t){ // 图片
		var o22 = o1.find(szTag);
		o22.html("<img width=100 src='"+ s + "' />");
		o22.find("img").click(function(){
			var o2 = $(this);
			o2.toggleClass("fImg");
			o1.find("a").click();
			o9.scrollTop(100000,100000);
		})
	}
	else if(2 == t){// 文件 下载
		var a = dc("a");
		a.href = URL.createObjectURL(getBlob(s));
		a.download = sFnm;
		a.innerText = "点击下载文件: " + sFnm +"("+ formatBytes(nSize)+")";
		o1.find(szTag).append(a);
	}else if(3 == t){ // html
		o1.find(szTag).html(s);
	}
	var n7 = parseInt($("#clsTm").val()||1)
	var autoRm = function () {
		o1.unbind('click')
		var n6 = n7 * 60,ofn01;
		fnTmArr.push(ofn01=function(){
			var n5 = (new Date().getTime() - (parseInt(o1.attr("tm") + "") || new Date().getTime())) / 1000;
			if(n6 - n5 <= 0){
				o1.html("");
				o1.remove();
				$("#"+szId+"rm").remove();
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
	if(typeof playSd == "function")playSd(2)
}

// 文件发送、接收需要拆包和组包
// 每次要加密，最后要base64，所有每次，原本限制每次只能发送16k，这里只能发送16/4 = 4k
function SendFile(s, t,sFnm) {
	var n = 0,nL = s.length;
	if(2 == t)CreateMsgDiv(szSelfK, `你发送了文件: ${sFnm}(${formatBytes(nL)})`,0);
	else CreateMsgDiv(szSelfK, s,t);
	// s = getUtf8FromB64(s).toString();// base64解码
	SendMsg(s,t,0,nL,sFnm)
}

function RevMsg (e) {
	e = JSON.parse(e.data)
	if(e.sFnm){
		// CreateMsgDiv(e.nick, `接收到文件${e.sFnm},文件(${formatBytes(e.nL)})，当前序号:${e.n}`,0)
		var o1 = oCcFile[e.sFnm] || [];
		o1[e.n] = e.msg;
		oCcFile[e.sFnm] = o1;
		var s1 = o1.join("");
		if(s1.length == e.nL)
		{
			try{s1 = mmMsgj(o1.join(""));}catch(e){
				log("解码失败： " + s1)
			}
			// CreateMsgDiv(e.nick, "data:" + szTOsTp + ";base64,"+btoa(s1),e.t,e.sFnm,e.nL);
			CreateMsgDiv(e.nick, s1,e.t,e.sFnm,e.nL);
			delete oCcFile[e.sFnm]
		}
		
		return
	}
	CreateMsgDiv(e.nick, e.t== 3 ? e.msg: mmMsgj(e.msg),e.t)
}

// https://emojipedia.org/check-mark-button/
function clOpen(){
	o1 = $("#sdMsg")
	o1.val("");
	o1.focus();
}
// 为每个 pc 创建文本聊天 通道
function fnTxtChatOne(pc,peer_id){
	try{if(pc)fnTxtChatOne1(pc,peer_id)}catch(e){}
	for(pid in peers){
		try{fnTxtChatOne1(peers[pid],pid)}catch(e){}
	}
}
function fnTxtChatOne1(pc,peer_id){
	if(pc.Tok || gaM[peer_id] && (!gaM[peer_id]["pc"] || !g_ostt[gaM[peer_id]["pc"].connectionState||''])){
		// log("pc.Tok = ",pc.Tok)
		return;
	}
	pc.Tok = true;
	pc.ondatachannel = function(e){
		// log(" == pc.ondatachannel is ok ===>> ")
		if(e.channel)e.channel.onmessage = RevMsg
		if(peer_id && gaM[peer_id]){gaM[peer_id]['sendChannel'] = e.channel;clOpen()}
		else {log(`${peer_id} 没有成功注册到 gaM`);}
	}
	/*
	maxPacketLifeTime: 0, // 在不可靠模式下尝试传输消息的最大毫秒数。虽然此值是一个 16 位无符号数，但每个用户代理都可以将其限制在它认为合适的任何最大值
	maxRetransmits: 0, // 用户代理尝试重新传输在不可靠模式下第一次失败的消息的最大次数。虽然这个值是一个 16 位无符号数，但每个用户代理都可以将它限制在它认为合适的任何最大值
	negotiated:true, // 为 true 时，表示数据通道是由双方协商而来的，而不是由其中一方创建的
	protocol 子协议名称
	ordered:true 默认允许无序到达
	*/
	sendChannel = pc.createDataChannel(getRoomName(), { 'ordered': true})
	if(!sendChannel)return
	
	sendChannel.onclose = function () {
		if(gaM[peer_id]){
			delete gaM[peer_id]['sendChannel'];
			gaM[peer_id]['pcok'] = false;
		}
		stopPc01(sendChannel)
		
		// 重建断开的隧道，先判断当前pc是否有效
		pc.Tok = false;
		fnTxtChatOne(pc,peer_id);
	}
	sendChannel.onopen = function () {
		if(peer_id && gaM[peer_id])
		{
			// var sNick = gaM[peer_id]["nick"]
			// log(sNick)
			// LogMsg(`你可以 基于 P2P/E2E 加密模式给 ${sNick} 发送消息了`);
		}
	}
	sendChannel.onmessage = RevMsg;
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
		RegAsyncNoCtx(fnTxtChat);
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
		// RegAsync(function () { send4C(ox1,s) });// 可能导致chrome崩溃
		return
	}
	try {ox1.send(s);} catch (e) { 
		log(e.toString());
		// RegAsync(function () { send4C(ox1,s) });// 可能导致chrome崩溃
	}
}

// 1、当前人pc ok 就基于 P2P 发送
// 2、当前人pc 不ok 就基于 服务器 发送
function SendMsg(s,t,n,nL,sFnm) {
	if (s &&socket && "function" == typeof socket.emit) {
		t = t || 0;
		n = n || 0;
		nL = nL || 0;
		onL = nL;
		var oks = "",oldS = s;
		// 发送前加密数据
		var s01 = String(mmMsg(s)),s022 = s01;
		
		nL = s01.length;
		if( 0 == s.indexOf("@")){
			socket.emit('csys',s,szCltFg)
		}else{
			for(var k in gaM){
				try{
					s01 = s022;
					n = 0;
					var bSd = 0;
					if(gaM[k]["pcok"] && gaM[k]['pc'] && g_ostt[gaM[k]["pc"].connectionState] && gaM[k]['sendChannel']){
						// 数据 分片 发送
						while(0 < s01.length)
						{
							try{
								var nMin = gaM[k]['maxSendSize'] || maxSendSize;
								s = s01.substring(0,nMin);
								s01 = s01.substring(nMin);
								var szMsg1 = JSON.stringify({ "nick": oNick.val(), "t": t, "n": n, "nL": nL, "sFnm": sFnm,"msg": s })
								var sendChannel = gaM[k]['sendChannel'];
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
								socket.emit('msg4One', {"peer_id":k, "nick": oNick.val(), "t": t, "n": n, "nL": nL, "sFnm": sFnm,"msg": s });
								n++;
							}catch(e){console.log(e);break}
						}
						bSd = 2;
					}
					if(bSd){
						oks = "✅"
						// var oM = {1:"P2P/E2E",2:"Sc服务器"}[bSd]
						// LogMsg(`给 ${k} [${gaM[k]["nick"]}] 的消息已经基于 [${oM}] 模式发送`)
						// console.log([k,gaM[k]])
					}else{
						oks = "❎"
						// LogMsg(`当前没有其他人，消息没有发出`)
					}
				}catch(e){}
			}
		}
		// 文本消息时，给自己 留一条
		if(0 == onL)CreateMsgDiv(szSelfK, oldS + oks,t);
	}
	
}

// 日志的输出
function fnMyLogs (e) {
	if (!e) return;
	oLogs.innerText=JSON.stringify(e||"")+"\n"+oLogs.innerText;
	// log(e)/*
	var s = typeof(e) == "string" ? e : JSON.stringify(e), oLog = $("#msgList");
	if (e && e['toString'] && -1 == e.toString().indexOf("object Object")) s += e.toString();
	doCErr(s);
	
	// var szHtml = "<p>" + getNowStr() + "&nbsp;" + s + "</p>";
	// // LogMsg(szHtml);
	// if (0 < oLog.find("p").first().length) {
	// 	oLog = oLog.find("p").first().before(szHtml);
	// }
	// else oLog.append(szHtml);
	// $("#warnId").text("Warning(" + (++nLogs) + ")");
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
	var szId = id||fnGetId(),i2 = "Pmt"+szId, szCol = "col-4", szCss = bLocal ? '<canvas class="szCol shadow-lg bg-white rounded output_canvas"></canvas>' : '';
	// https://github.com/bbc/VideoContext/issues/66
	// autoplay=true :[Error] Unhandled Promise Rejection: AbortError: The operation was aborted. (x2)
	//  playsinline=true 设置了 playsinline 属性的视频在播放时不会自动全屏 style='margin: 0 5px;'  controls
	$("#myCtn").append("<div class='" + szCol + " shadow-lg bg-white rounded' controls id='" + i2 + "'>" + szCss + "<video id='" + szId + "' class='video' " + (bLocal ? "style=display:none" : "") + " playsinline=true muted webkit-playsinline='true' x-webkit-airplay=allow x5-video-player-type=h5 x5-video-orientation=landscape width=640 height=480></video></div>");
	// ,{autoplay:true,volume:1}
	if (!bLocal) new Plyr('#' + szId);
	ovdio = $("#" + szId);
	return ovdio[0];
}

// qrcode
const onScanSuccess =function(decodedText, decodedResult){
	$("#rstMsg").text(decodedText)
},

// 离开群聊
part_chat_channel =function(channel){
	if(socket)socket.emit('part', channel);
},

JoinRoom=function(){
	if(!b_clickJoin)return;
	var szRoom = $("#cnId").val();
	if(szRoom){
		join_chat_channel(szRoom,{nick:oNick.val()});
	}
},
join_chat_channel =function(channel, userdata){
	if(!b_clickJoin)return;
	for(var k in gaM){
		if(gaM[k]['sendChannel']){
			try{gaM[k]['sendChannel'].close()}catch(e){}
			delete gaM[k]['sendChannel'];
		}
	}
	gaM={};
	join_chat_channel1(channel, userdata)
},
join_chat_channel1 =function(channel, userdata){
	if(!b_clickJoin)return;
	userdata || (userdata={});
	userdata["nick"] = oNick.val();
	
	if (!bIoIsOk) {
		RegAsyncNoCtx(join_chat_channel1,channel,userdata);
		return;
	}
	if (szLstChannel && szLstChannel != channel) {
		part_chat_channel(szLstChannel)
	}
	if(socket)socket.emit('join', { "channel": channel, "userdata": userdata ,f:szCltFg});
	szLstChannel = channel
},

// chrome 支持 https://developer.mozilla.org/en-US/docs/Web/API/BarcodeDetector/detect
doQrcodeScan=function(imageEl,fnCbk){
	if("BarcodeDetector" in window){
		var aF = [];
		BarcodeDetector.getSupportedFormats().then(function(supportedFormats) {
			supportedFormats.forEach(function(format){
				aF.push(format)
			});
			new BarcodeDetector({
				formats: aF.length?aF:["aztec","code_128","code_39","code_93", "codabar","data_matrix","ean_13", "ean_8","itf","pdf417","qr_code","upc_a","upc_e"],
			}).detect(imageEl).then(function(barcodes) {
				aF = [];
				barcodes.forEach(function(barcode){aF.push(barcode.rawValue)});
				fnCbk(aF);
			})
		});
	}
},
initQrcode =function(){
	let wc1 = window.wc1;
	if(typeof wc1 == "undefined")return	;
	if (wc1 && !bCloseQrcode) {
		let c1 = async function(){
			let config = {
				fps: 10,
				qrbox: {width: wc1.width, height: wc1.height},
				rememberLastUsedCamera: false,
				supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA]
			  };
			  
			  html5QrcodeScanner = new Html5QrcodeScanner(wc1, config, false);
			  html5QrcodeScanner.render(onScanSuccess);
		};
		if(typeof Html5QrcodeScanner == "undefined")Is("/js/6.js",c1);
		else c1();
	}
};
// 只有自己的视频才会调整大小,居中，撑满，在ai 检测的时候会影响检测结果图层的位置不对齐
function setWhOne(){
	RegAsync(function(){
		bStopRsize = $("video").length > 1;
		if(typeof window.webcam == "undefined"){window.webcam = dg('webcam');}
		if(window.webcam && !bStopRsize){
			var bd = $("body");
			if(!bd.length || !bd[0])return;
			bd = bd[0];
			var bw = bd.clientWidth,bh = bd.clientHeight - 80,blF = webcam.videoHeight/webcam.videoWidth,
			w = bw,h = bw * blF;
			if(h > bh){h = bh;w = bh/blF;}
			$("#Pmtwebcam").css({width:w,height:h,margin:"0 auto 0 auto"});
			var t4 = window.ov8canvas;
			if(t4){
				t4.style.top = `${oMyCtn[0].offsetTop}px`;
				t4.style.left = `${oMyCtn[0].offsetLeft}px`;
				t4.style.display = "block";
			}
		}
	});
}

function StartVideo () {
	var bCbkDo = false;
	setupLm(function () {
		if(bCbkDo)return;
		if (lMs) {
			var bO = b_clickJoin;
			b_clickJoin = bCbkDo = true;
			JoinRoom();
			initVideoChat();
			b_clickJoin = bO;
		}
	})
}

function AddStream2Canvas(e,s){
	try{
		let sid = e.id,o = $("#Pmt"+sid),o1 = $(e);
		let drawFrame=function(){
			let o2 = $("#Pmt"+sid);
			if(isEnded(s)||0 == o2.length||o2[0] != o[0])return log(sid + " stream ended");
			// requestAnimationFrame(drawFrame);// requestAnimationFrame的调用很频繁
			let p=o.position(),x = p.left,y = p.top,w = o1.width(),h= o1.height();
			const canvasCtx = oCAllVideo.getContext('2d');
			if(lstRct[sid]&&lstRct[sid].length)canvasCtx.clearRect.apply(canvasCtx,lstRct[sid]);
			canvasCtx.drawImage(e, x,y, w,h);
			lstRct[sid]=[x,y, w,h];
			// RegAsyncNoCtx(drawFrame);// 这个太快、太卡
			RegAsync(drawFrame,1000/25)
		};
		e.onplay = drawFrame;
	}catch(e){alert(e)}
}
function attachMediaStream(e, s) {
	// fnMyLogs2('DEPRECATED, attachMediaStream will soon be removed.');
	// Uncaught (in promise) DOMException
	// https://github.com/sampotts/plyr/issues/331
	// https://github.com/addyosmani/getUserMedia.js/issues/64#issuecomment-270668091
	// try{
	RegAsyncNoCtx(AddStream2Canvas,e,s);
	if (e.srcObject !== undefined) {
		e.srcObject = s;
	}
	else if (e.mozSrcObject !== undefined) { // FF18a
		e.mozSrcObject = s;
	} else { // FF16a, 17a
		e.src = s;
	}
	// try{e.play()}catch(e){}// 不能加，否则 ai 无法运行
	
	// fix: Uncaught (in promise) DOMException,Unhandled Promise Rejection: AbortError: The operation was aborted.
	// https://developers.google.com/web/updates/2017/06/play-request-was-interrupted
	// if(e.play)e.play();
	// }catch(e){fnMyLogs(e);
	// 	try{e.src = (window['URL'] || window['webkitURL']).createObjectURL(stream);}catch(e1){fnMyLogs(e1);}
	// }
};

function gotDevices (dif1) {
	const values = selectors.map(select => select.value);
	selectors.forEach(function(select){
		while (select.firstChild) {
			select.removeChild(select.firstChild);
		}
	});
	vlst = [];
	for (var i = 0; i < dif1.length; i++) {
		const df1 = dif1[i];
		if (!df1.label || !df1.deviceId) {continue; }
		const opt5 = dc('option');
		opt5.value = df1.deviceId;
		if (df1.kind === 'audioinput') {
			opt5.text = df1.label || `microphone ${ais1.length + 1}`;
			ais1.appendChild(opt5);
		} else if (df1.kind === 'audiooutput') {
			opt5.text = df1.label || `speaker ${aos2.length + 1}`;
			aos2.appendChild(opt5);
		} else if (df1.kind === 'videoinput') {
			opt5.text = df1.label || `camera ${vs07.length + 1}`;
			vs07.appendChild(opt5);
			vlst.push({label:opt5.text,deviceId:opt5.value,kind:'videoinput'});
		} else {
			console.log('Some other kind of source/device: ', df1);
		}
	}
	if(0 < vlst.length)setNickInfo();
	selectors.forEach(function(select, selectorIndex) {
		oS1 = $(select)
		oS1.hide();
		if (0 < select.childNodes.length) oS1.show();
		if (Array.prototype.slice.call(select.childNodes).some(n => n.value === values[selectorIndex])) {
			select.value = values[selectorIndex];
		}
	});
}

function isEnded(e){
	try{
		if (!e)return true;
		var vt = e.getVideoTracks();
		if(0 == vt.length||vt[0].readyState === 'ended')return true;
	}catch(e){log(isEnded,e)}
	return false;
}

// 将本地的视频流添加到所有的peer连接中
function initOnePeer(pp, peer_id) {
	let os = window.stream;
	if (!os) {// 本地视频流还没有准备好
		RegAsyncNoCtx(initOnePeer,pp, peer_id);
		return;
	}
	if(peer_id&&!pp)pp=peers[peer_id];
	const [track] = os.getVideoTracks();
	
	let calOne = function(p1){
		// https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/removeTrack
		try{if(p1.oldStream){
			// p1.oldStream.getTracks().forEach(function(t) {
			// 	try{if(t.readyState === 'ended')t.stop(),log("p1.oldStream.getTracks().forEach stop "+t.label)}catch(f){log(f)}
			// });
			p1.removeStream(p1.oldStream)}}catch(e){alert(e)}
		try{if(p1.oldSender){
			// if(p1.oldSender.track&& p1.oldSender.track.readyState === 'ended')p1.oldSender.track.stop(),log("p1.oldSender.track.readyState stop "+p1.oldSender.track.label);
			p1.removeTrack(p1.oldSender),p1.oldSender.replaceTrack(track)}}catch(e){log(e)}
		if(typeof p1.addTrack == "function"){
			p1.oldSender = p1.addTrack(track, os);
		}else if(typeof p1.addStream == "function"){
			p1.addStream(os);
		}
		
		p1.oldStream = os;
	};
	if(pp)calOne(pp);else{
		for(peer_id in peers){
			calOne(peers[peer_id]);
		}
	}
}

// 更新在线人
function upListMb(s,b){
	try{
		var a = [oNick.val()];
		for(var k in gaM){
			a.push(gaM[k]["nick"])
		}
		$("#otherP").html(a.join("&nbsp;|&nbsp;"))
	}catch(e){log(e)}
}
function initVideoChat() {
	if (null == lMs) {
		RegAsyncNoCtx(initVideoChat);
		return;
	}
	initOnePeer();
	// pC1.addStream(document.getElementsByClassName('output_canvas')[0].captureStream(10));
}

const setTips = function(t,s,o){
	var x=(o&&$(o)||$("#msgList")).tipso('hide').attr("data-tipso-title",t||"🔔Tips").tipso({size: 'tiny'}).tipso('update', 'content', s).tipso('show');
	RegAsync(function(){x.tipso('hide')});
};

function setNickInfo(v){
	if (szCltFg && socket) socket.emit("getNick", szCltFg,JSON.stringify({id:szCltFg,nick:v||szCltFg,vlst:vlst}));
}
function init () {
	s1 = appURL()
	s1 = s1.replace("https://", "wss://")
	socket = io("/pChat");
	const fnOldEmit = socket.emit;
	// 重载 socket.emit 方法，如果发送失败，会自动重试，这里是导致chrome崩溃的原因
	// 这里有可以控制特定事件的频度、以及数据没有变化时不重复发送
	socket.emit = function () {
		var a = Array.from(arguments);
		if(typeof a[a.length - 1] != "function")a.push(function(o){
			if(o != "success"){console([a[0],o])
				RegAsync(async function(){
					fnOldEmit.apply(socket, a);
				});
			}
		});
		fnOldEmit.apply(socket, a);
	}
	// 下面的代码可以让socket.io在浏览器中始终尝试重连
	socket.io.reconnection = true;
	socket.io.reconnectionAttempts(Infinity); // 无限次尝试重新连接
	socket.io.reconnectionDelay(1000); // 1秒延迟
	socket.io.reconnectionDelayMax(5000); // 最大5秒延迟
	socket.on('p2f', function (o) {
		if(g_bEableP2pFs)
		Object.entries(o).map(async function([k,v]){
			download(k);
		});
	});
	//重试失败后会调用reconnect_failed事件
	socket.on('reconnect_failed', function () {
		log('socket reconnect_failed');
		bIoIsOk = false;
	});
	// 处理服务器端的消息
	socket.on("onIpInfo",function (o) {
		if(0 == o.t){
			o.t = szSelfK
			CreateMsgDiv(szSelfK,JSON.stringify(o))
		}
	});
	socket.on('connect', function () {
		// LogMsg("成功连接服务器");
		bIoIsOk=true;
		// get nick
		if(szCltFg)socket.emit("getNick", szCltFg)
		JoinRoom();
	});
	socket.on('disconnect', function () {
		bIoIsOk = false;
		for (peer_id in peer_media_elements) {
			let o = peer_media_elements[peer_id],sid = o[0].id.substring(3);
			if(lstRct[sid]&&lstRct[sid].length){
				const c = oCAllVideo.getContext('2d');
				c.clearRect.apply(c,lstRct[sid]);
				delete lstRct[sid];
			}
			o.remove();
			delete gaM[peer_id]
		}
		for (peer_id in peers) {
			peers[peer_id].close();
		}

		peers = {};
		peer_media_elements = {};
	});
	socket.on('msg4One',function (o) {
		// log("接收到 msg4One 消息",o)
		// console.log(["msg4One",o])
		RevMsg({"data":JSON.stringify(o)})
	});

	// function parseCandidate (text) {
	// 	try{
	// 		const cds = 'candidate:';
	// 		const pos = text.indexOf(cds) + cds.length;
	// 		let [foundation, component, protocol, priority, address, port, , type] = text.substr(pos).split(' ');
	// 		return {
	// 			'component': component,
	// 			'type': type,
	// 			'foundation': foundation,
	// 			'protocol': protocol,
	// 			'address': address,
	// 			'port': port,
	// 			'priority': priority
	// 		}
	// 	}catch(e){log("parseCandidate",e)}
	// }
	let addPeerCbk=function(config){
		var peer_id = config.peer_id;
		if(config.userdata && config.userdata.nick){
			gaM[peer_id] = {nick:config.userdata.nick};
			// if(config.userdata.nick)setTips("Online",config.userdata.nick);
			upListMb()
		}
		if (peer_id in peers)return;// 避免重复添加
		if(!config.should_create_offer){
			playSd(1);
			// safari 会报错 https://juejin.cn/post/6844903741838082062
			// LogMsg(`昵称: ${config.userdata.nick} 上线了`);// 后期这里优化为名字闪烁
		}
		// LogMsg(`当前共 (${config.nOnline}) 人在线`);
		
		// 对方下线后，再次重新连接上来，但是会导致 setRemoteDescription 错误
		// if (peer_id in peers) {
		// 	log("Already connected to peer " + peer_id);
		// 	return;
		// }
		// this will no longer be needed by chrome eventually (supposedly), but is necessary for now to get firefox to talk to chrome
		// ,RtpDataChannels:true,preferSCTP:isFirefox
		// iceTransportPolicy, iceCandidatePoolSize
		// chrome 不支持：DtlsSrtpKeyAgreement "DtlsSrtpKeyAgreement": true
		let nCIce = 0;
		let getIceCfg = ()=>{
			let oTp12 = { "iceServers": ICE_SERVERS.slice(nCIce,nCIce + 2),iceTransportPolicy: 'all'};
			nCIce += 2;
			if(nCIce >= ICE_SERVERS.length)nCIce = 0;
			return oTp12;
		}
		let pC1 = new RTCPeerConnection(getIceCfg());
		peers[peer_id] = pC1;
		let reConn = function(){
			try{
				log("start reConn "+config.userdata.nick);
				pC1.setConfiguration(getIceCfg());
				pC1.restartIce()
			}catch(e){log('pC1.restartIce ',e)}
		};
		pC1.onicegatheringstatechange = async function(e){
			let cc = e.target;
			// switch(pC1.iceGatheringState){
			// 	case "new","gathering":// 对等连接刚刚创建，尚未进行任何网络连接;ICE 代理正在收集候选的连接。
			// 		break;
			// 	case 'complete':
			// 		return;
			// }
			// switch(pC1.connectionState){
			// 	case "new":
			// 		break;
			// 	case "connecting":// 表示至少有一个 ICE 连接处于正在建立连接的状态
			// 		break;
			// 	case "connected":// 至少有一个连接处于 connected 或 completed 状态
			// 		break;
			// 	case "disconnected","failed":// 表示至少有一个 ICE 连接处于 disconnected 状态，并且没有连接处于 failed、connecting 或 checking 状态。；表示至少有一个 ICE 连接处于 failed 的状态。
			// 		break;
			// 	case "closed":// 表示 RTCPeerConnection 已关闭。
			// 	// connectionState 反映了整体连接状态，包括 ICE 搜集、信令和媒体通道。如果在 connectionState 为 'failed' 或 'closed' 时重启 ICE，如果故障在于连接过程的其他阶段，可能会触发不必要的重启
			// 		return;
			// }
			let is1 = cc.iceConnectionState,is2 = cc.connectionState,is3 = cc.iceGatheringState,is4 = cc.signalingState;
			log("P2P ICE state: "+is1 + "\niceGatheringState: "+is3+"\nconnectionState: " + is2+"\nsignalingState: "+is4+"\n");
			if(is1 == "failed"){
				log("onicegatheringstatechange reConn "+ is1)
				reConn()
			}
			// switch(is1){
			// 	case "new","checking":
			// 		break;
			// 	case "connected": //  ICE 代理至少对每个候选发现了一个可用的连接，此时仍然会继续测试远程候选以便发现更优的连接。同时可能在继续收集候选。
			// await pc.peerIdentity
			// 		break
			// 	case "icegatheringcomplete":// ICE 搜集已完成，但可能尚未建立完整连接。
			// 		break
			// 	case "completed"://  ICE 代理已经发现了可用的连接，不再测试远程候选。
			// 		break;
			// 	case "failed": // ICE 候选测试了所有远程候选没有发现匹配的候选。也可能有些候选中发现了一些可用连接。
			// 		reConn();
			// 		break;
			// 	case "disconnected":// 测试不再活跃，这可能是一个暂时的状态，可以自我恢复。
			// 		break;
			// 	case "closed"://  ICE 代理关闭，不再应答任何请求
			// 		break;
			// }
			if(gaM[peer_id])gaM[peer_id]["pc"]=cc;
		}
		
		// p2p 打洞成功触发事件 
		let nRpt6 = {}
		pC1.onicecandidate = async function (event) {
			let ec = event.candidate,s1 = event.state,oS1={
				"host": '候选者是本地 IP 地址和端口',
				"srflx": '候选者通过 STUN 服务器反射获取，可能位于 NAT 设备之后',
				"prflx": '候选者通过 PRFLX 服务器反射获取，通常用于对称 NAT 情况',
				"relay": '候选者通过 TURN 服务器中继获取，用于无法进行直接 P2P 连接的情况',
				"relaycand": '候选者是 TURN 服务器提供的候选者，但尚未验证其可达性',
				"error": '候选者获取过程中出现错误'
			};
			if (!ec||!ec.candidate) { return }
			if(s1 == "failed"||s1 == "disconnected"){// NAT 穿透失败; 连接建立失败，可能与 NAT 穿透失败有关
				log("onicecandidate reConn "+ s1)
				reConn();
				return;
			}
			getYourInfo(ec.candidate);
			socket.emit('relayICECandidate', {
				'peer_id': peer_id,
				'ice_candidate': {
					'sdpMLineIndex': event.candidate.sdpMLineIndex,
					'candidate': event.candidate.candidate
				}
			});
			try{
				let t1= event.candidate.type;
				if(oS1[t1||""]&& !nRpt6[t1]){
					nRpt6[t1]=1;
					log("ICE Type "+t1+' '+oS1[t1]+"\n",parseCandidate(ec.candidate));
				}
			}catch(e){log(e)}
		}
		// https://stackoverflow.com/questions/55379332/onaddstream-event-not-called
		//  addStream and onaddstream are deprecated
		// ontrack event.stream[0]
		// var xxGet = function(o,a,prefix){
		// 	for(var k in o){
		// 		a.push(prefix+k + ":" + o[k]);
		// 	}
		// 	return a;
		// }
		// https://gist.github.com/Xeoncross/6bb446dc2241461422e3
		// https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/removestream_event
		// https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/track_event
		// pC1.onremovestream=function(event){
		// 	// log("onremovestream",event);
		// 	// alert(["onremovestream",event])
		// 	// console.log(event)
		// }
		let fnAddOneStream = async function(stream,id,label){
			id=id||"";
			label=label||"";
			var remote_media = fnCreateVid(0);
			remote_media.autoplay = true;
			remote_media.controls = false;
			remote_media.title = config.userdata.nick+" -- "+label;
			oCurmdm=peer_media_elements[peer_id] = $("#Pmt" + remote_media.id);
			$("#Pmtwebcam").css({width:"33%",height:"100%",margin:"0"});
			if(isSvLc()||dg("saveMeVD").checked||oESvl.checked){
				fnStartRct(stream,1,config.userdata.nick,remote_media);
			}
			attachMediaStream(remote_media, stream);
		};
		let fnAddStream = async function(event){
			var oCurmdm;
			if(!g_bTxtChat && event.stream && !peer_media_elements[peer_id]){try {
				var vt = event.stream.getVideoTracks();
    			if (vt.length > 1) {
					for (var i = 0; i < vt.length; i++) {
						try{
							var track = vt[i];
							// alert([vt.length,track.id,track.label,track.readyState,track.stream])
							// if(track.readyState === 'ended')track.stop();
							// else{fnAddOneStream(track.stream||event.stream,track.id,track.label)}
							fnAddOneStream(track.stream||event.stream,track.id,track.label);
							log("fnAddStream",track.readyState)
						}catch(e){log(e)}
					}
				}else{fnAddOneStream(event.stream)}
			} catch(e) {
				if(oCurmdm)oCurmdm.remove();
				delete peer_media_elements[peer_id];
			 }}
		};
		pC1.onaddstream = fnAddStream;
		// p2p 流事件
		if (!g_bTxtChat) {
			initOnePeer(pC1, peer_id)
		}
		let cof = async function(){//,iceRestart: true // 导致内网无法p2p
			pC1.createOffer({offerToReceiveAudio:true,offerToReceiveVideo:true}).then(async function(lds){
				// log("Local offer description is: ", local_description);
				pC1.setLocalDescription(lds).then(async function(){
					if(socket)socket.emit('relaySessionDescription', { 'peer_id': peer_id, 'session_description': lds });
				},async function(){fnMyLogs("Offer setLocalDescription failed!",lds)});
			},log);
		};
		if (config.should_create_offer) {
			cof();
		}
		// pC1.onnegotiationneeded=cof;
		
		try{
			pC1.onclose = async function () {
				delete gaM[peer_id]["pc"];
				delete gaM[peer_id]['sendChannel'];
			};
			pC1.onicecandidateerror=log;
			pC1.ontrack=log;
			pC1.onerror=log;
		}catch(e){log("onclose::",e)}

		// 根据NAT类型和带宽使用情况调整视频清晰度
		function adjustVideoQuality(natType, bandwidth) {
			let sd=pC1.getSenders();
			if(!sd || !natType)return;
			let stk =sd.find(sender => sender.track.kind === 'video'); 
			if(!stk)return;
			let vt = stk.track;
			if(!vt)return;
			log("adjustVideoQuality:" + natType + " " + bandwidth + "bps")
			if (natType === 'host' || natType === 'srflx'|| natType === 'prflx') {
				// bandwidth>=bandwidthThreshold
				// log(["natType:::>",natType,bandwidth,bandwidthThreshold,bandwidth>=bandwidthThreshold])
				// 如果都在一个内网或NAT成功，使用高清
				// var opts2 = { advanced: [{ width: 640, height: 480 }] } // https://stackoverflow.com/questions/68342671/mediadevice-applyconstraints-doesnt-work
				// https://developer.mozilla.org/en-US/docs/Web/API/MediaStreamTrack/applyConstraints
				log(config.userdata.nick+" NAT ok 使用高清");
				vt.applyConstraints({
					width: { ideal: n002 },
					height: { ideal: n002 }
				}).catch(log);
			} else {// 如果NAT失败，使用低清
				log(config.userdata.nick+" NAT失败 使用低清");
				vt.applyConstraints({
					width: { ideal: 640 },
					height: { ideal: 480 }
				}).catch(log);
			}
		}
		let nCstt = setInterval(function(){
			// 获取统计信息
			pC1.getStats(null).then(stats => {
				try{
					// 遍历统计信息
					stats.forEach(report => {
						// 判断NAT类型和带宽使用情况
						if (report.type === 'candidate-pair') {
							if (report.nominated) {
								let natType = report.localCandidateType;
								let bandwidth = report.availableOutgoingBitrate;
								// 根据NAT类型和带宽使用情况调整视频清晰度
								try{adjustVideoQuality(natType, bandwidth)}catch(e){log(e)}
								clearInterval(nCstt);
							}
						}
					})
				}catch(e){log(e)}
			}).catch(e => {log(e)});
		}, 10000);
	};
	socket.on('addPeer', addPeerCbk);// 这里每个节点上线都会被调用1次，因此会产生若干 pC1

	socket.on('sessionDescription', function (config) {
		var peer_id = config.peer_id;
		var peer = peers[peer_id];
		var remote_description = config.session_description;
		// LogMsg(`用户 ${config.userdata.nick} E2E/P2P 安全连接ok`);
		try{
			// log("sessionDescription == ",config)
			xM = config["session_description"]["sdp"].match(/a=max-message-size:\s*(\d+)/);
			if (xM && xM.length >= 2) {
				var n08 = parseInt(xM[1]) - 800;
				gaM[peer_id]["maxSendSize"]=n08;
				// LogMsg(`set ${peer_id} maxSendSize = ${n08}`)
			}
		}catch(e){log(e)}
		// log('1 Remote Session-description received from ', config);
		/*允许设置多个 setRemoteDescription。您可以在连接的生命周期内多次调用 setRemoteDescription 方法，以接收来自不同远程对等方的会话描述。
		每次调用 setRemoteDescription 时，它会更新连接的远程描述，从而允许您在同一个连接上与多个不同的远程对等方进行通信 */
		var desc = new RTCSessionDescription(remote_description);
		peer.setRemoteDescription(desc,async function(){
			if (remote_description.type == "offer") {
				peer.createAnswer(async function (local_description) {
						peer.setLocalDescription(local_description,async function () {
								socket.emit('relaySessionDescription', { 'peer_id': peer_id, 'session_description': local_description });
								gaM[peer_id]["pcok"] = true;
								fnTxtChatOne(null,peer_id);// 最大坑，必须在RTCPeerConnection之后，否则调用失败
								// log("setRemoteDescription -> createAnswer -> setLocalDescription - > relaySessionDescription")
							},async function () { log("Answer setLocalDescription failed!",local_description); }
						);
					},async function (error) {
						fnMyLogs2("Error creating answer: ", error, peer);
					});
			}
		},async function (error) {
			log("setRemoteDescription error: ", error,remote_description);
		});
	});

	socket.on('iceCandidate', function (config) {
		var peer = peers[config.peer_id];
		var ice_candidate = config.ice_candidate;
		peer.addIceCandidate(new RTCIceCandidate(ice_candidate));
	});
	socket.on('setNick', function (s) {
		if (s && szCltFg == oNick.val()){
			if(0 == s.indexOf("{"))try{s=JSON.parse(s)}catch(e){}
			oNick.val(s["nick"]||s["id"]||s);
			if(s["vlst"]?.length)gotDevices(s["vlst"]);
		}
	})

	socket.on('removePeer', function (config) {
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
		delete gaM[peer_id];
		upListMb();
		bStopRsize = !($("#myCtn div.rounded").length == 1);
	});
	$('#roomurl').on('click', function(event){
		let range, selection;
		selection = window.getSelection();
		range = document.createRange();
		range.selectNodeContents(event.target);
		selection.removeAllRanges();
		selection.addRange(range);
		document.execCommand("copy");
	});
	$('#closebtn').on('click', function(){
		$('#intro').hide();
		$("#sInvite").prop(ckd,false);
	});
}

function stopPc01(pc){
	if(!pc)return;
	for (k in pc){
		if (String(k).indexOf("on") == 0&& typeof pc[k] == "function") {
			pc[k] = null;
		}
	}
}

// 构建二维码
function MkQrcd () {
	var aP = [];
	$("input[type=checkbox],input[type=text]").map(function (i) {
		if(!String(this.id) || "sInvite" == this.id)return;
		if(this.type == "checkbox"){this.checked && aP.push(this.id + "=true")}
		else if(this.id != "nick" && this.value) aP.push(this.id + "=" + encodeURIComponent(this.value));
	});
	if($("#stChat").css("display")!="none")aP.push("startChat=1");
	else if($("#startChat").css("display")!="none")aP.push("stChat=1");

	var szCurUrl = document.location.href.split("#")[0].split("?")[0] + "?" + aP.join("&");
	if(szLstQrcode == szCurUrl)return;
	szLstQrcode = szCurUrl;
	dg('roomurl').textContent = szCurUrl;
	o1 = dg("myQrcode")
	o1.innerHTML = ""
	let c1 = function(){new QRCode(o1, { text: szCurUrl, width: 200, height: 200 })};
	if(typeof QRCode=="undefined"){
		Is("/js/4.js",c1);
	}else{
		c1();
	}
	
	$("#myQrcode img").css({ width: "calc(100vw * 0.125)", height: "auto", "margin": "auto" });
}


// 构建、初始化全局 变量 g_Constraints，必须运行，否则视频聊天无法启动 https://webrtchacks.github.io/WebRTC-Camera-Resolution/
function appSet() {
	const audioSource = $("#audioInputSelect").val();
	const videoSource = $("#videoSelect").val();
	var oT = {
		deviceId: audioSource ? { exact: audioSource } : undefined,
		noiseSuppression: true,
		echoCancellation: true, //{ exact: true },//'system',
		autoGainControl: false,
		suppressLocalAudioPlayback: true,
		sampleRate: { max: 48000, min: 48000 },
		channelCount: { max: 2, min: 1 },
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
	/*var constraints = {
  video: {
    width: { min: 320, ideal: 320 },
    height: { min: 240 },
    frameRate: 60,
    facingMode: "user",
  }
}; */
	// 不能加更多属性了，不然可能导致chrome无法创建对象
	g_Constraints = {
		"audio": oT,
		"video": {// 将 deviceId 属性从 video 对象中删除。此属性不兼容 Safari 和 Firefox。
			"facingMode":"environment",// "user",// "environment",
			// 'mandatory': {// chrome 不支持
				// width: n002,
    			// height: n003,
				width: { ideal: n002},
    			height:{ ideal:  n003},
				minFrameRate: n001,
				maxFrameRate: n001
				// ,'width': { 'min': n002,ideal: n002},
				// 'height': { 'min': n003},
			// }
		}
	}
	if(videoSource&& navigator.userAgent.includes("Safari")){// safari才支持  && navigator.userAgent.includes("Safari")
		g_Constraints["video"]["deviceId"] = { exact: videoSource } ;
	}
	if(!!navigator.mozGetUserMedia) {
		g_Constraints["video"] = {
			// width: { ideal: n002,exact: n002 },
			// height: { ideal: n003,exact: n003 },
			frameRate: n001
		};
	}
	// deviceId 与 facingMode 不能同时使用
	// user（前置摄像头）、environment（后置摄像头）、left（前置左侧摄像头）、right（前置右置摄像头）
	var szCurMd = "user";
	if($("#evdUser").prop(ckd))szCurMd = "environment";
	g_Constraints["video"]["facingMode"] = szCurMd;
	return g_Constraints
}

// 改变声音
function ChangeSound (s) {
	if(s)try {
		const audioTracks = s.getAudioTracks()
		appSet(s)
		audioTracks[0].applyConstraints(g_Constraints["audio"]);
	} catch (e) { log(e) }
}

function StopStream () {
	try{
		if (lMs && typeof lMs.getTracks == "function") lMs.getTracks().forEach(function (track) {
			if (track && track.readyState == 'live') {
				track.stop();
			}
		});
		var ot = $("#Pmtwebcam");
		ot.find("*").remove();
		ot.remove();
		if(lM)$(lM).remove(),lM = null;
		window.webcam = null;
		window.stream = null;
		lMs = null
	}catch(e){alert(e)}
}
window.onbeforeunload =StopStream;
const b64toBlob = function(b64Data, contentType='', sliceSize=512){
	const byteCharacters = atob(b64Data);
	const byteArrays = [];
  
	for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
	  const slice = byteCharacters.slice(offset, offset + sliceSize);
  
	  const byteNumbers = new Array(slice.length);
	  for (let i = 0; i < slice.length; i++) {
		byteNumbers[i] = slice.charCodeAt(i);
	  }
  
	  const byteArray = new Uint8Array(byteNumbers);
	  byteArrays.push(byteArray);
	}
  
	const blob = new Blob(byteArrays, {type: contentType});
	return blob;
}
let nTtSize = 0;
function crtDel(o,id,oDv){
	let rm = dc("span");
	rm.className = "rm";
	rm.innerText = " X";
	rm.onclick = function(){
		if(!!db){
			if(id)db.friends.delete(id);
			else if(o.download) db.friends.where("name").anyOf(o.download).delete();
			cntVideo()
		}
		nTtSize -= o.size;
		o.remove();
		this.remove();
		oDv.remove();
	};
	return rm;
}
function rmAllVd(){
	let oXa = $("#sI56");
	oXa.attr("disabled",true);
	var lT = crtLoader(),x = 0;
	let cbk1 = function(){
		$("#ocrRst a").remove();
		$("#ocrRst").html("");
		lT.remove();
	};
	
	if(!!db){
		let ta;
		db.friends.count().then(function(count) {
			ta = count;
			lT.innerText = `Deleting ${ta}`;
		});
		var aX = [];
		db.friends.each(function(i,c){
			aX.push(i.id);
		}).then(function(){
			if(aX.length)db.friends.bulkDelete(aX).then(function(){
				cntVideo();
				cbk1();
				nTtSize = 0;
				dg('sI55').innerText = "⤓ All Video  "
			});
			else cbk1();
		});
	}else cbk1();
	oXa.attr("disabled",false);
}

// 本地浏览器保存
function CrtDldA(s,beSvl,szId,nick,szName){
	var nMax = dg("iVdnm").value||100;
	let a1 = s.split(";base64,");
	let link = dc("a");
	const blob = b64toBlob(a1[1],a1[0].substr(5));
	link.size = blob.size;
	nTtSize+=blob.size;
	const s11 = prettyBytes(blob.size);
	let objectURL = window.URL.createObjectURL(blob)
	var oDv = dc("div");
	oDv.className = "x4";
	$("#ocrRst").append(oDv);
	$(oDv).append(crtDel(link,szId,oDv)).append(link);
	link.className="mmMp4";
	link.href = objectURL;
	link.target = "_blank";
	if(nick)nick+="_";else nick = "";
	let s1 = szName||(nick+getNowStr() +".webm");
	link.download = s1;
	link.innerText = s1+"("+s11+")";
	oDv.title = link.innerText;
	let a = $("#ocrRst a.mmMp4");
	// 这里应该做一些处理，如果没有发生报警，也就是没有检测到人，就不保存，这样可以节省空间
	// 或者剩余存储空间小于 100M 时，也不保存
	if(!g_bWarn&&a.length > nMax||g_nAs < bandwidthThreshold){
		$(a[0].parentElement).find("span.rm").click(); // a[0].parentElement.remove();
	}
	if(beSvl)RegAsync(async function(){
		try{
			if(!!db){
				// base64 解码后保存，节约空间
				let d13 = a1[1];
				db.friends.add({date:new Date().getTime(),video:atob(d13),name:s1}).then(function(){
					cntVideo();
					storageInfo(function(){// 这里可以做一个柄图，显示剩余空间
						dg('sI55').innerText = "⤓ All Video ("+ prettyBytes(nTtSize)+")  "
					});
				});
			}
		}catch(e){log(e)}
	});
}
let isSvLc = ()=>{return typeof SaveMp4 == "function"};
// 触发保存 https://recordrtc.org/   https://www.webrtc-experiment.com/
// https://recordrtc.org/CanvasRecorder.html
var bTm = 0, g_nTmxx9, nT090,fnStartRct = function(vSs,nT,nick,vd) {
	try{
		// 节点离场、本地视频源切换时退出
		let vd1 = $("#Pmt"+vd.id).find("video");
		if(!vd1.length || vd1[0]!=vd)return;

		var stream = vSs||window.stream||lM||window.webcam,oC1 = $(stream);
		if(!stream){
			RegAsyncNoCtx(fnStartRct,vSs,nT,nick,vd);
			return;
		}
		if(isEnded(stream))return log(vd.id + " stream ended");
		// 70 秒内不重复执行
		if(new Date().getTime() - (oC1.attr("bIsRvdRcd")||0) > 70000){
			oC1.attr("bIsRvdRcd",new Date().getTime());
			if(oESvl.checked||oSaveMeVD.checked){
				let opts = {
					type: (!!nT?"":"audio+")+'video'// 测评表明 AV1 是最佳的
					, mimeType: vWcStr
					,disableLogs: true
					,recorderType: MediaStreamRecorder,
					// audioBitsPerSecond : 256 * 8 * 1024,
					// videoBitsPerSecond : 256 * 8 * 1024,
					bitsPerSecond: 256 * 8 * 1024,
					videoBitsPerSecond: qxd,
					frameRate: 24,//15 ～ 30
				};
				var qxd = 1000000,recorder = new RecordRTC(stream, opts);
				recorder.startRecording();
				const nT3 = 60 * 1000 * (nT||(isSvLc() ? 5 : 1));
				//  10分钟,停一下，并上传，然后重新开始
				RegAsync(async function(){
					if (recorder) recorder.stopRecording(async function(){
						// 开启AI、人脸识别的情况，只在检测到人时保存
						if(bEaV8 && !g_bWarn);else{
							try {
								recorder.getDataURL(async function(videoDataURL){
									videoDataURL = String(videoDataURL);
									if(100 > videoDataURL.length)// 跳过无效的视频
										return;
									// 本地保存的情形
									if(isSvLc())RegAsyncNoCtx(SaveMp4,{"data":videoDataURL,"name":nick});
									else{// 浏览器保存
										if(oESvl.checked)RegAsyncNoCtx(CrtDldA,videoDataURL,oESvl.checked,0,nick);
										// else socket.emit('saveVideo', { type:  szT1.split(";")[0],"videoDataURL": videoDataURL});
									}
								});
							} catch (e) {console.log(e)}
						}
					});
				}, nT3);
			}
		}
		RegAsyncNoCtx(fnStartRct,vSs,nT,nick,vd);
	}catch(e){alert(e)}
};
window['fnStartRct'] = fnStartRct;
// 初始化本地视频
// 本地启恩还的时候要解绑定 attachMediaStream 否则会导臃无法再次启动
function setupLm (callback, errorback) {
	if (g_bSetup) return;
	StopStream();
	g_bSetup = true;
	try {
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
		const k0 = "myGetMedia";
		window[k0] = window[k0] || navigator.mediaDevices && navigator.mediaDevices.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
		
		let fnThen=async function(stream){
			// navigator.mediaDevices.getUserMedia = function(o,cbk){
			// 	try{
			// 		if(cbk)cbk(stream);
			// 		stream.then = function(cbk1){cbk1(stream)};
			// 	}catch(e){alert(e)}
			// 	return stream
			// };
			// ChangeSound(stream)
			if(window.stream)window.oldStream=window.stream;
			window.stream = stream;
			lMs = stream;
			let szVideoId = "webcam";
			lM = fnCreateVid(bNbg,szVideoId);
			window.webcam = lM;
			const initFaceCbk = function(){// https://justadudewhohacks.github.io/face-api.js/docs/index.html
				// scoreThreshold 筛选检测到的人脸的置信度阈值
				// iouThreshold：用于非最大抑制（NMS）的IoU（交并比）阈值。默认值为0.3
				// inputScale：输入图像的缩放比例。默认值为128。
				// minFaceSize：最小人脸尺寸。默认值为20
				// https://vladmandic.github.io/face-api/TUTORIAL.html
				const faceOpt = new faceapi.TinyFaceDetectorOptions({scoreThreshold:0.6,minConfidence:0.6,maxResults:100});
				lM.addEventListener('play', function(){
					// 人脸识别
					const n42 = setInterval(async function (){
						try{
							// withFaceLandmarks 是必须的，否则会报错
							const detections = await faceapi.detectAllFaces(window.webcam, faceOpt).withFaceLandmarks().withFaceDescriptors();
							if(detections&&detections.length>0)
							detections.forEach(function(fd){
								if(faceMatcher){
									const bestMatch = faceMatcher.findBestMatch(fd.descriptor);
									if (typeof bestMatch === 'object') console.log(`识别结果：${bestMatch.label}`);
								}
							});
						}catch(e){clearInterval(n42)}
					}, 1000/20);
				});	
			};
			if($("#eFace")[0].checked)initFace(initFaceCbk);
			
			fnAddTmGps();
			// hidden me、self
			var oXv = $("#Pmt" + lM.id),oCps = $("div.compass-circle");
			oCps.css("display","none");
			$("#showme").attr(ckd, true),oXv.removeClass('d-none');

			// try{
				lM.muted = true;
				lM.autoplay = true;
				lM.controls = false;
				attachMediaStream(lM, stream);
			// attachMediaStream(lM, document.getElementsByClassName('output_canvas')[0].captureStream(10));
			// }catch(e){fnMyLogs2(e)}
			if (callback) callback(),callback=null;
			RegAsyncNoCtx(fnStartRct,window.stream,1,dg("nick").value,lM);
			return navigator.mediaDevices.enumerateDevices()
		};
		if(dg("rScreen").checked && (navigator.mediaDevices&&navigator.mediaDevices.getDisplayMedia||navigator.getDisplayMedia)){
			g_Constraints={video: {frame_rate:15,cursor:"always",display_surface:"monitor",logical_surface:true,width:screen.width,height:screen.height}};
			navigator.mediaDevices.getDisplayMedia(g_Constraints).then(fnThen)
		}else{
			window[k0].apply(navigator.mediaDevices,[g_Constraints]).then(fnThen).then(gotDevices).catch(function(e){
				fnMyLogs(e);
				fnMyLogs2("This site will not work without camera/microphone access.");
				if (errorback) errorback();
			});
		}
	} catch (e) { fnMyLogs(e) }
	// if(callback) callback()
}

var captureImage = function(v,w){
	var c = dc("canvas");
	c.width = v.videoWidth * w;
	c.height = v.videoHeight * w;
	c.getContext('2d').drawImage(v, 0, 0, c.width, c.height);
	// 图片品质为0.6
	var s = c.toDataURL('image/jpeg', 1);
	// var img = dc("img");img.src = szImgData;
	return s;
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

// as HTMLImageElement
async function getImgFromStream(){
	if(!lM)return;
	// oImgOcr.src = szImageData = fnV2I(lM.id);// 这一行频率过高性能影响很大
	return oImgOcr;
}

// 人脸相关处理都注册到这里
var imgOldCbk = [];
function videoImgOnload(){
	imgOldCbk.map(function(fn){
		if("function" == typeof fn)try{fn(oImgOcr)}catch(e){log(e)}
	});
}

var szImageData;
/*///////人脸（识别、年龄、表情、性别）相关////////////////
async function initFc(){
	// node 环境，所以需要使用 node 环境下的 canvas 作为渲染基础
	// faceapi.env.monkeyPatch({
	// 	Canvas: window.ov8canvas,
	// 	Image: oImgOcr,
	// 	ImageData: szImageData,
	// })

	// 设定一些初始参数，不需要在意为什么这么设定，是社区给出的最佳设定方法
	// await faceapi.tf.setBackend('tensorflow')
	// await faceapi.tf.enableProdMode()
	// faceapi.tf.ENV['DEBUG'] = false;
	await faceapi.tf.ready()

    const mdP = '/model/face/';
    await faceapi.nets.faceLandmark68Net.loadFromUri(mdP);
    await faceapi.nets.faceLandmark68Net.loadFromUri(mdP);
    await faceapi.nets.ssdMobilenetv1.loadFromUri(mdP);
    await faceapi.nets.faceRecognitionNet.loadFromUri(mdP);
    await faceapi.nets.faceExpressionNet.loadFromUri(mdP);
    await faceapi.nets.ageGenderNet.loadFromUri(mdP);
    await faceapi.nets.tinyFaceDetector.loadFromUri(mdP);
    await faceapi.nets.mtcnn.loadFromUri(mdP);
    await faceapi.nets.faceLandmark68TinyNet.loadFromUri(mdP);

	// // model 参数，识别阀值和最多识别结果数量
	// const minConfidence = 0.01;
	// const maxResults = 66;
	// const optionsSSDMobileNet = new faceapi.SsdMobilenetv1Options({minConfidence,maxResults})
}
// 人脸识别
async function fnFaceDtc(){
	try{
		const results = await faceapi.detectAllFaces(oImgOcr).withAgeAndGender().withFaceLandmarks().withFaceDescriptors().withFaceExpressions();
		if (!results?.length)return;
		// faceapi.draw.drawDetections(ov8canvas, results.map(res => res.detection))
		// results.forEach(result => {
		// 	const { age, gender, genderProbability } = result
		// 	new faceapi.draw.DrawTextField(
		// 	[
		// 		`${faceapi.utils.round(age, 0)} years`,
		// 		`${gender} (${faceapi.utils.round(genderProbability)})`
		// 	],
		// 	result.detection.box.bottomLeft
		// 	).draw(out)
		// })
		document.title = faces.length;
		alert(faces.length)
	}catch(e){log(e)}
}

/////////////////////////*/

var oImgOcr = dg("ocrImg");
oImgOcr.onload = videoImgOnload;

const rmFnImg=function(fnCbk){
	for(var i in imgOldCbk){
		if(imgOldCbk[i] == fnCbk)
		{
			imgOldCbk.splice(i,1);
			return true;
		}
	}
	return false;
},fnTmp89=function(){
	if(window["OcrImg"]){
		if(bEabOcr)imgOldCbk.push(window["OcrImg"]);else rmFnImg(window["OcrImg"]);
	}
	if(bEabOcr)setTimeout(fnTmp89, 3000);
};

var g_oSdMsg = {},oLst1, oLst2,oLst3,oLst4;
// ocr 结果回调用
window['doOcrCbk'] = function(s){
	g_oSdMsg["ocr"] = s;
	$("#ocrRst").text(s);
};
window['doODetcCbk'] = function(oDtc){
	g_oSdMsg["object"] = oDtc;
};

// function fnSendSvMsg(){
// 	if(socket)
// 	{
// 		var oTm42 = JSON.parse(JSON.stringify(g_oSdMsg)),a1 = [oLst1,oLst2,oLst3,oLst4],a2 = ['ocr','object','gps','compass'];
// 		for(var i = 0; i < a1.length;i++){
// 			if(a1[i] == oTm42[a2[i]]){
// 				oTm42[a2[i]] = null;
// 				delete oTm42[a2[i]];
// 			}
// 		}
// 		for(var i = 0; i < a1.length;i++){
// 			if(oTm42[a2[i]])
// 			{
// 				if(g_oYourInfo['ip']?.length)oTm42["ip"] = g_oYourInfo['ip'];
// 				oTm42["date"] = getNowStr();
// 				// id: nick + fingerprint + channel + gps + date
// 				oTm42["nick"] = oNick.val();
// 				oTm42["channel"] = $("#cnId").val();
// 				if(szCltFg)oTm42["fingerprint"] = szCltFg;
// 				socket.emit('svCurImgInfo',oTm42);
// 				break;
// 			}
// 		}
// 		oLst1 = g_oSdMsg["ocr"];
// 		oLst2 = g_oSdMsg["object"];
// 		oLst3 = g_oSdMsg["gps"];
// 		oLst4 = g_oSdMsg["compass"]
// 	}
// }
// 扫码结果回调用
const qrS =function(I){
	if(!I)return;
	const a = [];
	if(-1 < I.indexOf("data:image/"))
	try{
		const cR = new QRCode();
		cR.decode(I,'image/webp').then(function(r){
			// 遍历所有条码和二维码
			for (const c of r) {
				setTips('',c.data);
				a.push(c.content)
			}
		});
	}catch(e){}
	if(a.length){
		playSd(2);
		fnMyLogs(a.join("<br>"));
	}
};

function ldai(){
	if(g_bTxtChat)return;
	// ");// Is('/v8.js');// 依赖 /js/9.js tfjs
	if(bEaV8 && !window.v8Load)window.v8Load = true,Is('/v8.js');//<script src=/js/face-api.min.js></script>"),initFc();
	// if(bRunAi && !window.aiLoad)window.aiLoad = true,$("body").append("<script src=/js/bundle.js></scr"+"ipt>");
	if(bEabOcr && !window.ocrLoad)window.ocrLoad=true,fnTmp89(),$("body").append("<script src=/js/ocr.js></scr"+"ipt>");
}

function getObjInfo(o2,o1){
	var o = {},ss1;
	for(var k in o1){
		ss1 = o2[k]
		if(!ss1)continue;
		if(typeof ss1 == "object"){
			ss1 = JSON.stringify(ss1,null,"  ");
		}
		o[String(k+` ${o1[k]}`).trim()] = ss1;
	}
	return o;
}

function doEvt(event){
	// https://en.wikipedia.org/wiki/Metre_per_second_squared 
	var o = {},o1 = {
		"acceleration":"加速 m/s2,x轴是西到东轴,y轴是南轴到北轴,z轴是下到上轴","accelerationIncludingGravity":"加速包括重力,x轴是西到东轴,y轴是南轴到北轴,z轴是下到上轴","interval":"间隔毫秒","rotationRate":"旋转费率:alpha 设备围绕其Z轴旋转的速度,即围绕垂直于屏幕的一条线旋转;beta 设备围绕其X轴旋转的速率,即从前到后旋转;gamma 设备围绕其Y轴旋转的速率,即左右旋转",
		absolute:"有方向数据",alpha:"z轴 0 ~ 360 度",beta:"x轴从前后运动 -180 ~ 180 度",gamma:"y轴从左到右运动 -90 ~ 90 度",webkitCompassHeading:"围绕世界系统z轴的运动与北方方向之间的差[ 0 ~ 360 度]",webkitCompassAccuracy:"准确性"
	};
	g_oSdMsg["compass"] = getObjInfo(event,o1);
	fnMyLogs(JSON.stringify(g_oSdMsg["compass"],null," "));
}
let pointDegree;
function doGps(e) {
	var compass = e.webkitCompassHeading || Math.abs(e.alpha - 360),compassCircle = document.querySelector(".compass-circle"),myPoint = document.querySelector(".my-point");
	compassCircle.style.transform = `translate(-50%, -50%) rotate(${-compass}deg)`;
	$("div.compass-circle").css("display","block");

	// ±15 degree
	if (
	  (pointDegree < Math.abs(compass) &&
		pointDegree + 15 > Math.abs(compass)) ||
	  pointDegree > Math.abs(compass + 15) ||
	  pointDegree < Math.abs(compass)
	) {
	  myPoint.style.opacity = 0;
	} else if (pointDegree) {
	  myPoint.style.opacity = 1;
	}
}
function locationHandler(position) {
	const { latitude, longitude } = position.coords;
	pointDegree = calcDegreeToPoint(latitude, longitude);

	if (pointDegree < 0) {
	  pointDegree = pointDegree + 360;
	}
  }

  function calcDegreeToPoint(latitude, longitude) {
	// Qibla geolocation
	const point = {
	  lat: 21.422487,
	  lng: 39.826206
	};

	const phiK = (point.lat * Math.PI) / 180.0;
	const lambdaK = (point.lng * Math.PI) / 180.0;
	const phi = (latitude * Math.PI) / 180.0;
	const lambda = (longitude * Math.PI) / 180.0;
	const psi =
	  (180.0 / Math.PI) *
	  Math.atan2(
		Math.sin(lambdaK - lambda),
		Math.cos(phi) * Math.tan(phiK) -
		  Math.sin(phi) * Math.cos(lambdaK - lambda)
	  );
	return Math.round(psi);
}
// 将等比例缩放 放到这里
const createScaledCanvas = function(canvas, maxWidth = 1024){
	const aspectRatio = canvas.width / canvas.height;
	const maxImageWidth = Math.min(150, maxWidth);
	const scaledWidth = maxImageWidth;
	const scaledHeight = maxImageWidth / aspectRatio;
  
	const scaledCanvas = dc("canvas");
	scaledCanvas.width = scaledWidth;
	scaledCanvas.height = scaledHeight;
	const scaledCtx = scaledCanvas.getContext("2d");
	scaledCtx.drawImage(canvas, 0, 0, canvas.width, canvas.height, 0, 0, scaledWidth, scaledHeight);
  
	return scaledCanvas;
  };
  
  // Function to convert ImageData to data URL
  const createImageDataUrl = function(imageData){
	return new Promise(function(resolve){
	  const canvas = dc("canvas");
	  canvas.width = imageData.width;
	  canvas.height = imageData.height;
	  const ctx = canvas.getContext("2d");
	  ctx.putImageData(imageData, 0, 0);
	  canvas.toBlob(function(blob) {
		resolve(canvas); // 返回canvas对象而不是data URL
	  });
	});
  };
  
  const addCroppedImageToCanvas = async function(canvasId, imageData, maxWidth = 1024) {
	if(!canvasId)return;
	const canvas = await createImageDataUrl(imageData); // 等待canvas对象返回
	const scaledCanvas = createScaledCanvas(canvas, maxWidth);
	dg(canvasId).appendChild(scaledCanvas);
  
	// 释放内存
	// URL.revokeObjectURL(img.src);
  };
	


// HTML5 Video的流是只读的，不可直接修改的 https://developer.mozilla.org/en-US/docs/Web/API/VTTCue
function fnAddTmGps(){
	// var video = dg('webcam');
	// const track = video.addTextTrack('subtitles', 'text',"en");
    // track.mode = 'showing'; // Show the cues

	// var nLst = 0;
    // video.addEventListener('timeupdate', () => {
	// 	if(0 == nLst)nLst = new Date().getTime();
	// 	else{
	// 		var nTm = new Date().getTime();
	// 		if(nTm - nLst < 1000)return;
	// 		nLst = nTm;
	// 	}
	// 	const szTm = getNowStr();
	// 	const cue = new VTTCue(video.currentTime, video.currentTime + 1, szTm);
	// 	cue.position = 80;
	// 	cue.line = 1;
	// 	track.addCue(cue);
	// 	// return false
	// });
}
let idGps = 0;
function StartPosInfo(){
	try{if(idGps)stopPosInfo(idGps)}catch(e){}
	if(navigator.geolocation) { // 经纬度信息
		idGps = navigator.geolocation.watchPosition(function(position){
            var o1 = {"latitude":"纬度","longitude":"经度","accuracy":"准确度[米]","altitude":"海拔","altitudeAccuracy":"海拔精度","heading":"设备移动方向0为正北","speed":"速度[米/秒]","floorLevel":""};
            // heading 设备移动方向 此值以度为单位，表示设备离正北有多远。0度表示真北，方向顺时针确定（这意味着东是90度，西是270度）。如果GeolocationCoordinates.speed为0，则heading为NaN。如果设备无法提供标题信息，则此值为null。
			g_oSdMsg["gps"] = getObjInfo(position.coords,o1);
			var s1 = JSON.stringify(g_oSdMsg["gps"],null," ");
			$("#gInfo").text(s1);
            fnMyLogs(s1);
			locationHandler(position);
			socket.emit('svClientInfo', g_oYourInfo, szCltFg,window.aMacIps,g_oSdMsg);
			if(!dg("eLpos").checked)stopPosInfo(idGps);
        }, function(e){
        }, {maximumAge:10 * 1000,enableHighAccuracy:true, timeout: 5000,useSignificantChanges:true});
	}
	/*
	x轴在屏幕平面上，向右正，向左负。
	y轴位于屏幕平面上，朝向顶部为正，朝向底部为负。
	z轴垂直于屏幕或键盘，从屏幕向外延伸。
	*/
	var doBdEvt = function(){// orientationchange
		window.addEventListener("deviceorientation",function(e){// 获取陀螺仪事件
			doGps(e);
			doEvt(e)
		},true);
		window.addEventListener("devicemotion",doEvt,true);
		// 获取磁力计事件 navigator.magneticField
		// window.addEventListener("magneticfield", function(event) {
		// 	// 获取磁场强度
		// 	var strength = event.strength;
		// 	// 获取 x 轴磁场强度
		// 	var x = strength.x;
		// 	// 获取 y 轴磁场强度
		// 	var y = strength.y;
		// 	// 获取 z 轴磁场强度
		// 	var z = strength.z;
		// });
	};

	if(window.DeviceOrientationEvent){
		if(typeof DeviceOrientationEvent.requestPermission === 'function'){
			DeviceOrientationEvent.requestPermission().then(function(state) {
				if ('granted' === state) {// 陀螺仪信息
					doBdEvt();
				}
			});
		}else doBdEvt();
	}
	return idGps;
}
function stopPosInfo(id){
	if(id)navigator.geolocation.clearWatch(id);
	window.removeEventListener("deviceorientation",doEvt,true);
	window.removeEventListener("devicemotion",doEvt,true);
}


function initBox(){
	location.search.substring(1).split("&").forEach(function (item) {
		item = item.split("=");
		if(0== item.length || !item[0])return;
		var o = dg(item[0]);
		if(o){
			item[1]=decodeURIComponent(item[1])
			if(o.type == "checkbox")(function(o){
				RegAsync(async function(){
					o.checked = "true" == String(item[1]||"").toLowerCase();
					if(o.id != "atRd")o.click(); // atRd click会导致清空定时函数
				});
			})(o);
			else if(o.tagName == "A")o.click();
			else o.value = item[1];
		}
	});
}
var v8cTop = 42,g_bWarn = false,nWarn = 0;
window.addEventListener("beforeunload",function(){
	part_chat_channel($("#cnId").val());
	StopStream();
});

function plWarn(){
	playSd(3);
	clearTimeout(nWarn);
	g_bWarn = true;
	nWarn = setTimeout(function(){g_bWarn = !!0}, 25000);
}
window.g_oWarObj = {};
function boxslct(o){
	if(o.checked)window.g_oWarObj[o.value] = 1;
	else delete window.g_oWarObj[o.value];
}
window.nWscore=0.6;
function showWnSt(){
	var ws = $("#wnset"),o = window.labels, a = [],sD = "人,手机,刀,枪,狗";
	if(o){
		for(var i in o){
			var szCkdt = "";
			if(-1 < sD.indexOf(o[i])){
				window.g_oWarObj[o[i]]=1,szCkdt = ckd;
				a.push(`<i><input type=checkbox onchange=boxslct(this) value='${o[i]}' ${szCkdt}>${o[i]}</i>`);
			}
		}
	}else{
		RegAsyncNoCtx(showWnSt);
		return;
	}
	ws.html(a.join("")).show();
} 
  
// 要下载的资源URL数组，每个元素包含magnetURI和url属性
// const resourceURLs = [
// 	{ magnetURI: "magnet:?xt=urn:btih:08ada5a...", url: "/model/yolov8n_web_model/group1-shard4of4.bin" },
// 	// Add other resource objects here
// ];
  
// // 调用并发下载函数
// downloadResources(resourceURLs);
const html2img=function(html) {
	// https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js
	return new Promise(function(resolve){
		const d1 = dc("div");
		d1.innerHTML = html;
		let c1 = function(){
			html2canvas(d1).then(function(canvas){
				canvas.toBlob(function(blob){
					resolve(blob)
				},'image/webp',0.5);
			})
		};
		if(typeof html2canvas == "undefined"){
			Is("/js/13.js",c1);
		}else c1();
	});
}, genQrcd=function(s){
	const rq1 =  new QRCode("msgList", {
		text: s,
		width: 200,
		height: 200,
		errorCorrectionLevel: "H"
		});
	// const s1 = rq1.renderAsImage();
	// alert(s1)
};
function GetLg(){
	if(location.search){
		var o = location.search.split("lang=");
		if(1 < o.length)return o[1].split("&")[0];
	}
	// 获取当前语言
	var lang = navigator.language || navigator.userLanguage;
	if(lang){
		lang = lang.toLowerCase();
		if(-1 < lang.indexOf("zh"))lang= "cn";
	}
	return lang||"en";
}
// 创建一个Intersection Observer,懒加载图片，可见再加载
let observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.src = entry.target.getAttribute('data-src');
            observer.unobserve(entry.target);
        }
    });
});
function initLang(){
	Is("/js/lang.js"+(location.search||""),function(){
		var oMs = $("#slctMtl"),bS1 = true,ostL= $("#stL"),lcg = GetLg().toLowerCase(),nDl3 = 64;
		if(aLang[lcg]&&aLang[lcg]["contry"])lcg=aLang[lcg]["contry"];// 从语言得到国家
		// https://cdn.simplelocalize.io/public/v1/flags/es.svg
		ostL.html("<img src=/flags/"+lcg+".svg>").click(async function(){
			if(bS1){
				if(!!aLang){
					let fragment = document.createDocumentFragment(),_s = "_self",sH = "/?lang=";
					for(var k in aLang){
						if(String(k).length>8||!aLang[k]["contry"]) continue;
						// 创建一个新的 DOM 节点
						let d1 = document.createElement('div');
						d1.className = 'w';
		
						let a = document.createElement('a');
						a.href = sH + k;
						a.target = _s;
						a.appendChild(d1);
				
						let img = document.createElement('img');
						img.dataset.src = '/flags/' + (aLang[k]["contry"]||"us").toLowerCase() + ".svg";
						d1.appendChild(img);
				
						let text = document.createTextNode(aLang[k]["des"]);
						d1.appendChild(text);
						// 将新的 DOM 节点添加到 DocumentFragment 中
						fragment.appendChild(a);
					}
					oMs[0].appendChild(fragment);
					oMs.find("img").each(function(){
						observer.observe(this);
					});
					aLang=0;
				}
				oMs.show(),bS1=false;
			}else oMs.hide(),bS1=true
		});
		oMs.click(async function(){
			oMs.hide();
		});
		
		if(!!language&&"en" != lcg){
			let k = 0;
			let fnSlg = async function(){
				if(k < language.length){
					try{
						let oT1 = language[k];
						let o1 = oT1["obj"];
						if(!oT1["des"] || !o1 || !o1.length)return;
						
						for(let x = 0;x < o1.length;x++){
							let o7 = o1[x];
							let  o2;
							if(o7["tag"] && "title" == o7["tag"]){
								document.title = oT1["des"];
								continue;
							}
							o2 = dg(o7["id"]);
							if(o2 && o7["id"] && o7["attr"]){
								if(o7["attr"] == "text")o2.innerText=oT1["des"];
								else o2[o7["attr"]]=oT1["des"];
							}
						}
					}catch(e){}
					k++;
					RegAsync(fnSlg,nDl3);
				}
			};
			RegAsync(fnSlg,nDl3);
		}
	});
}
function storageInfo(cbk){
	try{
		navigator.storage.estimate().then(es => {
			g_nUs = es.usage;// Used storage
			if(g_nUs < g_nUs_old)g_nUs_old=g_nUs;
			g_nTs = es.quota;// Total storage
			g_nAs=es.quota - es.usage; // Available storage
			// dg('iVdnm').value = Math.round(g_nAs/1024/1024/40);
			// log(`Used storage: ${prettyBytes(es.usage)}; Total storage: ${prettyBytes(es.quota)}; Available storage: ${prettyBytes(es.quota - es.usage)}`)
			if(cbk)cbk();
		})
	}catch(e){log(e)}
}

$(document).ready(async function(){
	oLogs = dg("logs");
	oNick = $("#nick");
	oMyCtn = $("#myCtn");
	oESvl = dg("eSvl");
	oSaveMeVD = dg("saveMeVD");
	oCAllVideo = dc("canvas");
	oEAi=$("#eAi");
	oCAllVideo.id = "cAllVideo"
	// $(oCAllVideo).hide();
	// genQrcd( `L: 最低的容错水平，可以纠正 7 个错误。
	// 	M: 中等的容错水平，可以纠正 15 个错误。
	// 	Q: 较高的容错水平，可以纠正 25 个错误。
	// 	H: 最高的容错水平，可以纠正 30 个错误。`);
	clientJs = new ClientJS();
	let ua = navigator.userAgent;
	if(ua.indexOf("Firefox")){
		vWcStr = "video/webm;codecs=vp9";// firefox 仅这个格式
	}else if(ua.indexOf("Chrome")){
		vWcStr = "video/webm;codecs=vp9"; // 在高分辨率下更高的压缩效率
	}else if(ua.indexOf("Safari")){
		vWcStr = "video/mp4"; // 在高分辨率下更高的压缩效率
	}

	bIsMobile = clientJs.isMobile();
	szCltFg = clientJs.getFingerprint();
	clientHeight = document.documentElement.clientHeight;
	vs07 = document.querySelector('select#videoSelect');
	ais1 = document.querySelector('select#audioInputSelect');
	aos2 = document.querySelector('select#audioOutputSelect');
	selectors = [ais1, aos2, vs07];
	selectors.forEach(function (select) { $(select).change(appSet) });
	$(vs07).change(function(){
		g_bSetup = false;
		StartVideo();
	});
	$('#uIps').on("change", function () {
		bEaIpfs = this.checked;	
	});

	$('#saveMe').on("change", async function () {
		if (socket && lM && this.checked) {// 3秒一保存
			clearInterval(bTm);
			bTm = setInterval(function () {
				if(lM)socket.emit('saveImg', fnV2I(lM.id), g_LbsIps);
			}, 1000);
		}
		else clearInterval(bTm);
	});

	$("#showme").on("change", async function () {
		if(!lM)return;
		var oNt = $("#Pmt" + lM.id);
		if (this.checked) oNt.removeClass('d-none');
		else oNt.addClass('d-none');
	});

	let bHd = true;
	let SetRow1=function(){
		if(bHd){
		   bHd=false;
		   $("div.row1 *").hide();
		   $("#shRow1")[0].innerText="<";
		}else{
			bHd=true;
			$("div.row1 *").show();
			$("#shRow1")[0].innerText=">";
		}
		return false;
	};

	var doKstart = false;
	const dspNa=function(){
		var oT0 = $("#cah,#nkid"),o7 = $("#qmI");
		if(bIsMobile && "true" !=$("div.rtool").attr("show"))oT0.hide(),o7.addClass("r1lft");
		else oT0.show(),o7.removeClass("r1lft")};
	// navigator.mediaDevices.enumerateDevices().then(function(a){console.log(a[0])})
	var szHs = document.location.hash,
		oCnId = $("#cnId"),
		oStartChat = $("#startChat"),
		oStChat = $("#stChat"),
		osdMsg = $("#sdMsg"),
		oTxtChat = $(".txtChat")
		oclsId = $("#clsId"),
		ovChat = $(".vChat");
		
	$("#shRow1").click(SetRow1);
	// text chat
	oStChat.click(async function () {
		playSd(1);
		var pdv = oCnId;if("" == pdv.val())pdv.val('51pwn'),pdv.change();
		b_clickJoin = doKstart = g_bTxtChat = true;
		oTxtChat.css("display", "inline-block");
		oStChat.hide();
		oMyCtn.hide();
		ovChat.hide();
		dspNa();
		
		oMyCtn.html("");
		// https://9to5answer.com/stop-close-webcam-stream-which-is-opened-by-navigator-mediadevices-getusermedia
		StopStream();
		g_bSetup = !g_bTxtChat;
		JoinRoom();
		$("#eLpos").click();
		SetRow1();
		setMF();
	});
	// video chat
	oStartChat.click(async function(e){
		SetRow1();
		/*
		https://webkit.org/blog/7734/auto-play-policy-changes-for-macos/
		https://www.crifan.com/safari_js_code_unhandled_promise_rejection_notallowederror_the_request_is_not_allowed_by_the_user_agent_or_the_platform_in_the_current_context/
		https://www.coder.work/article/794000
		https://webkit.org/blog/6784/new-video-policies-for-ios/
		https://stackoverflow.com/questions/52298195/safari-ios-audio-refusing-to-play-with-error
		*/
		playSd(1);
		var pdv = $("#cnId");if("" == pdv.val())pdv.val('51pwn'),pdv.change();
		b_clickJoin=true;
		g_bTxtChat = false
		doKstart = true;
		oStChat.show();
		oStartChat.hide();
		oTxtChat.hide();
		oMyCtn.show()
		$("#msgList").show();
		ovChat.show();
		dspNa();
		StartVideo();
		ldai()
	});
	var bELpos,bposInit = false;
	// $("#eFace").change(function(){
	// 	if(this.checked)initFace();
	// });
	$("#eLpos").change(async function(){
		if(this.checked){
			if(!bposInit)bposInit=true,$("body").append(`<div class=compass><div class=arrow></div><div class=compass-circle></div><div class=my-point></div></div>`);
			bELpos = StartPosInfo();
		}
		else{stopPosInfo(bELpos);}
	});
	init();
	$("#ux8").change(function(){
		window["x8md"] = "yolov8" + (this.checked ? "x": "n") + "-seg";
	});
	oEAi.change(async function(){
		bEaV8 = this.checked;
		if(bEaV8 && window.v8Load && typeof window["detectImgV8"] == "function")window["detectImgV8"]()//,imgOldCbk.push(fnFaceDtc);
		// else rmFnImg(fnFaceDtc);
		ldai();
		showWnSt()
	});
	$("#eOcr").change(async function(){
		bEabOcr = this.checked;
		ldai(true);
	});
	szLstChannel = getRoomName();
	oNick.val(szCltFg);
	oNick.change(function () {
		if (bIoIsOk) setNickInfo($(this).val());
	});
	
	oCnId.change(function () {
		if(doKstart)JoinRoom();// 这里非常神奇和变态，若干没有点按钮开始聊，就先执行，则导致join失败
	});
	// initQrcode();
	osdMsg.keydown(function (e) {
		if (e.keyCode == 13) SendMsg(osdMsg.val()),osdMsg.val("")
	})
	/* 发送文件
	const blob = new Blob(["This is a 10MB file."], {type: "text/plain"});
	const chunks = [];// 2MB
	for (let i = 0; i < blob.size; i += 2097152) {
	chunks.push(blob.slice(i, i + 2097152));
	}
	const newBlob = await Blob.from(chunks); // 是的，每个 blob.slice(i, i + 2097152) 都可以独立构建一个 Blob
	*/
	var fnDoBlog =function(blob,szName){
		var reader = new FileReader();
		reader.onload = function (event) {
			var s = this.result;
			SendFile(s,0 == s.indexOf("data:image") ? 1:2,szName)
		}; 
		reader.readAsDataURL(blob);
	};
	/* 处理图片、文件, item.getAsFile(): 返回一个 File 对象
	name: 文件名
	type: 文件类型
	size: 文件大小
	slice(): 返回一个 Blob 对象，该对象包含文件的一部分
	getAsDataURL(): 返回一个 DataURL，该 DataURL 包含文件的内容
	readAsArrayBuffer(): 将文件读取到一个 ArrayBuffer 对象中
	readAsBinaryString(): 将文件读取到一个 BinaryString 对象中
	readAsText(): 将文件读取到一个 Text 对象中
	*/
	osdMsg.bind("paste",async function(e){
		// var pastedData = e.originalEvent.clipboardData.getData('text');
		// log(pastedData)
		var oClp = e.clipboardData || e.originalEvent.clipboardData;
		var items = oClp.items;
		// var sx1=oClp.getData('text/html');
		// if(sx1)return fnDoBlog(await html2img(sx1),"paste");

		for (var index in items) {
			var item = items[index];
			if(!item){continue}
			
			if (item.kind === 'file' || item.type && item.type.indexOf("image") === 0) {
				fnDoBlog(item.getAsFile(),"paste");
			}
		}
	});
	oAutoRm = $("#atRd");
	oAutoRm.change(async function () {
		bAutoRm = this.checked;
	});
	oMsgBox = $("#msgList");
	bAutoRm = oAutoRm.prop(ckd);
	oclsId.click(async function(){
		oMsgBox.html("")
		fnTmArr = [];
	});
	$("form").submit(function(e){
		return false
	});
	fn009();
	storageInfo();
	// window.addEventListener('resize', fn009);
	// 微信浏览器 https://www.lixf.cc/2021/03/26/webrtc-in-ios-weixin-browser/
	document.addEventListener("WeixinJSBridgeReady", async function () {  
		$("video").each(async function(){
			this.play();
		});
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
	$(".rtool i").click(function(e){
		var o = $(this).find("input[type=checkbox]");
		if(o.length)
		{
			o[0].checked = !o[0].checked;
			o.change();
		}
	});
	$("#its").click(function(){
		var o10 = $("body > div.rtool");
		if(o10.attr("show"))o10.hide(),o10.removeAttr("show");
		else o10.show(),o10.attr("show",true);
		o10.css({"left":"calc(100vw -"+o10.width()+"px)"});
		return false;
	});
	if (szHs) {
		oCnId.val(szHs.substring(1));
		StartVideo()
	}
	$("#roomurl").bind("mouseover", MkQrcd);
	var t2 = $("#intro"),fnShT1 = function(x){x?t2.show():t2.hide();};
	fnShT1($("#sInvite").change(function(){
		MkQrcd();
		fnShT1(this.checked);
	}).prop(ckd));
	$("div.rtool input[type=checkbox]").addClass("btn btn-secondary");
	if(bIsMobile)
	{
		$("#evdUser").prop(ckd,true);
		window.addEventListener("orientationchange", function(event) {
			var n = event.orientation ||(screen.orientation && screen.orientation.angle);
			if(-90 == n || 90 == n){
				v8cTop = 42 * 3;
			}else{
				v8cTop = 42;
			}
		});
	}else {
		// Function.prototype.toString = function(){return undefined};
	}
	initBox();
	if(g_bEableP2pFs){
		// for(const x of '/js/10.js;/js/12.js;/js/8.js'.split(";")){
		// 	seedFiles(x);
		// }
	}
	$('*[title]').tipso({
		size: 'tiny',
		background: 'tomato',
		tooltipHover: true,
		useTitle: true
	});	  
	// $("script").remove();
	try{
		db=new Dexie("_p2pchat_");
		if(!!db)db.version(1).stores({
			friends: "++id,date,video,name"
		});
		cntVideo(rmHisVideo);
	}catch(e){}
	var e = document.querySelectorAll('[id],[class]');
	for (var i = 0; i < e.length; i++) {
		e[i].style.transition = 'box-shadow 0.5s ease-in-out';
	}
	$("#sI55").click(dlAllVideo);
	$("#sI56").click(rmAllVd);
	RegAsync(initLang,1000)
});
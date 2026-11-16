// window["x8md"]="yolov11n";
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
	szVideoId = "webcam",
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
	g_Constraints = {"video":true,"audio":true},n001 = 5,nPos07 = 1,n002 = 640,n003 = 480,//n002 = 1920,n003 = 1080, // 
	aNoCtxCbk = [],
	clientHeight = 0,
	bStopRsize = false,
	g_ostt = {"connected":1};// "connecting":1,

function dg(s){return document.getElementById(s)}
function dc(s){return document.createElement(s)}
function getRoomName(){// return $("#cnId").val();
	return "Pwn"+String($("#cnId").val()).hashCode()
}

// 布局改为事件驱动：只在窗口/视口/视频数量变化时重排，避免每秒强制回流
var bLayQueued = false;
// 根据视频数量设置自适应网格：1 铺满、2/3 一行平分、4 2x2、5-6 3x2、7-9 3x3...
function layoutGrid(){
	if(!oMyCtn || !oMyCtn.length)return;
	// 数所有 vcell（不用 jQuery :visible 以避免时机问题）
	var cells = oMyCtn[0].querySelectorAll(".vcell");
	var n = cells.length;
	if(n < 1)return;
	var cols = 1, rows = 1;
	if(n === 1){ cols = 1; rows = 1; }
	else if(n === 2){ cols = 2; rows = 1; }
	else if(n === 3){ cols = 3; rows = 1; }
	else if(n === 4){ cols = 2; rows = 2; }
	else if(n === 5 || n === 6){ cols = 3; rows = 2; }
	else if(n <= 9){ cols = 3; rows = 3; }
	else if(n <= 12){ cols = 4; rows = 3; }
	else { cols = 4; rows = Math.ceil(n/4); }
	oMyCtn[0].style.gridTemplateColumns = "repeat(" + cols + ", 1fr)";
	oMyCtn[0].style.gridTemplateRows = "repeat(" + rows + ", 1fr)";
}
function layoutNow(){
	bLayQueued = false;
	setMF();
	setWhOne();
	layoutGrid();
	if(bEaV8 && typeof getImgFromStream == "function")getImgFromStream();
	if(oCAllVideo && oMyCtn && oMyCtn.length){
		var w = oMyCtn.width(),h = oMyCtn.height();
		if(oCAllVideo.width != w)oCAllVideo.width = w;
		if(oCAllVideo.height != h)oCAllVideo.height = h;
	}
}
function fn009(){
	if(bLayQueued)return;
	bLayQueued = true;
	requestAnimationFrame(layoutNow);
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

function RunRtsp(s){
	if(socket){
		socket.emit('RunRtsp',s);
	}
}
// 压缩、下载所有视频文件
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
}
// 更新状态
function cntVideo(cbk){// https://dexie.org/docs/Collection/Collection.count()
	let aCo = dg("svHs"),bS = 0;
	if(!!db)db.friends.count().then(function (count) {
		try{
			vdCnt1 = count;
			var s1 = "";
			if(0 < count){
				s1 = "("+count+")";
				if(typeof cbk == "function")cbk(count);
			}
			aCo.innerText = s1;
			bS=1;
		}catch(e){alert(e)}
	});
	let nTtSize = 0;
	let fetchPromises = [];
	// 从 url 计算出的视频的所有字节数，url 转blob 后计算字节数
	let aAs = $("#ocrRst div.x4 a");
	if(!bS)aCo.innerText = !aAs.length?"":"("+aAs.length+")";
	aAs.each(function(){
		var n = this.getAttribute("size")||0,s1 = this.href;
		nTtSize += parseInt(n);
		if(!n){
			let fetchPromise = fetch(s1).then(response => response.blob()).then(blob => {
					nTtSize += parseInt(blob.size);
				}).catch(()=>{});
			fetchPromises.push(fetchPromise);
		}
	});
	Promise.all(fetchPromises).then(() => {
		let o1 = dg('sI55')
		if(0 == nTtSize)o1.innerText = "⤓ All Video  ";
		else o1.innerText = "⤓ All Video ("+prettyBytes(nTtSize)+")  ";
	});
}

// 加载人脸特征
function faceDbAll(){try{return JSON.parse(localStorage.getItem("e2e_face_db")||"[]")}catch(e){return []}}
function faceDbSave(a){localStorage.setItem("e2e_face_db",JSON.stringify(a)),LoadFaceDb(a)}
function faceDbLoad(){var a=faceDbAll();if(a.length)LoadFaceDb(a);return a.length}
function faceDbAdd(szName,oDes){var a=faceDbAll(),o=a.filter(function(i){return i.label===szName})[0];o?o.descriptors.push(oDes):a.push({label:szName,descriptors:[oDes]});faceDbSave(a);return a.length}
function faceSetStatus(sz){var o=document.getElementById("faceStatus");if(o)o.textContent=sz?("识别："+sz):""}
window.faceDbLoad=faceDbLoad;window.faceSetStatus=faceSetStatus;
window.faceClear=function(){if(!confirm("确定清空本地人脸库？"))return;localStorage.removeItem("e2e_face_db");faceMatcher=void 0;faceSetStatus("");alert("已清空")};
window.faceRegister=async function(){
	if(typeof faceapi=="undefined")return alert("请先勾选 Detect Face，等待模型加载完成");
	if(!window.webcam||!window.webcam.videoWidth)return alert("请先开启视频");
	var szName=prompt("请输入要登记的姓名");
	if(!szName)return;
	try{
		await ensureFaceNets(["faceLandmark68TinyNet","faceRecognitionNet"]);
		var res=await faceapi.detectSingleFace(window.webcam,new faceapi.TinyFaceDetectorOptions({inputSize:320,scoreThreshold:.5})).withFaceLandmarks(true).withFaceDescriptor();
		if(!res)return alert("未检测到人脸，请正对摄像头后重试");
		var n=faceDbAdd(szName,Array.from(res.descriptor));
		alert("登记成功："+szName+"（人脸库共 "+n+" 人）");
		if(window.startFaceMonitor)window.startFaceMonitor();
	}catch(e){alert("登记失败："+((e&&e.message)||e))}
};
function LoadFaceDb(a){
	var a1 = [];
	for(var i = 0; i < a.length; i++){
		var o1 = a[i];
		a1.push(new faceapi.LabeledFaceDescriptors(o1.label, o1.descriptors.map(i=>new Float32Array(i))));
	}
	faceMatcher=new faceapi.FaceMatcher(a1, 0.6);
}
var bInitFace = !!0, bFaceReady = false, aFaceCb = [];
function flushFaceCb(){
	var a = aFaceCb; aFaceCb = [];
	for(var i = 0; i < a.length; i++){ try{ a[i](); }catch(e){ log(e); } }
}
// 按需加载人脸模型，已加载的不会重复下载
async function ensureFaceNets(aNames){
	var mdP = '/model/face/';
	await faceapi.tf.ready();
	await Promise.all(aNames.map(function(s){
		var net = faceapi.nets[s];
		return (net && !net.isLoaded) ? net.loadFromUri(mdP) : null;
	}));
}
// 人脸识别；初始化 加载模型
function initFace(cbk){
	if(cbk)aFaceCb.push(cbk);
	if(bFaceReady){ flushFaceCb(); return; }
	RegAsync(async function(){
		if(bInitFace)return;
		let c1 =async function(){
			bInitFace = true;
			bFaceReady = true;
			flushFaceCb();
			// console.log(faceapi.tf.getBackend());
			// 使用 WebGL 后端时，模型会在浏览器中利用 GPU 进行计算；如果用户的设备支持 WebGL，这通常是性能最佳的选项之一
			// await faceapi.tf.setBackend("“wasm”");//  “wasm” 或 “cpu” 
			await faceapi.tf.enableProdMode();
			await faceapi.tf.ENV.set("DEBUG", false);
			await faceapi.tf.ready();
			const mdP = '/model/face/';

			// 实时监控只需要“检测 + 关键点 + 识别”，SSD/年龄性别/表情等模型
			// 留到导入人脸时再按需加载，避免首次开启人脸功能就下载约 15MB
			var aNet = [faceapi.nets.tinyFaceDetector, faceapi.nets.faceLandmark68TinyNet];
			if (faceMatcher) aNet.push(faceapi.nets.faceRecognitionNet);
			Promise.all(aNet.map(function(net){
				return net.isLoaded ? null : net.loadFromUri(mdP);
			})).then(c1).catch(function(e){ log(e); bInitFace = false; });
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
	let a = [];
	e.forEach(function(i){
		if(i && i.toString) a.push(i.toString());
		else a.push(JSON.stringify(i));
	});
	oLogs.innerHTML=a.join("\n")+"\n"+oLogs.innerHTML;
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
	if(oAutoRm!=null && oAutoRm.prop(ckd)){
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
	var s = o.text();
	var done = function(){setTips('','Copied|已拷贝',x);};
	if(navigator.clipboard && navigator.clipboard.writeText){
		navigator.clipboard.writeText(s).then(done, function(){legacyCopy(s,done);});
	}else legacyCopy(s,done);
}
function legacyCopy(s,cbk){
	var t = dc("textarea");
	t.value = s;
	t.setAttribute("readonly","");
	t.style.cssText = "position:fixed;top:-1000px;left:-1000px;opacity:0";
	document.body.appendChild(t);
	t.select();
	try{document.execCommand("copy")}catch(e){}
	document.body.removeChild(t);
	if(cbk)cbk();
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
	o1.html(`[<t title='${x01}' class=t2>${n}</t>] <d></d>${szCp}<x></x><time class="msg-time" title="${x01}">${x01.substring(11,16)}</time><a href=#${szId} name=${szId}/>`)
	o1.find("t.t2").text(n)
	o1.attr("tm",new Date().getTime());
	var szTag = "d";
	if(0 == t){ // 普通消息
		switch(s){
			case "->jg":plWarn(true);o1.remove();return;
			case "->kb":playSd(4);o1.remove();return;
			case "->ai":oEAi.checked=true;oEAi.onchange();return;
		}
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
		log(e);
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
		if(0 == onL && -1 == s.indexOf("->"))CreateMsgDiv(szSelfK, oldS + oks,t);
	}
	
}

// 日志的输出
function fnMyLogs (e) {
	if (!e) return;
	oLogs.innerText=JSON.stringify(e||"")+"\n"+oLogs.innerText;
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
	var szId = id||fnGetId(),i2 = "Pmt"+szId, szCss = bLocal ? '<canvas class="output_canvas"></canvas>' : '';
	// 所有视频（含本地）进 #myCtn 网格，自适应均分铺满
	$("#myCtn").append(
		"<div class='vcell' id='" + i2 + "'>" +
		szCss +
		"<video id='" + szId + "' class='video' " +
		" playsinline muted webkit-playsinline x-webkit-airplay=allow x5-video-player-type=h5 x5-video-orientation=landscape></video>" +
		"</div>"
	);
	if (!bLocal) new Plyr('#' + szId, { controls: [ 'play-large', 'mute', 'volume', 'pip', 'airplay'] });
	ovdio = $("#" + szId);
	RegAsync(fn009,50);
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
var nOldJ=0;

// 视频区域由 CSS Grid 自适应；这里只同步 AI 画布尺寸与状态
function setWhOne(){
	var vds = $("video"),n = vds.length;
	bStopRsize = n > 1;
	if(typeof window.webcam == "undefined")window.webcam = dg('webcam');
	var t4 = window.ov8canvas;
	if(t4 && oMyCtn && oMyCtn.length){
		var r = oMyCtn[0].getBoundingClientRect();
		t4.style.top = r.top + "px";
		t4.style.left = r.left + "px";
		t4.style.width = r.width + "px";
		t4.style.height = r.height + "px";
		t4.style.display = bEaV8?"block":"none";
	}
}

function StartVideo () {
	var bCbkDo = false;
	// 失败回调需能重试 — 存成命名函数，供 Retry 按钮和用户后续点击共用
	function onVidError(err) {
		// 摄像头/麦克风不可用 — 在视频区给出明确可见的错误条，而不是静默失败
		b_clickJoin = true; // 即使拿不到摄像头也要能加入频道收发文字
		try { JoinRoom(); } catch(e){}
		var reason = err && err.name ? err.name + ": " + (err.message||"") : "camera unavailable";
		oMyCtn.html(
			"<div class='vcell vcell-error' style='width:100%;height:100%;display:flex;align-items:center;justify-content:center;flex-direction:column;background:#0b1220;color:#e6edf7;text-align:center;gap:12px;padding:24px;'>" +
				"<div style='font-size:48px'>📷</div>" +
				"<div style='font-size:16px;font-weight:600'>Camera / Microphone unavailable</div>" +
				"<div style='font-size:13px;color:#9aa8bd'>" + reason + "</div>" +
				"<div style='font-size:12px;color:#667085'>Click lock icon in address bar → Allow → Reload page</div>" +
				"<button type='button' class='vcell-retry' style='margin-top:4px;padding:8px 20px;background:#2563eb;color:#fff;border:0;border-radius:8px;cursor:pointer;font-size:14px'>Retry</button>" +
			"</div>"
		);
		oMyCtn.find(".vcell-retry").on("click", function(){
			if(!document.body.classList.contains("vchat")){
				document.body.classList.add("vchat");
				oMyCtn.css("display","grid");
			}
			StartVideo(); // 完整重试：会 StopStream → setupLm → initVideoChat
		});
		fn009();
	}
	setupLm(function () {
		if(bCbkDo)return;
		if (lMs) {
			var bO = b_clickJoin;
			b_clickJoin = bCbkDo = true;
			JoinRoom();
			initVideoChat();
			b_clickJoin = bO;
		}
	}, onVidError);
}

function AddStream2Canvas(e,s){
	try{
		let sid = e.id,o = $("#Pmt"+sid),o1 = $(e);
		let bStop = false;
		e._drawFrameStop = function(){ bStop = true; };
		let drawFrame=function(){
			if(bStop)return;
			let o2 = $("#Pmt"+sid);
			if(isEnded(s)||0 == o2.length||o2[0] != o[0]){ bStop = true; return; }
			let p=o.position(),x = p.left,y = p.top,w = o1.width(),h= o1.height();
			const canvasCtx = oCAllVideo.getContext('2d');
			if(lstRct[sid]&&lstRct[sid].length)canvasCtx.clearRect.apply(canvasCtx,lstRct[sid]);
			canvasCtx.drawImage(e, x,y, w,h);
			lstRct[sid]=[x,y, w,h];
			// 供 v8 检测使用：视频画面在离屏画布里的真实矩形（去掉两侧黑边），
			// 否则模型会拿黑边当画面，框会画到黑边上、且尺寸失真。
			window.__v8Rect=[x,y, w,h], window.__v8Base=[oCAllVideo.width,oCAllVideo.height];
			requestAnimationFrame(drawFrame);
		};
		e.onplay = drawFrame;
		// 检测输入直接用原始视频帧（不经离屏画布的拉伸），框的落点按视频真实显示矩形换算
		window.__v8Video = e;
	}catch(e){log("AddStream2Canvas",e)}
}
function attachMediaStream(e, s) {
	// fnMyLogs2('DEPRECATED, attachMediaStream will soon be removed.');
	// Uncaught (in promise) DOMException
	// https://github.com/sampotts/plyr/issues/331
	// https://github.com/addyosmani/getUserMedia.js/issues/64#issuecomment-270668091
	// try{
	
	// 只有开启 AI 时才需要把视频帧画到离屏画布上，避免无谓的每帧重绘
	if(bEaV8)RegAsyncNoCtx(AddStream2Canvas,e,s);
	if(!e.src && e.src !=s){
		if (e.srcObject !== undefined) {
			e.srcObject = s;
		}else if (e.mozSrcObject !== undefined) { // FF18a
			e.mozSrcObject = s;
		} else{ // FF16a, 17a
			e.src = s;
		}
	}
	try{if(!s.kind)s.kind="video"}catch(e){log("video",e)}
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
		// 未授权时 label 为空、deviceId 也可能为空，仍需列出条目（对应系统默认设备）
		if (!df1 || !df1.kind) {continue; }
		const opt5 = dc('option');
		opt5.value = df1.deviceId || "";
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

// 主动刷新设备列表：页面加载、打开工具栏、插拔设备时调用
function refreshDevices(){
	try{
		if(!(navigator.mediaDevices && navigator.mediaDevices.enumerateDevices))return;
		if(!selectors || !selectors.length || !selectors[0])return;
		navigator.mediaDevices.enumerateDevices().then(gotDevices).catch(function(e){log("refreshDevices",e)});
	}catch(e){log("refreshDevices",e)}
}

function isEnded(e){
	try{
		if (!e)return true;
		var vt = e.getVideoTracks();
		if(0 == vt.length||vt[0].readyState === 'ended')return true;
	}catch(e){log("isEnded",e)}
	return false;
}

/* 
1、将本地的视频流添加到所有的peer连接中
2、相同的摄像头切换视频源、前后置调整 进行移除、替换操作
3、允许将多个视频流（包含音频） 添加到每一个 webrtc peer 连接中
*/
function initOnePeer(pp, peer_id,lcSs) {
	let os = lcSs||window.stream;
	if (!os) {// 视频流还没有准备好
		RegAsyncNoCtx(initOnePeer,pp,peer_id,lcSs);
		return;
	}
	if(peer_id&&!pp)pp=peers[peer_id];
	if(!os.id)os.id="Id"+new Date().getTime();
	let trackCbk = function(cbk){
		let bRs=false;
		os.getTracks().forEach(function(t) {
			try{
				if(t.kind == "video"||t.kind == "audio")bRs=true,cbk(t)
			}catch(f){log(f)}
		});
		return bRs
	}
	
	let calOne = function(p1){
		// https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/removeTrack
		// try{
		// 	let os01 = p1.oldStream && p1.oldStream[os.id]||0;
		// 	if(os01){
		// 		// p1.oldStream.getTracks().forEach(function(t) {
		// 		// 	try{if(t.readyState === 'ended')t.stop(),log("p1.oldStream.getTracks().forEach stop "+t.label)}catch(f){log(f)}
		// 		// });
		// 		p1.removeStream(os01);
		// 		delete p1.oldStream[os.id];
		// 	}
		// }catch(e){alert(e)}
		// try{
		// 	let ot0 = p1.oldSender && p1.oldSender[os.id]||0;
		// 	if(ot0 && ot0.length){
		// 		// if(p1.oldSender.track&& p1.oldSender.track.readyState === 'ended')p1.oldSender.track.stop(),log("p1.oldSender.track.readyState stop "+p1.oldSender.track.label);
		// 		ot0.forEach(function(t) {
		// 			p1.removeTrack(t);	
		// 			trackCbk(t.replaceTrack);
		// 		});
		// 		delete p1.oldSender[os.id];
		// 	}
		// }catch(e){log(e)}
		log("typeof p1.addTrack",typeof p1.addTrack)
		if(typeof p1.addTrack == "function"){
			try{
				p1.oldSender = p1.oldSender||{};
				let a12 = [];
				if(trackCbk(function(t){
					if(!peer_id)log("p1.addTrack -> ",t.label,t.kind);
					a12.push(p1.addTrack(t, os))
				}))p1.oldSender[os.id] = a12;
			}catch(e){log("p1.addTrack",e)}
		}else if(typeof p1.addStream == "function"){
			p1.addStream(os);
		}
		p1.oldStream=p1.oldStream||{};
		p1.oldStream[os.id] = os;
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
	socket.on('RunRtspR',function(k1){
		CreateUrlVd("/vt/"+k1+"/"+k1+".m3u8",0,k1)
	});
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
		let s4 =$("#iRtsp").val(); 
		if(s4)RunRtsp(s4);
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
		if (peer_id in peers)return log("skip "+peer_id);// 避免重复添加
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
		let getIceCfg = function(){
			let n = 5;if(navigator.userAgent.indexOf("Firefox") > -1)n = 2;
			let oTp12 = { "iceServers": ICE_SERVERS.slice(nCIce,nCIce + n),iceTransportPolicy: 'all'};
			nCIce += n;
			if(nCIce >= ICE_SERVERS.length)nCIce = 0;
			return oTp12;
		};
		let pC1 = new RTCPeerConnection(getIceCfg());
		peers[peer_id] = pC1;
		let reConn = async function(){
			try{
				log("start reConn "+config.userdata.nick);
				pC1.setConfiguration(getIceCfg());
				pC1.restartIce()
			}catch(e){log('pC1.restartIce ',e)}
		};
		// https://blog.mozilla.org/webrtc/the-evolution-of-webrtc/
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
			// log("P2P ICE state: "+is1 + "\niceGatheringState: "+is3+"\nconnectionState: " + is2+"\nsignalingState: "+is4+"\n");
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
		
		function getStream(e){
			let stream = new MediaStream(),bAdd = false,isM=(m)=>{return m&&(m.kind === 'video'||m.kind === 'audio')};
			if(e.track && isM(e.track))stream.addTrack(e.track);
			if(e.streams && e.streams.length){
				e.streams.forEach(function(s){
					if("function" == typeof s.getTracks)s.getTracks().forEach(function(t){
						if(isM(t)) {
							stream.addTrack(t);
							bAdd = true;
						}
					});
				});
			}
			if(!bAdd && e.stream){
				if("function" == typeof e.stream.getTracks)e.stream.getTracks().forEach(function(t){
					if(isM(t)) {
						stream.addTrack(t);
						bAdd = true;
					}
				});
				if(!bAdd)stream = e.stream;
			}
			return stream
		}
		var iceOkCbk;
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
			if (!ec||!ec.candidate) { if(iceOkCbk && pC1.ice && pC1.ice.length)iceOkCbk(),iceOkCbk=0;return}
			if(s1 == "failed"||s1 == "disconnected"){// NAT 穿透失败; 连接建立失败，可能与 NAT 穿透失败有关
				log("onicecandidate reConn "+ s1)
				reConn();
				return;
			}
			getYourInfo(ec.candidate);
			pC1.ice=pC1.ice||[];
			var ice = {
				'sdpMLineIndex': event.candidate.sdpMLineIndex,
				'candidate': event.candidate.candidate
			};
			pC1.ice.push(ice);
			socket.emit('relayICECandidate', {
				'peer_id': peer_id,
				'ice_candidate': ice
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
		let bBindAdd = false;
		// 测试发现这样无法正确添加流
		// bBindAdd=true,pC1.ontrack = function(e){
		// 	try{
		// 		let stream = getStream(e),track = e.track||{};
		// 		var rmv = fnAddOneStream(stream,track.id,track.label);
		// 		if(rmv)e.track.onended = e => rmv.srcObject = rmv.srcObject; // Chrome/Firefox bug
		// 	}catch(e1){log("pC1.ontrack",e1)}
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
			var rmv = fnCreateVid(0);
			rmv.autoplay = true;
			rmv.controls = false;
			rmv.title = config.userdata.nick+" -- "+label;
			oCurmdm=peer_media_elements[peer_id] = $("#Pmt" + rmv.id);
			if(isSvLc()||dg("saveMeVD").checked||oESvl.checked){
				fnStartRct(stream,1,config.userdata.nick,rmv);
			}
			attachMediaStream(rmv, stream);
			return rmv
		};
		let fnAddStream = async function(e){
			var oCurmdm,rmv;
			var stream = getStream(e),track=e.track||{};
			if(!g_bTxtChat && stream && !peer_media_elements[peer_id]){try {
				rmv = fnAddOneStream(stream,track.id,track.label);
				// 常见的解决方法，用于解决Chrome和Firefox中的一个已知问题。这个问题是，当媒体轨道结束时，视频元素（在这里是video）可能不会立即更新，导致视频仍然显示最后一帧图像，而不是显示黑屏或者其他表示视频结束的视觉提示。 
				if(rmv && e.stream)e.stream.onaddtrack = e => {// Chrome/Firefox hack 强制视频元素更新，从而立即反映媒体轨道的结束
					e.track.onended =  (e)=>{
						rmv.srcObject = rmv.srcObject
					};
				}
			} catch(e1) {
				log("fnAddStream",e1)
				if(oCurmdm)oCurmdm.remove();
				delete peer_media_elements[peer_id];
			 }}
		};
		if(!bBindAdd)pC1.onaddstream = fnAddStream;
		// p2p 流事件
		if (!g_bTxtChat) {
			initOnePeer(pC1, peer_id)
		}
		let cof = async function(){//,iceRestart: true // 导致内网无法p2p
			pC1.createOffer({offerToReceiveAudio:true,offerToReceiveVideo:true}).then(async function(lds){
				// log("Local offer description is: ", local_description);
				pC1.setLocalDescription(lds).then(async function(){
					// log(peer_id + " setLocalDescription ok");
					iceOkCbk = async function(){
						if(socket)socket.emit('relaySessionDescription', { 'peer_id': peer_id, 'session_description': lds,"ice": pC1.ice});
					};
				},async function(){fnMyLogs("Offer setLocalDescription failed!",lds)});
			},log);
		};
		if (config.should_create_offer) {
			// cof();
			pC1.onnegotiationneeded = cof;
		}
		
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
	
	// addPeerCbk({peer_id:"xxxxx",userdata:{nick:"kt"},should_create_offer:true});
	socket.on('sessionDescription', function (config) {
		var peer_id = config.peer_id;
		var peer = peers[peer_id];
		var rmtDs = config.session_description;
		var ice = config.ice||0;
		
		// LogMsg(`用户 ${config.userdata.nick} E2E/P2P 安全连接ok`);
		try{
			// log("sessionDescription == ",config)
			xM = config["session_description"]["sdp"].match(/a=max-message-size:\s*(\d+)/);
			if (xM && xM.length >= 2) {
				var n08 = parseInt(xM[1]) - 800;
				gaM[peer_id]["maxSendSize"] = n08;
				// LogMsg(`set ${peer_id} maxSendSize = ${n08}`)
			}
		}catch(e){log(e)}
		// log('1 Remote Session-description received from ', config);
		/*允许设置多个 setRemoteDescription。您可以在连接的生命周期内多次调用 setRemoteDescription 方法，以接收来自不同远程对等方的会话描述。
		每次调用 setRemoteDescription 时，它会更新连接的远程描述，从而允许您在同一个连接上与多个不同的远程对等方进行通信 */
		// 应该在收到offer后（此时状态应该是"have-remote-offer"），再设置远程的answer
		var desc = new RTCSessionDescription(rmtDs);
		peer.setRemoteDescription(desc,async function(){
			// log(peer_id + " setRemoteDescription ok");
			if (rmtDs.type == "offer") {
				peer.createAnswer(async function (lcDs) {
						peer.setLocalDescription(lcDs,async function () {
								if(ice){
									for(var i = 0; i < ice.length; i++){
										try{peer.addIceCandidate(new RTCIceCandidate(ice[i]));}catch(e){log(e)}
									}
								}
								socket.emit('relaySessionDescription', { 'peer_id': peer_id, 'session_description': lcDs,"ice": peer.ice});
								gaM[peer_id]["pcok"] = true;
								fnTxtChatOne(null,peer_id);// 最大坑，必须在RTCPeerConnection之后，否则调用失败
								// log("setRemoteDescription -> createAnswer -> setLocalDescription - > relaySessionDescription")
							},async function () { log(peer_id,"Answer setLocalDescription failed!",lcDs); }
						);
					},async function (error) {
						fnMyLogs2("Error creating answer: ", error, peer);
					});
			}
		},async function (e) {
			if(e)log(peer_id,"setRemoteDescription error: ", e.message,rmtDs);
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
	// 根据当前实际模式决定要带哪个模式标记，比看按钮 display 更确定
	if (document.body.classList.contains("vchat")) aP.push("startChat=1");
	else aP.push("stChat=1");

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
		// 停止人脸识别循环，释放摄像头与 GPU/CPU 资源
		if(window.stopFaceMonitor)window.stopFaceMonitor();
		// 先杀掉所有 drawFrame / render 循环，避免继续占 CPU
		$("video").each(function(){ try{ if(this._drawFrameStop)this._drawFrameStop(); }catch(e){} });
		// 销毁所有 Plyr 实例（否则事件监听和内部状态累积）
		try{
			if(window.Plyr && typeof window.Plyr.destroyAll == "function")window.Plyr.destroyAll();
		}catch(e){}
		// 逐个检查 data-plyr-id 并尝试 destroy（兼容旧 Plyr 版本）
		$("video").each(function(){ try{ var id = $(this).attr("data-plyr-id"); if(id && window[id]){ try{ window[id].destroy && window[id].destroy(); }catch(e){} } }catch(e){} });
		// 停掉所有本地/远端 track
		var all = $("video").map(function(){return this.srcObject}).get();
		if(lMs)all.push(lMs);
		all.forEach(function(stream){
			try{ if(stream && stream.getTracks)stream.getTracks().forEach(function(t){ try{t.stop()}catch(e){} }); }catch(e){}
		});
		// 清空 canvas 位置缓存
		lstRct = {};
		// 清空视频容器里的所有条目（远端 + 本地）
		try{ $("#myCtn").html(""); }catch(e){}
		// 停掉当前本地
		if (lMs && typeof lMs.getTracks == "function") lMs.getTracks().forEach(function (track) {
			try{ if (track && track.readyState == 'live') track.stop(); }catch(e){}
		});
		if(lM){ try{ $(lM).remove(); }catch(e){} lM = null; }
		window.webcam = null;
		window.stream = null;
		lMs = null;
		g_bSetup = false;
	}catch(e){log("StopStream",e)}
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
	link.setAttribute("size",blob.size);
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
					// storageInfo(function(){});// 这里可以做一个柄图，显示剩余空间
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
	// g_bSetup 已经是 true 时，允许重试（上次失败或 StopStream 之后）
	if (g_bSetup && !errorback) return;
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
			
			// 本地预览不需要 Plyr 控件，直接显示 video（画布作为 AI 叠加层保留）
			lM = fnCreateVid(true,szVideoId);
			window.webcam = lM;
			const initFaceCbk = function(){// https://justadudewhohacks.github.io/face-api.js/docs/index.html
				// scoreThreshold 筛选检测到的人脸的置信度阈值
				// iouThreshold：用于非最大抑制（NMS）的IoU（交并比）阈值。默认值为0.3
				// inputScale：输入图像的缩放比例。默认值为128。
				// minFaceSize：最小人脸尺寸。默认值为20
				// https://vladmandic.github.io/face-api/TUTORIAL.html
				// 5fps 足够用于人脸识别/报警，inputSize 320 降低计算量
				const faceOpt = new faceapi.TinyFaceDetectorOptions({scoreThreshold:0.5,minConfidence:0.5,maxResults:100,inputSize:320});
				var nFaceTimer = 0, bFaceBusy = false, szLastFace = "";
				window.stopFaceMonitor = function(){
					if(nFaceTimer){ clearInterval(nFaceTimer); nFaceTimer = 0; }
				};
				var fnFaceTick = async function(){
					if(bFaceBusy || !nFaceTimer || document.hidden)return;
					if(!window.webcam || !window.webcam.videoWidth)return;
					bFaceBusy = true;
					try{
						if(faceMatcher && !faceapi.nets.faceRecognitionNet.isLoaded)await faceapi.nets.faceRecognitionNet.loadFromUri('/model/face/');
						const detections = await (faceMatcher?faceapi.detectAllFaces(window.webcam, faceOpt).withFaceLandmarks(true).withFaceDescriptors():faceapi.detectAllFaces(window.webcam, faceOpt).withFaceLandmarks(true));
						var aHit = [], nUnknown = 0;
						(detections || []).forEach(function(fd){
							if(!faceMatcher){aHit.push("人脸(未登记)");nUnknown++;return;}const bestMatch = faceMatcher.findBestMatch(fd.descriptor);
							if(bestMatch && bestMatch.label && bestMatch.label !== "unknown")aHit.push(bestMatch.label);else{aHit.push("陌生人");nUnknown++;}
						});
						// 只在结果变化时输出，避免逐帧刷日志
						var szNow = aHit.join(",");
						// 只记录/展示识别结果，不占用报警通道（报警只应由“识别对象”触发）
						if(szNow !== szLastFace){
							console.log("识别结果："+(szNow||"无"));window.faceSetStatus&&window.faceSetStatus(szNow);
						}
						szLastFace = szNow;
					}catch(e){
						// 模型加载失败时停止循环，避免重复报错
						console.warn("face:",(e&&e.message)||e);
					}finally{
						bFaceBusy = false;
					}
				};
				window.startFaceMonitor = function(){
					if(nFaceTimer)return;console.log("人脸监控已启动");
					nFaceTimer = setInterval(fnFaceTick, 200);
				};
				if(!lM._bFacePlay){
					lM._bFacePlay = true;
					lM.addEventListener('play', function(){
						if($("#eFace")[0] && $("#eFace")[0].checked)window.startFaceMonitor();
					});
				}
			};
			if($("#eFace")[0].checked)initFace(function(){ window.faceDbLoad&&window.faceDbLoad(),initFaceCbk(),window.startFaceMonitor(); });
			$("#eFace").off("change.face").on("change.face", function(){
				if(this.checked)initFace(function(){ window.faceDbLoad&&window.faceDbLoad(),initFaceCbk(),window.startFaceMonitor(); });
				else if(window.stopFaceMonitor)window.stopFaceMonitor();
			});
			if(!document.getElementById("faceTools")){
				var oFaceBox = $("#eFace").closest("i");
				oFaceBox.after("<i id='faceTools'><span id='faceStatus' style='color:#0a0;margin:0 6px'></span><button type='button' id='faceReg'>登记人脸</button><button type='button' id='faceClr'>清空</button></i>");
				$("#faceReg").click(function(){ window.faceRegister && window.faceRegister(); });
				$("#faceClr").click(function(){ window.faceClear && window.faceClear(); });
			}
			
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
				g_bSetup = false; // 让重试时能重新进入 setupLm
				if (errorback) errorback(e);
			});
		}
	} catch (e) { fnMyLogs(e) }
	// if(callback) callback()
}
function flipVideoStream(video, n) {
    let canvas = document.createElement('canvas');
    let context = canvas.getContext('2d');

    let render = () => {
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.save();

        // 移动坐标原点到图像的中心
        context.translate(canvas.width / 2, canvas.height / 2);

        // 旋转n度
        context.rotate(n * Math.PI / 180);

        // 将坐标原点移动回去
        context.translate(-canvas.width / 2, -canvas.height / 2);

        // 绘制图像
        context.drawImage(video, -canvas.width / 2, -canvas.height / 2, canvas.width, canvas.height);

        context.restore();
		RegAsync(render,1000/25);// requestAnimationFrame(render);
    };
	if(0 < video.videoWidth && 0 < video.videoHeight){
		canvas.width = video.videoWidth;
		canvas.height = video.videoHeight;
		render();
	}else{
		video.onloadedmetadata = () => {
			canvas.width = video.videoWidth;
			canvas.height = video.videoHeight;
			render();
		}
	}

    return canvas.captureStream();
}

function CanPlay(v1){
	let videoTypes = ['application/vnd.apple.mpegurl', 'video/mp4', 'video/webm', 'video/ogg'];
	for (let type of videoTypes) {
		if (v1.canPlayType(type)) {
			return true;
		}
	}
	return false;
}

// 播放 multipart/x-mixed-replace 流， img
function PlayImgStream(s){
	var szId = "Esp_"+String(s).hashCode();
	if(dg(szId))return;
	var v1 = fnCreateVid(0,szId);
	let img = new Image();
	let canvas = document.createElement('canvas');
	let ctx = canvas.getContext('2d');
	img.src=s;
	v1.muted = true;
	v1.autoplay = true;
	v1.controls = false;
	function drawImage234() {
		try{
			canvas.width = img.width || 640;
			canvas.height = img.height || 480;
			ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
		}catch(e){log("PlayImgStream -> drawImage234",e)}
		// requestAnimationFrame(drawImage);// 屏幕中若干视频对象，变化太多 导致性能下降
		RegAsyncNoCtx(drawImage234,1000/25);
	}
	drawImage234();
	// 获取canvas的流
	let stream = canvas.captureStream();
	// 将流赋予给video对象
	v1.srcObject = stream;
	attachMediaStream(v1, stream);
	initOnePeer(0, 0,stream);
	RegAsyncNoCtx(fnStartRct,stream,1,szId,v1);
	log("PlayImgStream -> initOnePeer");
}

// for safari
if (!HTMLVideoElement.prototype.captureStream) {
	HTMLVideoElement.prototype.captureStream = function(frameRate) {
	  let cvs = document.createElement('canvas');
	  let ctx = cvs.getContext('2d');
	  let v1 = this;
	  let stream = cvs.captureStream(frameRate);
  
	  function drawVideoTmp(time) {
		try{
			if (v1.readyState === v1.HAVE_ENOUGH_DATA) {
				cvs.width = v1.videoWidth;
				cvs.height = v1.videoHeight;
				ctx.drawImage(v1, 0, 0, cvs.width, cvs.height);
			}
		}catch(e){log("drawVideoTmp",e)}
		RegAsyncNoCtx(drawVideoTmp,1000/25);
		// requestAnimationFrame(drawVideoFrame);
	  }
	  drawVideoTmp();
	  return stream;
	};
  }
// ffmpeg -i rtsp://admin:MJAmg%40028@192.168.0.124/live/main -c:v copy -c:a copy -f hls -hls_time 2  output.m3u8
// 本地视频初始化，还要加流到 p2p 中
// https://github.com/phoboslab/jsmpeg
function CreateUrlVd(s,n,szHs){
	// var o1 = dc("canvas")
	// dg("myCtn").appendChild(o1);
	// var player = new JSMpeg.Player(s, {canvas:o1,loop:false,autoplay:false,audio:true});
	var szId = "Rtsp_"+(szHs||new Date().getTime());
	if(dg(szId))return log("skip "+szId);
	var v1 = fnCreateVid(0,szId);
	v1.muted = true;
	v1.autoplay = true;
	v1.controls = false;
	// var o3 = $(v1.parentElement);
	// o3.addClass('jsmpeg');
	// o3.attr("data-url",s);
	// o3.attr("data-loop","true");
	// o3.attr("data-autoplay","true");
	// v1.src = s;
	let cbkSt = function(){
		if(CanPlay(v1) && (!v1.src || ""==v1.src)){
			return v1.src = s;
		}
		let cbk1 = function(){
			if (Hls.isSupported()) {
				var hls = new Hls({debug: false});
				hls.loadSource(s);
				hls.attachMedia(v1);
				hls.on(Hls.Events.MEDIA_ATTACHED, function () {
					v1.muted = true;
					v1.play();
				});
			}else if(!v1.src || ""==v1.src){v1.src = s}
		};
		if(typeof Hls == "undefined")Is("/js/hls.js",cbk1);
		else cbk1();
	};
	// v1.style.transform = "rotate(180deg)"; // 设置视频反转180度
	let stream;
	if(0 < n){// 旋转视频流
		stream = flipVideoStream(v1, n);
		cbkSt();
	}else{
		cbkSt();
		try{stream = v1.captureStream()}catch(e){log("v1.captureStream",e.toString())}
	}
	// safari 不支持 captureStream
	// v1.style.transform = "rotate(180deg)"; // 设置视频反转180度
	if(stream){
		// 处理到隐藏图层，便于统一 ai 处理
		attachMediaStream(v1, stream);
		RegAsyncNoCtx(fnStartRct,stream,1,szId,v1);
		initOnePeer(0, 0,stream);
	}else{
		log(v1.id,v1.tagName,typeof v1.captureStream);
		// RegAsync(xxSetS,1000);
		// alert([v1.tagName,typeof stream,typeof v1.captureStream,stream])
	}
	
}
// computeHash(input).then(hashValue => console.log(hashValue));
function computeHash(input) {
    return new Promise(async function(resolve, reject) {
        const msgUint8 = new TextEncoder().encode(input);                                  
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);                
        const hashArray = Array.from(new Uint8Array(hashBuffer));                     
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join(''); 
        resolve(hashHex);
    });
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

    // 导入人脸需要更高的检测精度与属性，按需加载（已加载的不会重复下载）
    await ensureFaceNets(['faceLandmark68Net','ssdMobilenetv1','faceRecognitionNet','faceExpressionNet','ageGenderNet']);

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
		document.title = results.length;
		log("faces:" + results.length);
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
		// fnMyLogs(a.join("<br>"));
	}
};

function ldai(){
	if(g_bTxtChat)return;
	// 按需加载 tfjs（仅 AI 检测需要，避免首页加载 1.4MB）
	if(bEaV8 && !window.v8Load){
		window.v8Load = true;
		if(typeof window.tf == "undefined")Is('/js/9.js',function(){Is('/js/v8.js?v=20261116zd');});
		else Is('/js/v8.js?v=20261116zd');
	}
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
            // fnMyLogs(s1);
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

function plWarn(bMsg){
	// 冷却期内忽略重复报警，但冷却时间不被续期（否则目标持续在画面里时永远等不到下一次报警）
	if(g_bWarn)return;
	playSd(3);
	if(!bMsg)SendMsg("->jg");
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
	if(!bEaV8){ ws.hide(); return; }
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
	ws.html(a.join(""));
	if(!document.getElementById("wnsetClose")){
		var oX = document.createElement("b");
		oX.id = "wnsetClose";
		oX.className = "wnset-x";
		oX.title = "Close";
		oX.textContent = "×";
		oX.onclick = function(){ ws.hide(); };
		document.getElementById("wnset").appendChild(oX);
	}
	ws.show();
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
// 语言代码规范化：兼容 zh_cn / ZH-CN / en-US 等写法
function normLang(s){
	if(!s)return "en";
	s = String(s).replace(/_/g,"-").toLowerCase();
	var oMap = {"zh-cn":"zh-CN","zh-sg":"zh-CN","zh-hans":"zh-CN","zh-tw":"zh-TW","zh-hk":"zh-TW","zh-hant":"zh-TW","en-us":"en","en-gb":"en","pt-br":"pt","pt-pt":"pt","nb":"no","nn":"no"};
	if(oMap[s])return oMap[s];
	if(typeof aLang == "object" && aLang){
		if(aLang[s])return s;
		var s2 = s.split("-")[0];
		if(aLang[s2])return s2;
		for(var k in aLang){
			if(String(k).toLowerCase() == s)return k;
		}
	}
	return "en";
}
function GetLg(){
	if(location.search){
		var m = /lang=([^&]+)/.exec(location.search);
		if(m)return decodeURIComponent(m[1]);
	}
	try{
		var c = document.cookie.match(/(?:^|; )lang=([^;]+)/);
		if(c)return decodeURIComponent(c[1]);
	}catch(e){}
	try{
		var s = localStorage.getItem("lang");
		if(s)return s;
	}catch(e){}
	return normLang(navigator.language || navigator.userLanguage || "en");
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
		var oMs = $("#slctMtl"),ostL= $("#stL"),lcg = normLang(GetLg()),bBuilt = false;
		var szFlag = (aLang && aLang[lcg] && aLang[lcg]["contry"]) || lcg.split("-")[0];
		// https://cdn.simplelocalize.io/public/v1/flags/es.svg
		ostL.html("<img src=/flags/"+szFlag+".svg alt=''>");
		var fnFilter = function(){
			var q = String($("#langSearch").val()||"").replace(/^\s*|\s*$/g,"").toLowerCase();
			oMs.children("a").each(function(){
				var s = this.title + " " + this.innerText;
				this.style.display = (!!q && -1 == s.toLowerCase().indexOf(q)) ? "none" : "";
			});
		};
		$("#langSearch").on("input",fnFilter).on("click",function(e){e.stopPropagation()});
		$("#langClose").click(function(){oMs.removeClass("open")});
		ostL.click(function(){
			if(!bBuilt){
				bBuilt = true;
				if(!!aLang){
					var oPanel = document.getElementById("slctMtl");
					var oFrag = document.createDocumentFragment();
					var sH = "/?lang=";
					var aKeys = [],k0;
					for(k0 in aLang){
						if(String(k0).length>8||!aLang[k0]["contry"]) continue;
						aKeys.push(k0);
					}
					aKeys.sort(function(a,b){return String(aLang[a]["des"]).localeCompare(String(aLang[b]["des"]));});
					for(var i2=0;i2<aKeys.length;i2++){
						var k = aKeys[i2];
						var oDiv = document.createElement("div");
						oDiv.className = "w";
						var oA = document.createElement("a");
						oA.href = sH + k;
						oA.target = "_self";
						oA.title = aLang[k]["desCn"] + " / " + aLang[k]["des"];
						oA.dataset.lang = k;
						oA.addEventListener("click",function(){
							try{
								document.cookie = "lang=" + this.dataset.lang + ";path=/;max-age=31536000;SameSite=Lax";
								localStorage.setItem("lang",this.dataset.lang);
							}catch(e){}
						});
						var oImg = document.createElement("img");
						oImg.dataset.src = "/flags/" + (aLang[k]["contry"]||"us").toLowerCase() + ".svg";
						oImg.loading = "lazy";
						oImg.alt = "";
						oDiv.appendChild(oImg);
						var oTxt = document.createElement("span");
						oTxt.className = "lang-name";
						oTxt.textContent = aLang[k]["des"];
						oDiv.appendChild(oTxt);
						oA.appendChild(oDiv);
						oFrag.appendChild(oA);
					}
					if(oPanel)oPanel.appendChild(oFrag);
					Array.prototype.forEach.call(oPanel ? oPanel.querySelectorAll("img") : [],function(img){
						observer.observe(img);
					});
				}
			}
			$("#langSearch").val("");
			fnFilter();
			oMs.addClass("open");
			setTimeout(function(){$("#langSearch").focus()},50);
			return false;
		});
		oMs.click(function(e){
			if($(e.target).closest(".lang-head").length || $(e.target).closest("a").length)return;
			oMs.removeClass("open");
		});
		
		// 批量应用翻译（原先每条 64ms，语言切换需要数秒）
		if(!!language && "en" != lcg){
			RegAsync(function(){
				for(var i=0;i<language.length;i++){
					try{
						var oT1 = language[i],o1 = oT1["obj"];
						if(!oT1["des"] || !o1 || !o1.length)continue;
						for(var x=0;x<o1.length;x++){
							var o7 = o1[x];
							if(o7["tag"] && "title" == o7["tag"]){
								document.title = oT1["des"];
								continue;
							}
							var o2 = dg(o7["id"]);
							if(o2 && o7["id"] && o7["attr"]){
								if(o7["attr"] == "text")o2.innerText = oT1["des"];
								else if(o7["attr"] == "title"){
									// tipso 初始化时会移除 title 并缓存内容，需同步更新其缓存
									var $o2 = $(o2);
									if($o2.data("plugin_tipso"))$o2.attr("data-tipso-title",oT1["des"]).tipso("update","content",oT1["des"]).removeAttr("title");
									else o2.title = oT1["des"];
								}
								else{
									o2[o7["attr"]] = oT1["des"];
									if(o7["attr"] == "placeholder"){
										// 输入框的 tooltip 取自 placeholder，同步刷新 tipso 缓存
										var $o3 = $(o2);
										if($o3.data("plugin_tipso"))$o3.attr("data-tipso-title",oT1["des"]).tipso("update","content",oT1["des"]);
									}
								}
							}
						}
					}catch(e){}
				}
				document.documentElement.lang = lcg;
			},0);
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
	if(typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported){
		["video/webm;codecs=vp9","video/webm;codecs=vp8","video/webm","video/mp4"].some(function(t1){
			if(MediaRecorder.isTypeSupported(t1)){vWcStr = t1;return true;}
		});
	}else vWcStr = "video/webm";

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
	// 首屏及设备插拔时刷新摄像头/麦克风/扬声器列表
	refreshDevices();
	try{
		if(navigator.mediaDevices && navigator.mediaDevices.addEventListener)navigator.mediaDevices.addEventListener("devicechange",refreshDevices);
	}catch(e){log("devicechange",e)}
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
	$("#iRtsp").change(function(){
		let a1 = String(this.value||"").replace(/^\s*|\s*$/gmi,"").split("\n"),a2=[];
		if(a1.length){
			for(let i = 0;i<a1.length;i++){
				a1[i]=String(a1[i]||"").replace(/^\s*|\s*$/gmi,"");
				if(!a1[i])continue;
				if(-1 <a1[i].indexOf("?type=img"))PlayImgStream(a1[i]);
				else a2.push(a1[i]);
			}
		}
		RunRtsp(a2.join("\n"),this);
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
		// 新布局下频道/昵称始终可见，不再按设备隐藏
		$("#cah,#nkid").show();
		$("#qmI").removeClass("r1lft");
	};
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
	oStChat.click(async function (e) {
		e.preventDefault && e.preventDefault();
		playSd(1);
		var pdv = oCnId;if("" == pdv.val())pdv.val('51pwn'),pdv.change();
		b_clickJoin = doKstart = g_bTxtChat = true;
		oTxtChat.css("display", "inline-block");
		oStChat.hide();
		oStartChat.show();
		oMyCtn.hide();
		ovChat.hide();
		document.body.classList.remove("vchat");
		dspNa();
		
		oMyCtn.html("");
		// https://9to5answer.com/stop-close-webcam-stream-which-is-opened-by-navigator-mediadevices-getusermedia
		StopStream();
		g_bSetup = !g_bTxtChat;
		JoinRoom();
		$("#eLpos").click();
		setMF();
	});
	// video chat
	oStartChat.click(async function(e){
		e.preventDefault && e.preventDefault();
		playSd(1);
		var pdv = $("#cnId"); if("" == pdv.val()) pdv.val('51pwn'),pdv.change();
		b_clickJoin = true;
		g_bTxtChat = false;
		doKstart = true;
		oStChat.show();
		oStartChat.hide();
		oTxtChat.hide();
		// 必须显式设回 grid：jQuery show() 在容器为空时会把内联样式写成 display:block，
		// 覆盖 #myCtn 的 display:grid，导致 .vcell 高度塌陷为 0（视频看不见）
		oMyCtn.css("display", "grid");
		ovChat.show();
		document.body.classList.add("vchat");
		dspNa();
		// 和文字聊天一样：先入房（即使摄像头权限尚未拿到，也可以先加入频道接收消息）
		JoinRoom();
		StartVideo();
		// 进入视频模式后立即重算一次网格，保证首帧铺满
		fn009();
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
		bEaV8 = this.checked,this.checked||function(){var o=window.ov8canvas,c=o&&o.getContext("2d");c&&c.clearRect(0,0,o.width,o.height)}();
		// 若已经在视频模式里，视频流是“勾选之前”挂上的，此时没有任何帧被画进离屏画布，
		// v8 拿到的全是空帧 -> 表现为“勾选了识别对象却什么都检测不到”。这里补挂一次。
		if(bEaV8){
			try{
				$("video").each(function(){
					let s = this.srcObject;
					if(!s || !this.parentNode)return;
					if(this._drawFrameStop)this._drawFrameStop();
					AddStream2Canvas(this, s);
					try{ if(this.onplay)this.onplay(); }catch(e){}
				});
			}catch(e){log("hijackVideo2Canvas",e)}
		}
		if(bEaV8 && window.v8Load && typeof window["detectImgV8"] == "function")window["detectImgV8"]()//,imgOldCbk.push(fnFaceDtc);
		// else rmFnImg(fnFaceDtc);
		ldai();
		// v8 的标签表是异步到位（window.labels）的，早于它调用 showWnSt() 会让
		// window.g_oWarObj 永远是空对象 -> 检测到目标也不触发 plWarn()。这里轮询补齐。
		if(bEaV8){
			var nT3 = 0;
			var nPoll = setInterval(function(){
				nT3++;
				if(window.labels){ clearInterval(nPoll); showWnSt(); }
				else if(nT3 > 120)clearInterval(nPoll);
			}, 500);
		}
		showWnSt()
	});
	// 检测循环在页面隐藏时会暂停，回到前台后重新启动
	document.addEventListener("visibilitychange", function(){
		if(!document.hidden && bEaV8 && typeof window["detectImgV8"] == "function")window["detectImgV8"]();
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
	// 频道/昵称输入框回车：先触发 change，再按当前可见的开始按钮进入对应聊天模式
	oNick.add(oCnId).keydown(function(e){
		if(13 != e.keyCode)return;
		this.blur();
		if(!doKstart)(oStChat.is(":visible")?oStChat:oStartChat).click();
	});

	oCnId.change(function () {
		if(doKstart)JoinRoom();// 这里非常神奇和变态，若干没有点按钮开始聊，就先执行，则导致join失败
	});
	// initQrcode();
	osdMsg.keydown(function (e) {
		if (e.keyCode == 13) SendMsg(osdMsg.val()),osdMsg.val("")
	})
	$("#sendBtn").click(function(){
		var s = osdMsg.val();
		if(!s)return osdMsg.focus();
		SendMsg(s);
		osdMsg.val("").focus();
	});
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
		var bOpen = !o10.hasClass("open");
		o10.toggleClass("open",bOpen);
		$(this).attr("aria-expanded",bOpen?"true":"false");
		if(bOpen)refreshDevices();
		return false;
	});
	$("#rtoolClose").click(function(){
		$("body > div.rtool").removeClass("open");
		$("#its").attr("aria-expanded","false");
	});
	// 点击抽屉外部关闭
	$(document).on("click",function(e){
		var o10 = $("body > div.rtool");
		if(!o10.hasClass("open"))return;
		if($(e.target).closest(".rtool,#its,#intro").length)return;
		o10.removeClass("open");
		$("#its").attr("aria-expanded","false");
	});
	// Esc 关闭浮层
	$(document).keydown(function(e){
		if(e.key != "Escape" && e.keyCode != 27)return;
		$("body > div.rtool").removeClass("open");
		$("#its").attr("aria-expanded","false");
		$("#slctMtl").removeClass("open");
		var oIntro = $("#intro");
		if(oIntro.is(":visible"))oIntro.hide(),$("#sInvite").prop(ckd,false);
	});
	// hash 入口（#房间名）：
	// 如果 URL 同时带 startChat/stChat query 参数，initBox 已经处理了模式切换，
	// 这里只需把 hash 里的房间名填入（hash 比 query 优先级高）；
	// 纯 hash 邀请没有 query 参数，必须走 startChat.click() 完整链路，
	// 否则只会起摄像头不会切到视频 UI（缺 vchat 类、网格 display、布局重算）
	if (szHs) {
		oCnId.val(szHs.substring(1));
		var bHasModeParam = /[?&](startChat|stChat)=/.test(location.search);
		if (!bHasModeParam) {
			oStartChat.click();
		}
	}
	$("#roomurl").bind("mouseover", MkQrcd).bind("click", MkQrcd);
	var t2 = $("#intro"),fnShT1 = function(x){x?t2.show():t2.hide();};
	fnShT1($("#sInvite").prop(ckd));
	$("#sInvite").change(function(){
		MkQrcd();
		fnShT1(this.checked);
	});
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
			setTimeout(fn009,200);
		});
	}
	initBox();
	if(g_bEableP2pFs){
		// for(const x of '/js/10.js;/js/12.js;/js/8.js'.split(";")){
		// 	seedFiles(x);
		// }
	}
	// 只在工具栏/头部启用 tipso，避免给整页上千个元素绑定事件
	if(!bIsMobile){
		$('.app-header [title], .rtool [title], .composer [title]').tipso({
			size: 'tiny',
			background: 'tomato',
			tooltipHover: true,
			useTitle: true
		});
	}
	// $("script").remove();
	try{
		db=new Dexie("_p2pchat_");
		if(!!db)db.version(1).stores({
			friends: "++id,date,video,name"
		});
		cntVideo(rmHisVideo);
	}catch(e){}
	$("#sI55").click(dlAllVideo);
	$("#sI56").click(rmAllVd);
	// 布局事件：窗口尺寸、可视视口、屏幕旋转
	window.addEventListener("resize", fn009);
	window.addEventListener("orientationchange", function(){setTimeout(fn009,250)});
	window.addEventListener("screenfit", fn009);
	if(typeof ResizeObserver !== "undefined" && oMyCtn && oMyCtn.length){
		new ResizeObserver(fn009).observe(oMyCtn[0]);
	}
	// AI 模式下才低频刷新画布覆盖层
	setInterval(function(){
		if(document.hidden || !bEaV8)return;
		if(typeof getImgFromStream == "function")getImgFromStream();
		layoutNow();
	},2000);
	RegAsync(initLang,0)
});

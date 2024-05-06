var aJs = ["i","jquery.min","client.min","RecordRTC.min","adapter-latest","qrcode.min","plyr","html5-qrcode.min","crypto-js.min","fix","tfjs","webtorrent.min","html2canvas.min","dexie","index","jszip.min"];
for(var i = 0; i < aJs.length; i++){
	import("./static/js/"+aJs[i]+".js");
}


require("./static/js/p2pchat.js");

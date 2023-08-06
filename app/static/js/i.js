const Is = (s1)=>{const S = document.createElement('script');
// S.setAttribute('crossorigin', 'anonymous');
S.src = s1;S.defer = false;
var g_bEableP2pFs = false;
document.head.appendChild(S)};
if('serviceWorker' in navigator) {
	navigator.serviceWorker.register('/js/sw.js')
	.then(reg => {
		console.log('Service Worker: Registered (Pages)');
		window.caches=reg.caches;
		// Is("/socket.io/socket.io.js");
		// for(let i=0;i<12;i++){
		// 	if(i === 11)i = ",";
		// 	Is('/js/'+i+'.js');
		// }
	}).catch(err => console.log(`Service Worker: Error: ${err}`));
	navigator.serviceWorker.addEventListener("message", (e) => {
		let o = e.data;
		switch(o.type){
			case "fok":
				if(g_bEableP2pFs)seedFiles(o.url)
				default:
					log(e.data)
		}
		
	});
	navigator.serviceWorker.startMessages();
}
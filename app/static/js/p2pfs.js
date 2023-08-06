WebTorrent.init();

const trackers = ["udp://tracker.opentrackr.org:1337/announce",
"udp://tracker.leechers-paradise.org:6969/announce",
"udp://tracker.coppersurfer.tk:6969/announce",
"udp://tracker.internetwarriors.net:1337/announce",
"udp://tracker.tiny-vps.com:6969/announce",
"udp://open.stealth.si:80/announce",
"https://tracker.fastdownload.xyz:443/announce",
"https://tracker.sloppyta.co:443/announce"];
const torrentOpts = { announce: trackers }
const trackerOpts = {
    announce: trackers,
    rtcConfig: {'iceServers':ICE_SERVERS}
};
// 创建一个 WebTorrent 实例
const torrent = new WebTorrent({
    tracker: trackerOpts,
    maxConns:128,
    dht:true,
    lsd:true,
    webSeeds:true,
    utp:true,
    downloadLimit:-1,
    uploadLimit:-1,
});

const seedFiles = (files) => {
    log("start share file " + files)
    fetch(files).then(async(r) => {
        torrent.seed(await r.blob(), torrentOpts, t => {
            t.on('upload', function (bytes) {
                log('just uploaded: ' + bytes)
                log('total uploaded: ' + t.uploaded);
                log('upload speed: ' + t.uploadSpeed)
            })
            if(signaling_socket)signaling_socket.emit("p2f", t.magnetURI);
            return t;
        });
    });
};

torrent.on('error', (error) => {
    log(error);
});
let ccDb = null;
async function download(x) {
    // log("start download share file " + x);
    if(ccDb && !(await ccDb.match(x)))torrent.add(x);
    else log("ccDb is null, or file is in cache");
}
torrent.on("ready", async() => {
    log("webtorrent is ready");
    ccDb = await caches.open("v1.2.6",{ 
        maxAgeSeconds: 60 * 60 * 24 * 365,
        maxEntries: 10000,
        optional: true });
    const stp = (cfn)=>{
        for(const f of Array.from(torrent.files)){
            if("" === f.name.split(cfn).pop()){
                torrent.stop(f.name);
            }
        };
    };
    torrent.on("start", async(e) => {
        // 检查是否已经从 caches.match() 中匹配了文件
        const u = new URL(e.detail.url);
        var cc = window.caches||await navigator.serviceWorker.getCaches();
        if(cc){
            const c = await cc.match(u.pathname);
            if(c)stp(i);
        }
    });
    
    
    /* 监听下载完成事件
    文件名 name
    文件大小 size, length(当前已经下载的字节数)
    文件类型 "type": "text/plain",
    文件创建时间 "created": "2023-03-08T12:00:00Z",
    文件修改时间 "modified": "2023-03-08T12:00:00Z",
    文件权限 "permissions": "0644",
    文件所有者 "owner": "user1", "group": "group1"
    */
    torrent.on("downloaded", (j,z) => {
        const f0 = torrent.files[z];
        // 所有字节都下载完成
        if (j === f0.length) {
            log(f0.name, " 下载完成");
            const cfn = f0.name.split(/\//).pop();
            // 停止其他同名资源的下载
            stp(cfn);
            // 获取文件下载请求对象
            const r = Object.assign({}, j.request);
            r.path = u2 + cfn;
            if(ccDb){
                ccDb.put(r, f0);
                console.log( f0.name + " to cache");
            }else{
                console.log("cache ccDb is null");
            }
            seedFiles(f0);
        }
    });
})
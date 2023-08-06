WebTorrent.init();

const trackers = undefined;
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
torrent.connect.setMaxListeners(20);
const seedFiles = (files) => {
    torrent.seed(files, torrentOpts, t => {
        t.on('upload', function (bytes) {
        log('just uploaded: ' + bytes)
        log('total uploaded: ' + t.uploaded);
        log('upload speed: ' + t.uploadSpeed)
        })
    
        log('client.seed done', {
        magnetURI: t.magnetURI,
        ready: t.ready,
        paused: t.paused,
        done: t.done,
        });
    })
};
    
const u1 = "https://unpkg.com/web-ai-51pwn@latest/dist/yolov8n-seg_web_model/";
const u2 = appURL()+"/model/yolov8n-seg_web_model/";
// magnet:?xt=urn:btih:1c033ebaa2e247832d7e828ad560f90d6b9144207e2380fc36b40815573f613e&dn=/model/yolov8n-seg_web_model/group1-shard1of4.bin,/model/yolov8n-seg_web_model/group1-shard2of4.bin,/model/yolov8n-seg_web_model/group1-shard3of4.bin,/model/yolov8n-seg_web_model/group1-shard4of4.bin,/model/yolov8n-seg_web_model/metadata.yaml,/model/yolov8n-seg_web_model/model.json
const fsList = String('group1-shard1of4.bin,group1-shard2of4.bin,group1-shard3of4.bin,group1-shard4of4.bin,metadata.yaml,model.json').split(",");
const dldOne = (u)=>{
    fetch(u).then(res => res.blob()).then(blob => {
        seedFiles(blob);
    });
};
torrent.on('error', (error) => {
    const files = torrent.files;
    for (const file of files) {
        if (file.state === "error") {
            dldOne(file.url)
        }
    }
});
torrent.on("ready", async() => {
    log("webtorrent is ready");
    const stp = (cfn)=>{
        for(const f of Array.from(torrent.files)){
            if("" === f.name.split(cfn).pop()){
                torrent.stop(f.name);
            }
        };
    };
    torrent.on("start", async(e) => {
        // 检查是否已经从 caches.match() 中匹配了文件
        const u = e.detail.url;
        for(const i of fsList){
            if (u.split(i).pop() === "") {
                var cc = window.caches||await navigator.serviceWorker.getCaches();
                if(cc){
                    const c = await cc.match(u2 + i);
                    if(c)stp(i);
                }
                break;
            }
        };
    });
    function download () {
        torrent.add('magnet:?xt=urn:btih:1c033ebaa2e247832d7e828ad560f90d6b9144207e2380fc36b40815573f613e&dn=/model/yolov8n-seg_web_model/group1-shard1of4.bin,/model/yolov8n-seg_web_model/group1-shard2of4.bin,/model/yolov8n-seg_web_model/group1-shard3of4.bin,/model/yolov8n-seg_web_model/group1-shard4of4.bin,/model/yolov8n-seg_web_model/metadata.yaml,/model/yolov8n-seg_web_model/model.json');
        // for(const i of fsList){
        // 	torrent.add(u1 + i);
        // 	torrent.add(u2 + i);
        // }
    }
    for(const i of fsList){
        dldOne(u2 + i)
    }
    
    /* 监听下载完成事件
    文件名 name
    文件大小 size, length(当前已经下载的字节数)
    文件类型 "type": "text/plain",
    文件创建时间 "created": "2023-03-08T12:00:00Z",
    文件修改时间 "modified": "2023-03-08T12:00:00Z",
    文件权限 "permissions": "0644",
    文件所有者 "owner": "user1", "group": "group1"
    */
    let ccDb = await caches.open("v1",{ 
        maxAgeSeconds: 60 * 60 * 24 * 365,
        maxEntries: 10000,
        optional: true });
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
            if(ccDb)ccDb.put(r, f0);
            seedFiles(f0);
        }
    });
})
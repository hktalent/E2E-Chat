const cacheName = "v1";
const opT = { 
    maxAgeSeconds: 60 * 60 * 24 * 365,
    maxEntries: 10000,
    optional: true };
let ccDb;
async function Log(e,s) {
  const c = e&&e.clientId ? await clients.get(e.clientId):client;
  if(c)c.postMessage(s);
}
self.addEventListener("install", async e => {
    Log(e,"Service Worker: Installed");
    let a = 'https://cdnjs.cloudflare.com/ajax/libs/ClientJS/0.2.1/client.min.js;https://cdnjs.cloudflare.com/ajax/libs/jquery/3.7.0/jquery.min.js;https://cdnjs.cloudflare.com/ajax/libs/RecordRTC/5.6.2/RecordRTC.min.js;https://cdnjs.cloudflare.com/ajax/libs/webrtc-adapter/8.2.3/adapter.min.js;https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js;https://cdnjs.cloudflare.com/ajax/libs/plyr/3.7.8/plyr.min.js;https://cdnjs.cloudflare.com/ajax/libs/html5-qrcode/2.3.8/html5-qrcode.min.js;https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.1.1/crypto-js.min.js;https://unpkg.com/web-ai-51pwn@latest/dist/8.js;https://cdnjs.cloudflare.com/ajax/libs/tensorflow/4.10.0/tf.min.js;https://cdn.jsdelivr.net/npm/webtorrent@latest/webtorrent.min.js;https://unpkg.com/web-ai-51pwn@latest/dist/,.js'.split(";");
    ccDb = ccDb || caches.open(cacheName,opT);
    const cU = location.origin;
    const X = {crossOrigin: 'anonymous',credentials: 'include'};
    if(-1 == String(cU).indexOf("https://127.")){
      const promises = a.map(async(r,i) => {
        if(i === (a.length - 1))i = ",";
        const S = '/model/' + i + ".js";
        if(caches.match(S))return;
        return await cache.put(S, await fetch(new Request(r,X)));
      });
      await Promise.all(promises);
    }
    if(!caches.match("/socket.io/socket.io.js"))await fetch(new Request('https://cdnjs.cloudflare.com/ajax/libs/socket.io/4.7.1/socket.io.min.js',X)).then(async e =>cache.put("/socket.io/socket.io.js", e));
    let oM = {
      "/socket.io/socket.io.min.js.map":'https://cdnjs.cloudflare.com/ajax/libs/socket.io/4.7.1/socket.io.min.js.map',
      "/js/v,.js":"https://unpkg.com/web-ai-51pwn@latest/dist/v,.js",
      "/online.mp3":"https://unpkg.com/web-ai-51pwn@latest/dist/online.mp3",
      "/msg.mp3":"https://unpkg.com/web-ai-51pwn@latest/dist/msg.mp3",
      "/wh01.mp3":"https://unpkg.com/web-ai-51pwn@latest/dist/wh01.mp3",
    };
    Object.entries(oM).map(async([k,v]) => {
      if(caches.match(k))return;
      fetch(new Request(v,X)).then(async(e)=>{
        cache.put(k, e);
        console.log("cache " + k + " is ok")
      });  
    });
    
    a = 'https://unpkg.com/web-ai-51pwn@latest/dist/yolov8n-seg_web_model/model.json,https://unpkg.com/web-ai-51pwn@latest/dist/yolov8n-seg_web_model/group1-shard1of4.bin,https://unpkg.com/web-ai-51pwn@latest/dist/yolov8n-seg_web_model/group1-shard2of4.bin,https://unpkg.com/web-ai-51pwn@latest/dist/yolov8n-seg_web_model/group1-shard3of4.bin,https://unpkg.com/web-ai-51pwn@latest/dist/yolov8n-seg_web_model/group1-shard4of4.bin'.split(',');
    a.map(async(r,i) => {
      const S = cU+'/model/' + r.split('/dist').pop();
      if(caches.match(S))return;
      fetch(new Request(r,X)).then(async e =>cache.put(S, e));
    });
    // self.skipWaiting()
});
self.addEventListener("activate", async e => {
  Log(e,"Service Worker: Activated");
  e.waitUntil(Promise.all([
    caches.keys().then(e => Promise.all(e.map(e => {
      if (e !== cacheName) return caches.delete(e), Log(e,"Service Worker: Clearing Old "+e+" Cache");
    }))),
    self.clients.claim()// 覆盖次默认行为并在页面打开的情况下
  ]));
  ccDb = await caches.open(cacheName,opT);
});
self.addEventListener("fetch", t => {
  Log(t,"Service Worker: Fetching " + t.request.url);
  
  let x = caches.match(t.request);
  if (x)return t.respondWith(x);

  t.respondWith(fetch(t.request).then(e => {
    const c = e.clone();
    ccDb = ccDb || caches.open(cacheName,opT);
    if(ccDb)ccDb.put(t.request, c);
    // if(stp)stp(t.request.url);
    return e
  }).catch(e => caches.match(t.request).then(e => e)))
});

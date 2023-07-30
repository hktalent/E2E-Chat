const cacheName = 'v1';

// Call Install Event
self.addEventListener('install', e => {
  console.log('Service Worker: Installed');
});

// Call Activate Event
self.addEventListener('activate', e => {
  console.log('Service Worker: Activated');
  // Remove unwanted caches
  e.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== cacheName) {
            console.log('Service Worker: Clearing Old Cache');
            return caches.delete(cache);
          }
        })
      );
    })
  );
});

// Call Fetch Event
self.addEventListener('fetch', e => {
  console.log('Service Worker: Fetching');
  e.respondWith(
    fetch(e.request)
      .then(res => {
        // Make copy/clone of response
        const resClone = res.clone();
        // Open cahce
        caches.open(cacheName).then(cache => {
          // Add response to cache
          cache.put(e.request, resClone);
        });
        return res;
      })
      .catch(err => caches.match(e.request).then(res => res))
  );
});

// webtorrent
// (()=>{"use strict";let e=!1;self.addEventListener("install",(()=>{self.skipWaiting()})),self.addEventListener("fetch",(s=>{const t=(s=>{const{url:t}=s.request;return t.includes(self.registration.scope+"webtorrent/")?t.includes(self.registration.scope+"webtorrent/keepalive/")?new Response:t.includes(self.registration.scope+"webtorrent/cancel/")?new Response(new ReadableStream({cancel(){e=!0}})):async function({request:s}){const{url:t,method:n,headers:o,destination:a}=s,l=await clients.matchAll({type:"window",includeUncontrolled:!0}),[r,i]=await new Promise((e=>{for(const s of l){const l=new MessageChannel,{port1:r,port2:i}=l;r.onmessage=({data:s})=>{e([s,r])},s.postMessage({url:t,method:n,headers:Object.fromEntries(o.entries()),scope:self.registration.scope,destination:a,type:"webtorrent"},[i])}}));let c=null;const d=()=>{i.postMessage(!1),clearTimeout(c),i.onmessage=null};return"STREAM"!==r.body?(d(),new Response(r.body,r)):new Response(new ReadableStream({pull:s=>new Promise((t=>{i.onmessage=({data:e})=>{e?s.enqueue(e):(d(),s.close()),t()},e||(clearTimeout(c),"document"!==a&&(c=setTimeout((()=>{d(),t()}),5e3))),i.postMessage(!0)})),cancel(){d()}}),r)}(s):null})(s);t&&s.respondWith(t)})),self.addEventListener("activate",(()=>{self.clients.claim()}))})();
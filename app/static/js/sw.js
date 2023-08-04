const cacheName = "v1";
const opT = { 
    maxAgeSeconds: 60 * 60 * 24 * 365,
    maxEntries: 10000,
    optional: true };
let ccDb;


const portTimeoutDuration = 5000
let cancellable = false

const listener = event => {
  const { url } = event.request
  if (!url.includes(self.registration.scope + 'webtorrent/')) return null
  if (url.includes(self.registration.scope + 'webtorrent/keepalive/')) return new Response()
  if (url.includes(self.registration.scope + 'webtorrent/cancel/')) {
    return new Response(new ReadableStream({
      cancel () {
        cancellable = true
      }
    }))
  }
  return serve(event)
};
let fileResponse = listener;
async function serve ({ request }) {
  const { url, method, headers, destination } = request;
  const clientlist = await clients.matchAll({ type: 'window', includeUncontrolled: true });

  const [data, port] = await new Promise(resolve => {
    // Use race condition for whoever controls the response stream
    for (const client of clientlist) {
      const messageChannel = new MessageChannel();
      const { port1, port2 } = messageChannel;
      port1.onmessage = ({ data }) => {
        resolve([data, port1])
      }
      client.postMessage({
        url,
        method,
        headers: Object.fromEntries(headers.entries()),
        scope: self.registration.scope,
        destination,
        type: 'webtorrent'
      }, [port2])
    }
  });

  let timeOut = null
  const cleanup = () => {
    port.postMessage(false) // send a cancel request
    clearTimeout(timeOut)
    port.onmessage = null
  }

  if (data.body !== 'STREAM') {
    cleanup()
    return new Response(data.body, data)
  }

  return new Response(new ReadableStream({
    pull (controller) {
      return new Promise(resolve => {
        port.onmessage = ({ data }) => {
          if (data) {
            controller.enqueue(data) // data is Uint8Array
          } else {
            cleanup()
            controller.close() // data is null, means the stream ended
          }
          resolve()
        }
        if (!cancellable) {
          // firefox doesn't support cancelling of Readable Streams in service workers,
          // so we just empty it after 5s of inactivity, the browser will request another port anyways
          clearTimeout(timeOut)
          if (destination !== 'document') {
            timeOut = setTimeout(() => {
              cleanup()
              resolve()
            }, portTimeoutDuration)
          }
        }
        port.postMessage(true) // send a pull request
      })
    },
    cancel () {
      cleanup()
    }
  }), data)
}

self.addEventListener("install", e => {
    console.log("Service Worker: Installed");
    self.skipWaiting()
});
self.addEventListener("activate", async e => {
  console.log("Service Worker: Activated");
  e.waitUntil(caches.keys().then(e => Promise.all(e.map(e => {
    if (e !== cacheName) return caches.delete(e), console.log("Service Worker: Clearing Old "+e+" Cache");
  }))));
  ccDb = await caches.open(cacheName,opT);
  self.clients.claim();
});
self.addEventListener("fetch", t => {
  console.log("Service Worker: Fetching " + t.request.url);
  try{
    let x = caches.match(t.request);
    if (x)return t.respondWith(x);
    x = fileResponse(t);
    if(x)return t.respondWith(x);
  }catch(e){console.log(e)}
  t.respondWith(fetch(t.request).then(e => {
    const c = e.clone();
    ccDb = ccDb || caches.open(cacheName,opT);
    if(ccDb)ccDb.put(t.request, c);
    // if(stp)stp(t.request.url);
    return e
  }).catch(e => caches.match(t.request).then(e => e)))
});

const cacheName = 'v1';
const DB_NAME = 'web-ai-51pwn';
const STORE_NAME = 'odm-cache';

// Open indexedDB
function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);

    request.onerror = () => {
      reject('IndexedDB: Error opening database');
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      db.createObjectStore(STORE_NAME);
    };
  });
}

// Get cache from indexedDB
function getCachedData(request) {
  return new Promise((resolve, reject) => {
    openDatabase().then((db) => {
      const transaction = db.transaction(STORE_NAME);
      const objectStore = transaction.objectStore(STORE_NAME);
      const getDataRequest = objectStore.get(request.url);

      getDataRequest.onerror = () => {
        reject('IndexedDB: Error getting data from cache');
      };

      getDataRequest.onsuccess = () => {
        if (getDataRequest.result) {
          resolve(new Response(getDataRequest.result));
        } else {
          resolve(null);
        }
      };
    }).catch(() => {
      resolve(null);
    });
  });
}

// Save data to indexedDB
function cacheData(request, response) {
  openDatabase().then((db) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const objectStore = transaction.objectStore(STORE_NAME);
    objectStore.put(response.clone().arrayBuffer(), request.url);
  });
}

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
    getCachedData(e.request).then(cachedResponse => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(e.request).then(networkResponse => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }

        const clonedResponse = networkResponse.clone();
        cacheData(e.request, clonedResponse);

        return networkResponse;
      });
    }).catch(() => {
      return fetch(e.request);
    })
  );
});

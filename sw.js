if (typeof idb === "undefined") {
  self.importScripts('idb.js');
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js', {
      scope: '/'
    }).then((reg) => {
      // Registration was successfull!
      console.log(`Service Worker registered successfully with scope: ${reg.scope}`);
    }).catch((error) => {
      // Registration failed :(
      console.log(`Service Worker registration failed with error ${error}`);
    });
  });
}

// latest cache name
const staticCacheName = 'restaurant-reviews-v2';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(staticCacheName)
    .then((cache) => {
      // cache static assets
      return cache.addAll([
        '/',
        'restaurant.html',
        'css/styles.css',
        'js/dbhelper.js',
        'js/main.js',
        'js/restaurant_info.js',
        'restaurant.svg'
      ]);
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    // If request is already cached, then return the response from cache
    // Else fetch the request, put it in cache and return response
    caches.match(event.request, {
      ignoreSearch: true
    }).then((response) => {
      return response || fetch(event.request)
        .then((resp) => {
          const responseClone = resp.clone();

          caches.open(staticCacheName).then((cache) => {
            cache.put(event.request, responseClone);
          });

          return resp;
        })
    }).catch((error) => {
      console.log(error);
    })
  );
});

const createDB = () => {
  return idb.open('restaurants', 2, upgradeDB => {
    switch(upgradeDB.oldVersion) {
      case 0:
        // a placeholder case so that the switch block will
        // executer when the database is first created
        // (oldVersion is 0)
      case 1:
        console.log('Creating restaurants object store');
        let store = upgradeDB.createObjectStore('restaurants', {keyPath: 'id'});
      case 2:
        console.log('Creating neighborhood index');
        store = upgradeDB.transaction.objectStore('restaurants');
        store.createIndex('neighborhood', 'neighborhood');
    }
  });
};

const addToIdb = () => {
  fetch('http://localhost:1337/restaurants').then(resp => {
    resp.json().then(restaurants => {
      idb.open('restaurants', 2).then((db) => {
        const tx = db.transaction(['restaurants'], 'readwrite');
        const store = tx.objectStore('restaurants');
        return Promise.all(restaurants.map((restaurant) => {
          return store.add(restaurant);
        })).catch(e => {
          tx.abort();
          console.log(e);
        }).then(() => {
          console.log('All items added successfully');
        })
      })
    })
  })
}

// Delete old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(createDB());
  event.waitUntil(addToIdb());
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.filter((cacheName) => {
          return cacheName.startsWith('restaurant-reviews-') &&
            cacheName != staticCacheName;
        }).map((cacheName) => {
          return cache.delete(cacheName);
        })
      );
    })
  );
});
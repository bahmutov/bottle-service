/*
  This is ServiceWorker code
*/
/* global self, Response, Promise */
var myName = 'bottle-service';
var cacheName = myName + '-v1';
console.log(myName, 'startup');

var dataStore;

console.log('data store at start', dataStore)

self.addEventListener('install', function (event) {
  console.log(myName, 'installed');
  dataStore = {
    name: 'bottle-service',
    storeName: 'fragments',
    html: ''
  }

  /*
  event.waitUntil(
    caches.open(cacheName).then(function(cache) {
      return cache.addAll(['index.html'])
    })
  )*/
});

self.addEventListener('activate', function () {
  console.log(myName, 'activated');
  console.log('data store', dataStore)
});

/*
var request = indexedDB.open(dataStore.name, 1.0)
request.onsuccess(function (e) {
  console.log('opened indexed db', dataStore.name)
  dataStore.db = e.target.result
  var store = dataStore.db.createObjectStore(dataStore.storeName, { keyPath: 'timestamp' })
})

// Note: the mocks stay valid even during website reload
var mocks;
*/

function isIndexPageRequest(event) {
  // TODO remove hardcoded index.html
  return event &&
    event.request &&
    event.request.url === 'http://localhost:3004/'
}

self.addEventListener('fetch', function (event) {
  if (!isIndexPageRequest(event)) {
    return fetch(event.request);
  }

  console.log(myName, 'fetching index page', event.request.url);

  // text/html; charset=UTF-8

  event.respondWith(
    fetch(event.request).then(function (response) {
      if (dataStore.html) {
        console.log('fetched latest', response.url, 'need to update')
        console.log('element "%s" with html "%s" ...',
          dataStore.id, dataStore.html.substr(0, 5))
        var copy = response.clone()
        return copy.text().then(function (pageHtml) {
          console.log('inserting our html')
          var toReplace = '<div id="app"></div>'
          var newFragment = '<div id="app">\n' + dataStore.html + '\n</div>'
          pageHtml = pageHtml.replace(toReplace, newFragment)

          console.log('page html')
          console.log(pageHtml)

          var responseOptions = {
            status: 200,
            headers: {
              'Content-Type': 'text/html; charset=UTF-8'
            }
          }
          return new Response(pageHtml, responseOptions)
        })

      } else {
        return response
      }
    })
  )

  /*
  event.respondWith(
    caches.open(cacheName).then(function(cache) {
      return cache.match(event.request).then(function(response) {
        if (response) {
          console.log('found cached response', response.url)
          return response
        }
        fetch(event.request).then(function(response) {
          console.log('fetched and caching response', response.url)
          cache.put(event.request, response.clone());
          return response;
        });
      });
    })
   );
  */

  /*
  mocks = mocks || {};

  Object.keys(mocks).forEach(function (url) {
    var urlReg = new RegExp(url);
    if (urlReg.test(event.request.url)) {
      var mockData = mocks[url];
      var options = mockData.options || {};

      var responseOptions = {
        status: options.code || options.status || options.statusCode,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json; charset=utf-8'
        }
      };

      var body = JSON.stringify(options.body || options.data);
      var response = new Response(body, responseOptions);

      if (options.timeout) {

        event.respondWith(new Promise(function (resolve) {
          setTimeout(function () {
            resolve(response);
          }, options.timeout);
        }));

      } else {
        event.respondWith(response);
      }
    }
  });*/

});

// use window.navigator.serviceWorker.controller.postMessage('hi')
// to communicate with this service worker
self.onmessage = function onMessage(event) {
  console.log('message to bottle-service worker', event.data);

  switch (event.data.cmd) {
    case 'print': {
      console.log('bottle service has')
      console.log(dataStore)
      return;
    }
    case 'clear': {
      dataStore.html = ''
      console.log('cleared cache html')
      return;
    }
    case 'refill': {
      dataStore.html = event.data.html
      dataStore.id = event.data.id
      console.log('saved new html for id', event.data.id)
      return;
    }
    default: {
      console.error(name, 'unknown command', event.data)
    }
  }
};

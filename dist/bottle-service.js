/*
  This is ServiceWorker code
*/
/* global self, Response, Promise */
var myName = 'bottle-service';
console.log(myName, 'startup');

self.addEventListener('install', function () {
  console.log(myName, 'installed');
});

self.addEventListener('activate', function () {
  console.log(myName, 'activated');
});

// data store stuff
var dataStore = {
  name: 'bottle-service',
  storeName: 'fragments',
  html: ''
}

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
  if (isIndexPageRequest(event)) {
    console.log(myName, 'fetch', event.request.url);
  }

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
    case 'clear': {
      dataStore.html = ''
      return;
    },
    case 'refill': {
      dataStore.html = event.data.html
      dataStore.id = event.data.id
    }

    /*
    case 'list': {
      // TODO: would it make more sense to use self-addressed?
      event.source.postMessage({
        cmd: 'list',
        mocks: mocks
      }, '*');
      return;
    }*/

    /*
    default: {
      if (event.data.url) {
        console.log('registering mock response for', event.data.method, 'url', event.data.url);

        // mocks = mocks || {};
        // mocks[event.data.url] = event.data;
      }
    }*/
  }
};

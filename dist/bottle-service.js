/*
  This is ServiceWorker code
*/
/* global self, Response, Promise */
var myName = 'bottle-service';
console.log(myName, 'startup');

var dataStore;

function initDataStore() {
  if (!dataStore) {
    dataStore = {
      name: myName,
      html: '',
      id: ''
    }
  }
}

console.log('data store at start', dataStore)

self.addEventListener('install', function (event) {
  console.log(myName, 'installed');
  initDataStore()
});

self.addEventListener('activate', function () {
  console.log(myName, 'activated');
  initDataStore()
  console.log('data store', dataStore)
});

function isIndexPageRequest(event) {
  return event &&
    event.request &&
    event.request.url === location.origin + '/'
}

self.addEventListener('fetch', function (event) {
  if (!isIndexPageRequest(event)) {
    return fetch(event.request);
  }

  console.log(myName, 'fetching index page', event.request.url);

  event.respondWith(
    fetch(event.request).then(function (response) {
      if (dataStore && dataStore.html && dataStore.id) {
        console.log('fetched latest', response.url, 'need to update')
        console.log('element "%s" with html "%s" ...',
          dataStore.id, dataStore.html.substr(0, 15))
        var copy = response.clone()
        return copy.text().then(function (pageHtml) {
          console.log('inserting our html')
          var toReplace = '<div id="' + dataStore.id + '"></div>'
          var newFragment = '<div id="' + dataStore.id + '">\n'
            + dataStore.html + '\n</div>'
          pageHtml = pageHtml.replace(toReplace, newFragment)

          // console.log('page html')
          // console.log(pageHtml)

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
});

// use window.navigator.serviceWorker.controller.postMessage('hi')
// to communicate with this service worker
self.onmessage = function onMessage(event) {
  console.log('message to bottle-service worker', event.data);

  switch (event.data.cmd) {
    case 'print': {
      console.log('bottle service has id "%s"', dataStore.id)
      console.log(dataStore)
      return;
    }
    case 'clear': {
      dataStore.id = ''
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

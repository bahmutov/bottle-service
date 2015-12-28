'use strict'

/*
  This is ServiceWorker code
*/
/* global self, Response, Promise, location, fetch */
var myName = 'bottle-service'
console.log(myName, 'startup')

function dataStore () {
  var cachesStorage = require('caches-storage')
  return cachesStorage(myName)
}

self.addEventListener('install', function (event) {
  console.log(myName, 'installed')
})

self.addEventListener('activate', function () {
  console.log(myName, 'activated')
})

function isIndexPageRequest (event) {
  return event &&
    event.request &&
    event.request.url === location.origin + '/'
}

self.addEventListener('fetch', function (event) {
  if (!isIndexPageRequest(event)) {
    return fetch(event.request)
  }

  console.log(myName, 'fetching index page', event.request.url)

  event.respondWith(
    fetch(event.request)
      .then(function (response) {
        return dataStore()
          .then(function (store) {
            return store.getItem('contents')
          })
          .then(function (contents) {
            if (contents && contents.html && contents.id) {
              console.log('fetched latest', response.url, 'need to update')
              console.log('element "%s" with html "%s" ...',
                contents.id, contents.html.substr(0, 15))

              var copy = response.clone()
              return copy.text().then(function (pageHtml) {
                console.log('inserting our html')
                // HACK using id in the CLOSING TAG to find fragment
                var toReplaceStart = '<div id="' + contents.id + '">'
                var toReplaceFinish = '</div id="' + contents.id + '">'
                var startIndex = pageHtml.indexOf(toReplaceStart)
                var finishIndex = pageHtml.indexOf(toReplaceFinish)
                if (startIndex !== -1 && finishIndex > startIndex) {
                  console.log('found fragment')
                  pageHtml = pageHtml.substr(0, startIndex + toReplaceStart.length) +
                    '\n' + contents.html + '\n' +
                    pageHtml.substr(finishIndex)
                }

                // console.log('page html')
                // console.log(pageHtml)

                var responseOptions = {
                  status: 200,
                  headers: {
                    'Content-Type': 'text/html charset=UTF-8'
                  }
                }
                return new Response(pageHtml, responseOptions)
              })
            } else {
              return response
            }
          }, function notFound () {
            return response
          })
      })
  )
})

// use window.navigator.serviceWorker.controller.postMessage('hi')
// to communicate with this service worker
self.onmessage = function onMessage (event) {
  console.log('message to bottle-service worker cmd', event.data && event.data.cmd)

  // TODO how to use application name?

  dataStore().then(function (store) {
    switch (event.data.cmd) {
      case 'print': {
        return store.getItem('contents')
          .then(function (res) {
            console.log('bottle service has contents')
            console.log(res)
          })
      }
      case 'clear': {
        console.log('clearing the bottle')
        return store.setItem('contents', {})
      }
      case 'refill': {
        return store.setItem('contents', {
          html: event.data.html,
          id: event.data.id
        }).then(function () {
          console.log('saved new html for id', event.data.id)
        })
      }
      default: {
        console.error(myName, 'unknown command', event.data)
      }
    }
  })
}

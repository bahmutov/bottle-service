/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports) {

	'use strict'

	/*
	  This is ServiceWorker code
	*/
	/* global self, Response, Promise, location, fetch, caches */
	var myName = 'bottle-service'
	console.log(myName, 'startup')

	// Poor man's async "localStorage" on top of Cache
	// https://developer.mozilla.org/en-US/docs/Web/API/Cache
	// TODO factor into separate module
	function dataStore () {
	  return caches.open(myName + '-v1')
	    .then(function (cache) {
	      return {
	        write: function (key, data) {
	          return cache.put(key, new Response(JSON.stringify(data)))
	        },
	        read: function (key) {
	          return cache.match(key)
	            .then(function (res) {
	              return res &&
	                res.text().then(JSON.parse)
	            })
	        }
	      }
	    })
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
	            return store.read('contents')
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
	        return store.read('contents')
	          .then(function (res) {
	            console.log('bottle service has contents')
	            console.log(res)
	          })
	      }
	      case 'clear': {
	        console.log('clearing the bottle')
	        return store.write('contents', {})
	      }
	      case 'refill': {
	        return store.write('contents', {
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


/***/ }
/******/ ]);
!(function startBottleService (root) {
  'use strict'

  if (!root.navigator) {
    console.error('Missing navigator')
    return
  }

  if (!root.navigator.serviceWorker) {
    console.error('Sorry, not ServiceWorker feature, maybe enable it?')
    console.error('http://jakearchibald.com/2014/using-serviceworker-today/')
    return
  }

  // TODO package lazy-ass and check-more-types using webpack

  function toString (x) {
    return typeof x === 'string' ? x : JSON.stringify(x)
  }

  function la (condition) {
    if (!condition) {
      var args = Array.prototype.slice.call(arguments, 1)
        .map(toString)
      throw new Error(args.join(' '))
    }
  }

  function isFunction (f) {
    return typeof f === 'function'
  }

  function getCurrentScriptFolder () {
    var scriptEls = document.getElementsByTagName('script')
    var thisScriptEl = scriptEls[scriptEls.length - 1]
    var scriptPath = thisScriptEl.src
    return scriptPath.substr(0, scriptPath.lastIndexOf('/') + 1)
  }

  var serviceScriptUrl = getCurrentScriptFolder() + 'bottle-service.js'
  var scope = window.location.pathname

  var send = function mockSend () {
    console.error('Bottle service not initialized yet')
  }

  function registeredWorker (registration) {
    la(registration, 'missing service worker registration')
    la(registration.active, 'missing active service worker')
    la(isFunction(registration.active.postMessage),
      'expected function postMessage to communicate with service worker')

    send = registration.active.postMessage.bind(registration.active)
    var info = '\nbottle-service - .\n' +
      'I have a valid service-turtle, use `bottleService` object to update cached page'
    console.log(info)

    registration.active.onmessage = function messageFromServiceWorker (e) {
      console.log('received message from the service worker', e)
    }
  }

  function onError (err) {
    if (err.message.indexOf('missing active') !== -1) {
      // the service worker is installed
      window.location.reload()
    } else {
      console.error('bottle service error', err)
    }
  }

  root.navigator.serviceWorker.register(serviceScriptUrl, { scope: scope })
    .then(registeredWorker)
    .catch(onError)

  root.bottleService = {
    refill: function refill (applicationName, id) {
      console.log('bottle-service: html for app %s element %s', applicationName, id)

      var el = document.getElementById(id)
      la(el, 'could not find element with id', id)
      var html = el.innerHTML.trim()
      send({
        cmd: 'refill',
        html: html,
        name: applicationName,
        id: id
      })
    },
    print: function print (applicationName) {
      send({
        cmd: 'print',
        name: applicationName
      })
    },
    clear: function clear (applicationName) {
      send({
        cmd: 'clear',
        name: applicationName
      })
    }
  }
}(window))

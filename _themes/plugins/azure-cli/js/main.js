"use strict";

var queryMap = (function () {
  var query = window.location.search.substring(1);
  var parameterList = query.split("&");
  var map = {};
  for (var i = 0; i < parameterList.length; i++) {
    var pair = parameterList[i].split("=");
    map[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1]);
  }
  return map;
})();

function getQueryParameter(name) {
  return queryMap[name] || "";
}

var term,
  consoleUri,
  socket,
  termId,
  charWidth,
  charHeight,
  accessToken,
  graphToken,
  keyvaultToken,
  getTokenInterval;

var logger = new Logger(getARMEndpoint());
  
var trustedParentOrigin = getQueryParameter("trustedAuthority");

// used for handling delayed resizing
var rtime;
var timeout = false;
var delta = 200;
var gatewayTimeoutInMin = 10;

var terminalContainer = document.getElementById('terminal-container');

var banner =
  '        /\\ ' + '\n\r' +
  '       /  \\    _____   _ _ __ ___  ' + '\n\r' +
  '      / /\\ \\  |_  / | | | \\\'__/ _ \\ ' + '\n\r' +
  '     / ____ \\  / /| |_| | | |  __/ ' + '\n\r' +
  '    /_/    \\_\\/___|\\__,_|_|  \\___| ' + '\n\r' +
  '' + '\n\r' +
  '    Microsoft Azure: Microsoft\'s Cloud Platform' + '\n\r' +
  '' + '\n\r' +
  '    Hint: type \'az account list\' to start.' + '\r\n\r\n';

if (window.parent !== window) {
  setupParentMessage();
} else {
  $(terminalContainer).html("Sorry, something went wrong.");
}

function setupParentMessage() {
  // --------------------------------------- Security Code ---------------------------------------
  var allowedParentFrameAuthorities = [ "localhost:3000", "localhost:55555", "localhost:9000", 
  "review.docs.microsoft.com", "docs.microsoft.com", "azconsole-df.azurewebsites.net", "portal.azure.com", "rc.portal.azure.com", "ms.portal.azure.com" ];
  var checkTokensInterval;

  function handleToken(evt) {

    function checkTokens() {
      if (graphToken && keyvaultToken)
      {
        window.clearInterval(checkTokensInterval);
        createOrUpdateTerminal();
      }
    }

    var authToken = evt.data.message;

    if (!authToken) {
      console.error("No auth token in event, event: " + JSON.stringify(evt));
      $(terminalContainer).html("Sorry, something went wrong.");
      return;
    }

    switch(evt.data.audience)
    {
      case '':
        accessToken = authToken;
        if(!graphToken || !keyvaultToken)
        {
          checkTokensInterval = checkTokensInterval || window.setInterval(checkTokens, 1000 * 30);
        }

        createOrUpdateTerminal();
        break;
      case 'graph':
        graphToken = authToken;
        break;
      case 'keyvault':
        keyvaultToken = authToken;
        break;
      default:
        console.error("Audience '" + evt.data.audience + "' cannot be handled.");
    }
  }

  var isTrustedOrigin = (function () {
    var trustedAuthority = (trustedParentOrigin.split("//")[1] || "").toLowerCase();

    return allowedParentFrameAuthorities.some(function (origin) {
      // Verify that the requested trusted authority is either an allowed origin or is a
      // subdomain of an allowed origin.
      return origin === trustedAuthority
        || (trustedAuthority.indexOf("." + origin) === trustedAuthority.length - origin.length - 1);
    });
  })();

  if (!isTrustedOrigin) {
    var errorMessage = "The origin '" + trustedParentOrigin + "' is not trusted.";
    console.error(errorMessage);
    throw new Error(errorMessage);
  }

  function postMessageHandler(evt) {
    if (evt.origin !== trustedParentOrigin) {
      return;
    }

    var data = evt.data || {};
    if (data.signature === "portalConsole" && data.type === "postToken") {
      handleToken(evt);
    }
  }

  window.addEventListener("message", postMessageHandler, false);

  getTokens();
}

function createOrUpdateTerminal()
{
  if (term == undefined || term == null) {
    createTerminal();
  }
  else if (term.connected)
  {
    window.setTimeout(keepAlive, 500);
  }
}

function getARMEndpoint() {
  if (getQueryParameter('arm')){
    return getQueryParameter('arm');
  } else {
    return "https://management.azure.com"
  }
}

function createTerminal() {
  while (terminalContainer.children.length) {
    terminalContainer.removeChild(terminalContainer.children[0]);
  }

  term = new Terminal({
    cursorBlink: true
  });

  term.on('resize', function (size) {
    if (!termId) {
      return;
    }

    var method = 'POST';
    var targetUri = consoleUri + '/terminals/' + termId + '/size?cols=' + size.cols + '&rows=' + size.rows;
    var start = new Date();

    $.ajax(targetUri,
      {
        method: method,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': accessToken
        }
      })
      .fail(function(jqXHR, textStatus, errorThrown) {
        logger.clientRequest('ACC.TERMINAL.RESIZE', {}, new Date().getTime() - start.getTime(), method, targetUri, null, null, null, null, jqXHR.status);
      })
      .done(function(data, textStatus, jqXHR){
        logger.clientRequest('ACC.TERMINAL.RESIZE', {}, new Date().getTime() - start.getTime(), method, targetUri, null, null, null, null, jqXHR.status);
      });
  });

  term.open(terminalContainer);
  term.toggleFullscreen(true);
  term.fit();

  provisionConsole();
}

function keepAlive()
{
  var start = new Date();
  var method = 'POST';
  var targetUri = consoleUri + '/keepAlive';

  $.ajax(targetUri,
  {
    method: method,
    contentType: 'application/json',
    headers: {
      'Accept': 'application/json',
      'Authorization': accessToken
    },
    data: JSON.stringify({tokens: [ graphToken, keyvaultToken ].filter(function (element) { return element; })})
  })
  .fail(function(jqXHR, textStatus, errorThrown) {
    logger.clientRequest('ACC.KEEPALIVE', {}, new Date().getTime() - start.getTime(), method, targetUri, null, null, null, null, jqXHR.status);
  })
  .done(function(data, textStatus, jqXHR){
    logger.clientRequest('ACC.KEEPALIVE', {}, new Date().getTime() - start.getTime(), method, targetUri, null, null, null, null, jqXHR.status);
  });

  logger.clientTelemetry('ACC.HEARTBEAT', {}, new Date().getTime() - term.connectTime.getTime());
}

function provisionConsole()
{
  var start = new Date();
  var apiVersion = '2017-01-01-preview';
  var targetUri = getARMEndpoint() + '/providers/Microsoft.Portal/consoles/default?api-version=' + apiVersion;

  provisionConsoleInternal();

  function provisionConsoleInternal(pollingTimeout)
  {
    term.write(pollingTimeout ? "." : "Requesting your cloud console..");

    var method = pollingTimeout ? 'GET' : 'PUT';
    var startInternal = new Date();

    $.ajax(targetUri,
      {
        method: method,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': accessToken
        }
      })
      .fail(function(jqXHR, textStatus, errorThrown) {
        logger.clientRequest('ACC.CONSOLE.'+ method, {}, new Date().getTime() - startInternal.getTime(), method, targetUri, apiVersion, null, jqXHR.getResponseHeader('x-ms-request-id'), null, jqXHR.status);

        handleError(jqXHR, textStatus, errorThrown);
      })
      .done(function (consoleResource, textStatus, jqXHR) {
        if (consoleResource.properties.provisioningState === "Succeeded") {
          logger.clientTelemetry('ACC.CONSOLE.PUT.SUCCESS', {}, new Date().getTime() - start.getTime());

          term.writeln("\x1B[1;32mSucceeded.\x1B[0m ");
          term.writeln('Connecting terminal...\n\r');
          connectTerminal(consoleResource);
        } else if (consoleResource.properties.provisioningState === "Failed") {
          logger.clientTelemetry('ACC.CONSOLE.PUT.FAILURE', {}, new Date().getTime() - start.getTime());

          term.writeln("\x1B[1;31mSorry, your cloud console failed to provision. Please retry later. Request correlation id: " + jqXHR.getResponseHeader('x-ms-routing-request-id') + "\x1B[0m ");
        } else {
          pollingTimeout = pollingTimeout || new Date(new Date().getTime() + 5 * 60 * 1000);
          if (pollingTimeout > new Date()) {
            setTimeout(function() { provisionConsoleInternal(pollingTimeout) }, 1000);
          } else {
            logger.clientTelemetry('ACC.CONSOLE.PUT.TIMEOUT', {}, new Date().getTime() - start.getTime());

            term.writeln("\n\r\x1B[1;31mSorry, your cloud console failed to provision. Please retry later. Request correlation id: " + jqXHR.getResponseHeader('x-ms-routing-request-id') + "\x1B[0m ");
          }
        }
      });
  }
}

function connectTerminal(consoleResource, retryCount)
{
  var initialGeometry = term.proposeGeometry();
  consoleUri = consoleResource.properties.uri;
  
  var method = 'POST';
  var targetUri = consoleUri + '/terminals?cols=' + initialGeometry.cols + '&rows=' + initialGeometry.rows;
  var start = new Date();

  $.ajax(targetUri,
    {
      method: method,
      contentType: 'application/json',
      headers: {
        'Accept': 'application/json',
        'Authorization': accessToken
      },
      data: JSON.stringify({tokens: [ graphToken, keyvaultToken ].filter(function (element) { return element; })})
    })
    .then(function (res, textStatus, jqXHR) {
      logger.clientRequest('ACC.TERMINAL.CONNECT', {}, new Date().getTime() - start.getTime(), method, targetUri, null, null, null, null, jqXHR.status);

      charWidth = Math.ceil(term.element.offsetWidth / initialGeometry.cols);
      charHeight = Math.ceil(term.element.offsetHeight / initialGeometry.rows);

      termId = res.id;

      socket = new WebSocket(res.socketUri);
      socket.onopen = handleSocketOpen;
      socket.onclose = handleSocketClose;
      socket.onerror = handleSocketError;

      if (!term.initialized)
      {
        term.writeln(banner);
      }

      window.onresize = function () {
        rtime = new Date();
        if (timeout === false) {
          timeout = true;
          setTimeout(resizeTerminal, delta);
        }
      }
    })
    .fail(function (jqXHR, textStatus, errorThrown){
      logger.clientRequest('ACC.TERMINAL.CONNECT', {}, new Date().getTime() - start.getTime(), method, targetUri, null, null, null, null, jqXHR.status);

      retryCount = retryCount || 0;
      if (retryCount > 10)
      {
        handleError(jqXHR, textStatus, errorThrown);
      } else {
        setTimeout(function() { connectTerminal(consoleResource, retryCount + 1) }, 1000)
      }
    });
}

function postMessageHelper(type, key, value) {
  if (window.parent !== window) {
    var message = {
      signature: "portalConsole",
      type: type
    }

    if (key) {
      message[key] = value;
    }

    window.parent.postMessage(message, trustedParentOrigin);
  }
}

//var closeButton = document.getElementById("terminal-close");
//closeButton.addEventListener("click", function(evt) {
//  postMessageHelper("close");
//});

function getTokens() {
    postMessageHelper("getToken", "audience", "graph");
    postMessageHelper("getToken", "audience", "keyvault");
    postMessageHelper("getToken", "audience", "");
}

// Requests ARM endpoint.
//postMessageHelper("getArmEndpoint");

function reconnectOnEnterKeydown(evt)
{
  if (evt.keyCode === 13)
  {
    term.attachCustomKeydownHandler(null);
    provisionConsole();
  }

  evt.preventDefault();
  return false;
}

function handleError(jqXHR, textStatus, errorThrown) {
  var errorDetails = 'Unknown Error';
  if (jqXHR.responseJSON)
  {
    errorDetails = JSON.stringify(jqXHR.responseJSON.error);
  }
  
  term.writeln("\x1B[1;31mSorry, something went wrong: " + errorDetails + "\x1B[0m ");
}

function resizeTerminal() {
  if (new Date() - rtime < delta) {
    setTimeout(resizeTerminal, delta);
  } else {
    timeout = false;

    term.toggleFullscreen(true);
    term.fit();
  }
}

function handleSocketOpen() {
  term.attach(socket);
  getTokenInterval = getTokenInterval || window.setInterval(getTokens, 1000 * 60 * 10);
  term.initialized = true;
  term.connected = true;
  term.connectTime = new Date();
  logger.clientTelemetry('ACC.TERMINAL.OPEN', {});
}

function handleSocketClose() {
  logger.clientTelemetry('ACC.TERMINAL.CLOSE', {}, new Date().getTime() - term.connectTime.getTime());
  termId = null;
  logger = new Logger(getARMEndpoint());
  term.connected = false;
  term.connectTime = null;
  term.detach(socket);
  term.writeln("\n\r\x1B[1;31mYour console has been exited or inactive for " + gatewayTimeoutInMin + " minutes and terminated. Press 'Enter' key to reconnect.\x1B[0m ");
  term.attachCustomKeydownHandler(reconnectOnEnterKeydown);
}

function handleSocketError(event) {
  console.error("Socket Error: " + JSON.stringify(event));
}

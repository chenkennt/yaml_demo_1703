var Logger = (function()
{
  function Logger(armEndpoint) {
    this.sessionId = guid();
    this.armEndpoint = armEndpoint;
  }

  function guid() {
    function s4() {
      return Math.floor((1 + Math.random()) * 0x10000)
        .toString(16)
        .substring(1);
    }
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
      s4() + '-' + s4() + s4() + s4();
  }

  function collectTelemetry(armEndpoint, data)
  {
    $.ajax(armEndpoint + '/providers/Internal.Telemetry/collect?api-version=2015-09-30-preview',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': accessToken
        },
        data: JSON.stringify({ events: data } )
      });
  }
  
  Logger.prototype.clientError = function(eventName, eventData, code, message, exception) {
    collectTelemetry(
      this.armEndpoint, 
      [{
        eventType: 'error',
        eventId: this.sessionId,
        eventTimestamp: new Date().toISOString(),
        eventName: eventName,
        eventData: eventData,
        code: code,
        message: message,
        exception: exception ? JSON.stringify(exception) : null
      }]);
  };

  Logger.prototype.clientTrace = function(eventName, eventData, code, message, exception) {
    collectTelemetry(
      this.armEndpoint,
      [{
        eventType: 'trace',
        eventId: this.sessionId,
        eventTimestamp: new Date().toISOString(),
        eventName: eventName,
        eventData: eventData,
        code: code,
        message: message,
        exception: exception ? JSON.stringify(exception) : null
      }]);
  };

  Logger.prototype.clientTelemetry = function(eventName, eventData, durationInMs) {
    collectTelemetry(        
      this.armEndpoint,
      [{
        eventType: 'telemetry',
        eventId: this.sessionId,
        eventTimestamp: new Date().toISOString(),
        eventName: eventName,
        eventData: eventData,
        durationInMilliseconds: durationInMs
      }]);
  };

  Logger.prototype.clientRequest = function(eventName, eventData, durationInMs, httpMethod, targetUri, apiVersion, clientRequestId, serviceRequestId, contentLength, httpStatusCode) {
    collectTelemetry(
      this.armEndpoint,
      [{
        eventType: 'request',
        eventId: this.sessionId,
        eventTimestamp: new Date().toISOString(),
        eventName: eventName,
        eventData: eventData,
        durationInMilliseconds: durationInMs,
        httpMethod: httpMethod,
        targetUri: targetUri,
        apiVersion: apiVersion,
        clientRequestId: clientRequestId,
        serviceRequestId: serviceRequestId,
        contentLength: contentLength,
        httpStatusCode: httpStatusCode
      }]);
  };

  return Logger;
})();
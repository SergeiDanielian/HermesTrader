// file:	W:\WebAPI\Sample\WebAPISampleJS\scripts\webapi.js

/// <summary> Connection variables.</summary>
var websocket;
var WebAPI;
var webApiHandlers = null;

/// <summary> The subscription related storages.</summary>
var resolutionRequests = [];
var subscriptions = [];
var contractsMetadata = [];

/// <summary> Identifier for the request, increments after each request.</summary>
var requestID = 1;

/// <summary> The current session base time.</summary>
var baseTime = null;

/// <summary> Initialises the web API.</summary>
/// <param name="parameter1"> The first parameter.</param>
function initWebApi(handlers) {
    var protobuf = require("ProtoBuf");
    var builder = protobuf.protoFromFile("protocol/webapi_1.proto");
    WebAPI = builder.build("WebAPI_1");

    webApiHandlers = handlers;
}

/// <summary> Resolution request.</summary>
/// <param name="parameter1"> The first parameter.</param>
function ResolutionRequest(symbol) {
    this.symbol = symbol;
    this.fullSymbol = symbol;
    this.requestId = requestID++;
    this.contractId = 0; // 0 if incomplete.
    this.metadata = null;
    this.callbacks = [];
}

/// <summary> Subscriptions the given parameter 1.</summary>
/// <param name="parameter1"> The first parameter.</param>
function Subscription(contractId) {
    this.contractId = contractId;
    this.level = 0;
}

/// <summary> Resolve symbol.</summary>
/// <param name="symbol"> Symbol name.</param>
/// <param name="callback"> Callback function object to call after resolution.</param>
function resolveSymbol(symbol, callback) {
    log('Resolve: ' + symbol);

    var r = null;
    for (var i = 0; i < resolutionRequests.length; ++i) {
        if (resolutionRequests[i].symbol == symbol) {
            r = resolutionRequests[i];
            break;
        }
    }

    if (r && r.contractId != 0) {
        callback(r);
        return;
    }

    if (!r) {
        r = new ResolutionRequest(symbol);
        resolutionRequests.push(r);
    }
    r.callbacks.push(callback);

    if (r.callbacks.length > 1)
        return;

    var request = new WebAPI.SymbolResolutionRequest;
    request.symbol = r.symbol;

    var inf = new WebAPI.InformationRequest;
    inf.id = r.requestId;
    inf.symbol_resolution_request = request;

    var clMsg = new WebAPI.ClientMsg;
    clMsg.information_request = inf;
    sendMessage(clMsg, "Sent: SymbolResolution: " + request.symbol)
}

/// <summary> Gets contract metadata.</summary>
/// <param name="parameter1"> The first parameter.</param>
function getContractMetadata(contractId) {
    var metadata = getOrderContractMetadata(contractId);
    if (!metadata) {
        for (var i = 0; i < resolutionRequests.length; ++i) {
            if (resolutionRequests[i].contractId == contractId) {
                return resolutionRequests[i].metadata;
            }
        }
        return null;
    }
    return metadata;
}

/// <summary> Sends a message.</summary>
/// <param name="message"> The message to send.</param>
function sendMessage(message, logMsg) {
    try {
        var buffer = message.encode();
        websocket.send(buffer.toArrayBuffer());
        log(logMsg);
    }
    catch (ex) {
        log(ex.message);
    }
}

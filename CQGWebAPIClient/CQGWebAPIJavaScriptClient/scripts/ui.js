//file: W:\WebAPI\Sample\WebAPISampleJS\scripts\ui.js

var ui = {};

/// <summary> Initializes the page.</summary>
function initPage() {
    initWebApi({onRealTimeMarketData: onRealTimeMarketDataUpdate});

    ui.symbol = $("#symbol").get(0);
    ui.trade = $("#trade").get(0);
    ui.bid = $("#bid").get(0);
    ui.ask = $("#ask").get(0);
    ui.open = $("#ohlc-o").get(0);
    ui.high = $("#ohlc-h").get(0);
    ui.low = $("#ohlc-l").get(0);
    ui.close = $("#ohlc-c").get(0);
    ui.yesterdaySettlement = $("#yesterday-stlmnt").get(0);
    ui.yesterdayClose = $("#yesterday-cl").get(0);
    ui.indicativeOpen = $("#ind-open").get(0);
    ui.totalVolume = $("#total-vol").get(0);

    ui.domTrade = $("#dom-trade").get(0);
    ui.bid1 = $("#bid1").get(0);
    ui.domPriceBid1 = $("#domPriceBid1").get(0);
    ui.bid2 = $("#bid2").get(0);
    ui.domPriceBid2 = $("#domPriceBid2").get(0);
    ui.bid3 = $("#bid3").get(0);
    ui.domPriceBid3 = $("#domPriceBid3").get(0);
    ui.bid4 = $("#bid4").get(0);
    ui.domPriceBid4 = $("#domPriceBid4").get(0);
    ui.bid5 = $("#bid5").get(0);
    ui.domPriceBid5 = $("#domPriceBid5").get(0);
    ui.ask1 = $("#ask1").get(0);
    ui.domPriceAsk1 = $("#domPriceAsk1").get(0);
    ui.ask2 = $("#ask2").get(0);
    ui.domPriceAsk2 = $("#domPriceAsk2").get(0);
    ui.ask3 = $("#ask3").get(0);
    ui.domPriceAsk3 = $("#domPriceAsk3").get(0);
    ui.ask4 = $("#ask4").get(0);
    ui.domPriceAsk4 = $("#domPriceAsk4").get(0);
    ui.ask5 = $("#ask5").get(0);
    ui.domPriceAsk5 = $("#domPriceAsk5").get(0);

    // Order tab controls
    ui.ordBid1 = $("#ordBid1").get(0);
    ui.ordDomPriceBid1 = $("#ordDomPriceBid1").get(0);
    ui.ordBid2 = $("#ordBid2").get(0);
    ui.ordDomPriceBid2 = $("#ordDomPriceBid2").get(0);
    ui.ordBid3 = $("#ordBid3").get(0);
    ui.ordDomPriceBid3 = $("#ordDomPriceBid3").get(0);
    ui.ordBid4 = $("#ordBid4").get(0);
    ui.ordDomPriceBid4 = $("#ordDomPriceBid4").get(0);
    ui.ordBid5 = $("#ordBid5").get(0);
    ui.ordDomPriceBid5 = $("#ordDomPriceBid5").get(0);
    ui.ordAsk1 = $("#ordAsk1").get(0);
    ui.ordDomPriceAsk1 = $("#ordDomPriceAsk1").get(0);
    ui.ordAsk2 = $("#ordAsk2").get(0);
    ui.ordDomPriceAsk2 = $("#ordDomPriceAsk2").get(0);
    ui.ordAsk3 = $("#ordAsk3").get(0);
    ui.ordDomPriceAsk3 = $("#ordDomPriceAsk3").get(0);
    ui.ordAsk4 = $("#ordAsk4").get(0);
    ui.ordDomPriceAsk4 = $("#ordDomPriceAsk4").get(0);
    ui.ordAsk5 = $("#ordAsk5").get(0);
    ui.ordDomPriceAsk5 = $("#ordDomPriceAsk5").get(0);

    $("#logoff").get(0).disabled = true;
    $("#logon").get(0).disabled = false;
    $("#changePW").get(0).disabled = true;
}

/// <summary> Logs.</summary>
/// <param name="msg"> The msg to log.</param>
function log(msg) {
    $('#log > tbody:last').append(
        '<tr>' +
        '<td>' + (new Date).toLocaleTimeString() + '</td>' +
        '<td>' + msg + '</td>' +
        '</tr>');
    var tbox = $('#log-div').get(0);
    tbox.scrollTop = tbox.scrollHeight;
}

/// <summary> Protobuf init function.</summary>
require(["ProtoBuf"], function (ProtoBufInit) {
    var body = $("#body").get(0);
    if ('WebSocket' in window) {
        if ('ArrayBuffer' in window) {
            initPage();
        } else {
            body.innerHTML = "ArrayBuffer is not supported";
        }
    } else {
        body.innerHTML = "WebSockets are not supported";
    }
});

/// <summary> Executes the URL select action.</summary>
function onUrlSelect() {
    $('#url').val($('#url-select').val());
}

/// <summary> Clears the log.</summary>
function clearLog() {
    $('#log > tbody').find('tr').remove();
}

// file:	W:\WebAPI\Sample\WebAPISampleJS\scripts\timeAndSales.js

/// <summary> Requests time and sales.</summary>
function requestTimeAndSales() {
    var symbol = $('#ts-symbol').val();
    var from = getTimeField('ts-time-from');
    var to = getTimeField('ts-time-to');
    var level = $('#ts-level').val();

    resolveSymbol(symbol, function (resolution) {
        var params = new WebAPI.TimeAndSalesParameters;
        params.contract_id = resolution.contractId;
        chartTSMetadata = resolution.metadata;
        params.level = level;
        params.from_utc_time = timeToProto(from);
        if (to != null)
            params.to_utc_time = timeToProto(to);

        var request = new WebAPI.TimeAndSalesRequest;
        request.request_id = requestID++;
        request.time_and_sales_parameters = params;

        var clMsg = new WebAPI.ClientMsg;
        clMsg.time_and_sales_request = request;
        var logMsg = 'Sent: TimeAndSalesRequest for contract ' + resolution.contractId +
            ' from ' + from.toLocaleString() + ' to ' + to.toLocaleString() +
            ' level ' + params.level;
        sendMessage(clMsg, logMsg);
    });
}


/// <summary> Process the time and sales report.</summary>
/// <param name="message"> Report message.</param>
function processTimeAndSalesReport(message) {
    log("TimeAndSalesReport: " +
    "status: " + message.result_code +
    ", complete: " + message.is_report_complete +
    ", text_message: " + message.text_message +
    ", quotes: " + message.quote.length +
    ", up_to_utc_time: " + message.up_to_utc_time);

    if (message.quote.length > 0)
        log("Quote: " +
        "time: " + timeFromProto(message.quote[0].quote_utc_time).toLocaleString() +
        ", type: " + quoteTypeToString(message.quote[0].type) +
        ", price: " + getCorrectPrice(chartTSMetadata.contract_id, message.quote[0].price) +
        ", volume: " + message.quote[0].volume);

    if (message.is_report_complete) {
        log("Request complete");
    }
}


/// <summary> Initializes the time and sale period controls in view page.</summary>
function initializeTimeAndSalePeriod() {
    var from = new Date();
    from.setHours(from.getHours() - 1);
    $('#ts-time-from').val(from.toLocaleString());
    $('#ts-time-to').val(new Date().toLocaleString());
}

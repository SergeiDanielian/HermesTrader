// file:	W:\WebAPI\Sample\WebAPISampleJS\scripts\timeBars.js

// Charting helper variables
var chart = null;
var chartData = [];
var chartMetadata = null;
var chartIsIntraday = false;
var chartRequestId = null;
var chartVisible = false;

/// <summary> Helper method that request time bars.</summary>
/// <param name="contractId"> Contract id.</param>
/// <param name="interval"> Requesting interval.</param>
/// <param name="unit"> Desired unit between bars.</param>
/// <param name="from"> Report start date.</param>
/// <param name="to"> Report end date.</param>
/// <param name="subscribe"> Subscribtion flag.</param>
function requestTimeBarsHelper(contractId, interval, units, from, to, subscribe) {
    log('Send: TimeBarRequest for contract ' + contractId +
    ' from ' + (from ? from.toLocaleString() : '(null)') +
    ' to ' + (to ? to.toLocaleString() : '(null)') +
    ' with interval ' + interval);

    var params = new WebAPI.TimeBarParameters;
    params.contract_id = contractId;
    params.bar_unit = interval;
    if (interval >= 7)
        params.units_number = units;
    if (from)
        params.from_utc_time = timeToProto(from);
    if (to)
        params.to_utc_time = timeToProto(to);

    var request = new WebAPI.TimeBarRequest;
    request.request_id = requestID++;
    request.time_bar_parameters = params;
    if (subscribe)
        request.request_type = WebAPI.TimeBarRequest.RequestType.SUBSCRIBE;

    var clMsg = new WebAPI.ClientMsg;
    clMsg.time_bar_request = request;
    sendMessage(clMsg, "Send TimeBarRequest")
    return request.request_id;
}

/// <summary> Request time bars.</summary>
/// <param name="subscribe"> Subscription flag.</param>
function requestTimeBars(subscribe) {
    var symbol = $('#time-bars-symbol').val();
    var interval = parseInt($('#time-bars-interval').val());
    var units = parseInt($('#time-bars-units').val());
    var from = parseDate($('#time-bars-from').val());
    var to = parseDate($('#time-bars-to').val());

    resolveSymbol(symbol, function (resolution) {
        chartMetadata = resolution.metadata;
        chartData = [];
        chartIsIntraday = interval >= 7;
        chartRequestId = requestTimeBarsHelper(resolution.contractId, interval, units, from, to, subscribe);
    });
}

/// <summary> Process the time bar report.</summary>
/// <param name="message"> The report message.</param>
function processTimeBarReport(message) {
    log("TimeBarReport: " +
    "status: " + message.status_code +
    ", complete: " + message.is_report_complete +
    ", text_message: " + message.text_message);

    var lastTradeDate = null;

    for (var i = 0; i < message.time_bar.length; ++i) {
        var bar = message.time_bar[i];
        var time = timeFromProto(bar.bar_utc_time);
        var tradeDate = timeFromProto(bar.trade_date);
        if (!tradeDate)
            tradeDate = lastTradeDate;
        lastTradeDate = tradeDate;

        if (bar.open_price)
            bar.open_price = getCorrectPrice(chartMetadata.contract_id, bar.open_price);
        if (bar.high_price)
            bar.high_price = getCorrectPrice(chartMetadata.contract_id, bar.high_price);
        if (bar.low_price)
            bar.low_price = getCorrectPrice(chartMetadata.contract_id, bar.low_price);
        if (bar.close_price)
            bar.close_price = getCorrectPrice(chartMetadata.contract_id, bar.close_price);

        log("TimeBar: " +
        "time: " + time.toLocaleString() +
        ", O: " + bar.open_price +
        ", H: " + bar.high_price +
        ", L: " + bar.low_price +
        ", C: " + bar.close_price +
        ", Vol: " + bar.volume +
        ", TradeDate: " + (tradeDate ? tradeDate.toLocaleString() : "(null)") +
        ", ComVol: " + bar.commodity_volume +
        ", OI: " + bar.open_interest +
        ", ComOI: " + bar.commodity_open_interest);

        var chartTime = chartIsIntraday ? time : tradeDate;

        var point = [chartTime.getTime(),
            bar.open_price,
            bar.high_price,
            bar.low_price,
            bar.close_price];

        chartData.push(point);

        if (chartVisible)
            chart.series[0].addPoint(point, false, true);
    }

    if (chartVisible)
        chart.redraw();

    if (message.is_report_complete) {
        log("Request complete");
    }
}

/// <summary> Cancels time bars request.</summary>
function cancelTimeBars() {
    log('Cancel TimeBarRequest ' + chartRequestId);

    var request = new WebAPI.TimeBarRequest;
    request.request_id = chartRequestId;
    request.request_type = WebAPI.TimeBarRequest.RequestType.DROP;

    var clMsg = new WebAPI.ClientMsg;
    clMsg.time_bar_request = request;
    sendMessage(clMsg, "Send cancel TimeBarRequest")
}

/// <summary> Time bars chart click.</summary>
/// <param name="sender"> The sender object.</param>
function timeBarsShowChartClick(sender) {
    chartVisible = sender.checked;
    if (chartVisible)
        showChart();
    else
        $('#bar-chart').hide();
}

/// <summary> Shows the chart.</summary>
function showChart() {
    log("Sorting data");
    chartData.sort(function (a, b) {
        return a[0] - b[0];
    });

    $('#bar-chart').show();

    // create the chart
    $('#bar-chart').highcharts('StockChart', {

        rangeSelector: {
            selected: 2
        },

        title: {
            text: 'Time Bars'
        },

        series: [{
            type: 'ohlc',
            name: 'Time Bars',
            data: chartData,
            dataGrouping: {
                units: [[
                    'minute', // unit name
                    [1, 5, 15, 30, 60] // allowed multiples
                ], [
                    'day', // unit name
                    [1] // allowed multiples
                ], [
                    'week', // unit name
                    [1] // allowed multiples
                ], [
                    'month',
                    [1, 2, 3, 4, 6]
                ]]
            }
        }]
    });

    chart = $('#bar-chart').highcharts();
}

/// <summary> Executes the time bars period change action.</summary>
function onTimeBarsPeriodChange() {
    var period = parseInt($('#time-bars-period').val());
    var from = new Date();
    from.setHours(from.getHours() - period);
    $('#time-bars-from').val(from.toLocaleString());
    $('#time-bars-to').val('');
}
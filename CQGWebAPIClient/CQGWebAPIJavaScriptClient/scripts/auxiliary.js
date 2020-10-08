// file:	W:\WebAPI\Sample\WebAPISampleJS\scripts\auxiliary.js

/// <summary> Gets the clean quotes containers.</summary>
function cleanQuotes(contract) {
    contract.bestBid = null;
    contract.bestAsk = null;
    contract.trade = null;
    contract.values = [];
    contract.bids = [];
    contract.asks = [];
    contract.values.open_price = null;
    contract.values.high_price = null;
    contract.values.low_price = null;
    contract.values.close_price = null;
    contract.values.yesterday_settlement = null;
    contract.values.yesterday_close = null;
    contract.values.indicative_open = null;
    contract.values.total_volume = null;
}

/// <summary> Gets a metadata.</summary>
/// <param name="parameter1"> The first parameter.</param>
function getMetadata(contractId) {
    for (var i = 0; i < resolutionRequests.length; ++i) {
        if (resolutionRequests[i].contractId == contractId) {
            return resolutionRequests[i];
        }
    }
    return null;
}

/// <summary> Gets order contract metadata.</summary>
/// <note> These contract metadata are collected from orders before any instrument subscription.</note>
/// <param name="contractId"> Contract id.</param>
function getOrderContractMetadata(contractId) {
    for (var i = 0; i < resolutionRequests.length; ++i) {
        var metadata = contractsMetadata[i];
        if (metadata && metadata.contract_id == contractId) {
            return contractsMetadata[i];
        }
    }
}

/// <summary>Converts time to proto time.</summary>
/// <param name="time"> Time to  convert.</param>
function timeToProto(time) {
    return time.getTime() - baseTime.getTime();
}

/// <summary>Converts time from proto time.</summary>
/// <param name="time"> Time to  convert.</param>
function timeFromProto(protoTime) {
    if (!protoTime)
        return null;
    return new Date(baseTime.getTime() + Math.ceil(protoTime));
}

/// <summary> Quote type to string.</summary>
/// <param name="type"> Quote type to convert.</param>
function quoteTypeToString(type) {
    switch (type) {
        case WebAPI.Quote.Type.BESTBID:
            return "BBID";
        case WebAPI.Quote.Type.BESTASK:
            return "BASK";
        case WebAPI.Quote.Type.TRADE:
            return "TRADE";
        case WebAPI.Quote.Type.SETTLEMENT:
            return "STTL";
        case WebAPI.Quote.Type.BID:
            return "BID";
        case WebAPI.Quote.Type.ASK:
            return "ASK";
    }
    return "Unknown";
}

/// <summary> Quote to string.</summary>
/// <param name="quote"> Quote to construct string.</param>
function quoteToString(quote) {
    if (!quote)
        return "";
    return quoteTypeToString(quote.type) + " " + getCorrectPrice(rt_currentSymbolContractId, quote.price) + " : " + quote.volume;
}

/// <summary> Session time to string.</summary>
/// <param name="time"> Time to convert.</param>
function sessionTimeToString(time) {
    return time ? time.toUTCString() : "null";
}

/// <summary> Session offset to string.</summary>
/// <param name="offset"> Offset.</param>
function sessionOffsetToString(offset) {
    var now = new Date();
    var time = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    time.setTime(Math.floor(time.getTime()) + Math.floor(offset));
    return time.toLocaleString();
}

/// <summary> Session day to string.</summary>
/// <param name="day"> Day to convert.</param>
function sessionDayToString(day) {
    var s = "";
    var dows = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    for (var i = 0; i < day.day_of_week.length; ++i)
        s += dows[day.day_of_week[i]] + ', ';
    s += ", pre_open_offset: " + sessionOffsetToString(day.pre_open_offset);
    s += ", open_offset: " + sessionOffsetToString(day.open_offset);
    s += ", close_offset: " + sessionOffsetToString(day.close_offset);
    s += ", post_close_offset: " + sessionOffsetToString(day.post_close_offset);
    return s;
}

/// <summary> Session holiday to string.</summary>
/// <param name="day"> Day to convert.</param>
function sessionHolidayToString(day) {
    return day.holiday_name + ': ' + sessionTimeToString(timeFromProto(day.holiday_date));
}

/// <summary> Inserts the quotes update.</summary>
/// <param name="element"> The first parameter.</param>
/// <param name="arr"> The second parameter.</param>
function insertQuotesUpdate(element, arr) {
    for (var i = 0; i < arr.length; i++) {
        var level = arr[i];
        if (parseInt(level.price) == parseInt(element.price)) {
            if (element.volume != 0)
                arr[i] = element;
            else
                arr.splice(i, 1);
            return;
        }
    }
    if (element.volume == 0)
        return;
    arr.push(element);
    arr.sort(function (a, b) {
        return a.price - b.price;
    });
}

/// <summary> Gets correct price.</summary>
/// <param name="contractId"> Contract id.</param>
/// <param name="price"> Price to convert.</param>
/// <returns> The corrected price.</returns>
function getCorrectPrice(contractId, price) {
    if(price == null)
        return null;
    var metadata = getContractMetadata(contractId);
    var tickStr = metadata.tick_size.toString().split('.');
    var precision = tickStr[1].length;
    var correctPrice = (metadata.correct_price_scale * price).toFixed(precision);
    return correctPrice;
}

/// <summary> Gets raw price.</summary>
/// <param name="contractId"> Contract id.</param>
/// <param name="price"> Price to convert.</param>
/// <returns> The raw price.</returns>
function getRawPrice(contractId, price) {
    if(price == "" ){
        return "";
    }

    var orderMetadata = getContractMetadata(contractId, orderMetadata);
    return price / orderMetadata.correct_price_scale;
}

/// <summary> Gets date time field.</summary>
/// <param name="id"> Control's identifier.</param>
/// <returns> The time field.</returns>
function getTimeField(id) {
    var s = $('#' + id).val();
    return s ? new Date(Date.parse(s)) : null;
}

/// <summary> Gets time field.</summary>
/// <param name="id"> Control's identifier.</param>
/// <returns> The time.</returns>
function getTimeFieldExact(id) {
    var s = $('#' + id).val();
    var dateParts = s.split(":");
    var time = new Date(Date.now());
    time.setHours(parseInt(dateParts[0]));
    time.setMinutes(parseInt(dateParts[1]));
    time.setSeconds(0);
    return dateParts.length == 2 ? time : null;
}

/// <summary> Gets index by text from selector.</summary>
/// <param name="value"> Option text to search.</param>
/// <param name="selector"> Selector where needs to search.</param>
/// <returns> The index of the option with the given value if exists and -1 otherwise.</returns>
function getIndexByTextFromSelector(value, selector) {
    for (var i = 0; i < selector.options.length; ++i) {
        if (selector.options[i].text == value) {
            return i;
        }
    }
    return -1;
}

/// <summary> Adds a new option to the given selector.</summary>
/// <param name="selector"> Selector where to add.</param>
/// <param name="optionText"> Option text to add.</param>
/// <param name="optionValue"> Option value to add.</param>
function addNewOptionToSelector(selector, optionText, optionValue) {
    if (($.grep(selector.get(0).options, function (e) {
            return e.value == optionValue;
        }).length) != 0) {
        return;
    }
    selector.append(new Option(optionText, optionValue));
}

/// <summary> Clean selector.</summary>
/// <param name="selector"> Selector to clean.</param>
function cleanSelector(selector) {
    while (selector.options.length > 0) {
        selector.options[0] = null;
    }
}

/// <summary> Searches given value in given selector for the text .</summary>
/// <param name="selector"> Selector.</param>
/// <param name="optionValue"> Value to search.</param>
/// <returns> The found selector text by value.</returns>
function findSelectorTextByValue(selector, optionValue) {
    var ret = ($.grep(selector.get(0).options, function (e) {
        if (e.value == optionValue) return e.text;
    }));

    return ret[0].text;
}

/// <summary> Adds a contract metadata from order.</summary>
/// <param name="orderStatus"> Order status to get contract metadata.</param>
function addContractMetadataFromOrder(orderStatus) {
    if (orderStatus.contract_metadata.length > 0) {
        resolutionRequests[resolutionRequests.length] = orderStatus.contract_metadata[0];
    }
}

/// <summary> Gets symbol name from order.</summary>
/// <param name="orderStatus"> Order status.</param>
/// <returns> The symbol name from order.</returns>
function getSymbolNameFromOrder(orderStatus) {
    var metadata = getMetadata(orderStatus.order.contract_id);
    if (metadata) {
        return metadata.fullSymbol;
    }

    if (orderStatus.contract_metadata.length > 0) {
        for (var i = 0; i < orderStatus.contract_metadata.length; ++i) {
            contractsMetadata.push(orderStatus.contract_metadata[i]);
        }
        return orderStatus.contract_metadata[0].contract_symbol;
    } else {
        return getOrderContractMetadata(orderStatus.order.contract_id).contract_symbol;
    }
}

/// <summary> Convert order side to string.</summary>
/// <param name="side"> Side to convert.</param>
/// <returns>String representation.</returns>
function orderSideToString(side) {
    if (side == WebAPI.Order.Side.BUY) {
        return "BUY";
    }
    return "SELL";
}

/// <summary> Converts order type to string.</summary>
/// <param name="type"> Order type to convert.</param>
/// <returns>String representation.</returns>
function orderTypeToString(type) {
    switch (type) {
        case WebAPI.Order.OrderType.MKT:
            return "MKT";
        case WebAPI.Order.OrderType.LMT:
            return "LMT";
        case WebAPI.Order.OrderType.STP:
            return "STP";
        case WebAPI.Order.OrderType.STL:
            return "STL";
    }
    return "";
}

/// <summary> Converts order type index from string.</summary>
/// <param name="type"> Order type string representation to convert.</param>
/// <returns>Appropriate index.</returns>
function orderTypeIndexFromString(type) {
    switch (type) {
        case "MKT":
            return 0;
        case "LMT":
            return 1;
        case "STP":
            return 2;
        case "STL":
            return 3;
    }
    return 0;
}

/// <summary> Converts order duration type to string.</summary>
/// <param name="duration"> Duration to convert.</param>
/// <returns>String representation.</returns>
function durationTypeToString(duration) {
    switch (duration) {
        case WebAPI.Order.Duration.DAY:
            return "DAY";
        case WebAPI.Order.Duration.GTC:
            return "GTC";
        case WebAPI.Order.Duration.GTD:
            return "GTD";
        case WebAPI.Order.Duration.GTT:
            return "GTT";
        case WebAPI.Order.Duration.FAK:
            return "FAK";
        case WebAPI.Order.Duration.FOK:
            return "FOK";
        case WebAPI.Order.Duration.ATO:
            return "ATO";
        case WebAPI.Order.Duration.ATC:
            return "ATC"
    }
    return "";
}

/// <summary> Converts order status to string.</summary>
/// <param name="status"> Status.</param>
/// <returns>String representation.</returns>
function orderStatusToString(status) {
    switch (status) {
        case WebAPI.OrderStatus.Status.IN_TRANSIT:
            return "IN_TRANSIT";
        case WebAPI.OrderStatus.Status.REJECTED:
            return "REJECTED";
        case WebAPI.OrderStatus.Status.WORKING:
            return "WORKING";
        case WebAPI.OrderStatus.Status.EXPIRED:
            return "EXPIRED";
        case WebAPI.OrderStatus.Status.IN_CANCEL:
            return "IN_CANCEL";
        case WebAPI.OrderStatus.Status.IN_MODIFY:
            return "IN_MODIFY";
        case WebAPI.OrderStatus.Status.CANCELLED:
            return "CANCELLED";
        case WebAPI.OrderStatus.Status.FILLED:
            return "FILLED";
        case  WebAPI.OrderStatus.Status.SUSPENDED:
            return "SUSPENDED";
        case WebAPI.OrderStatus.Status.DISCONNECTED:
            return "DISCONNECTED";
        case WebAPI.OrderStatus.Status.ACTIVEAT:
            return "ACTIVEAT";
    }
    return "";
}

/// <summary> Converts order execute instruction to string.</summary>
/// <param name="instruction"> Instruction.</param>
/// <returns> String representation.</returns>
function orderExecInstructionToString(instruction) {
    switch (instruction) {
        case WebAPI.Order.ExecInstruction.AON:
            return "AON";
        case WebAPI.Order.ExecInstruction.ICEBERG:
            return "ICEBERG";
        case WebAPI.Order.ExecInstruction.QT:
            return "QT";
        case WebAPI.Order.ExecInstruction.TRAIL:
            return "TRAIL";
        case WebAPI.Order.ExecInstruction.FUNARI:
            return "FUNARI";
        case WebAPI.Order.ExecInstruction.MIT:
            return "MIT";
        case WebAPI.Order.ExecInstruction.MLM:
            return "MLM";
    }
    return "";
}

function orderTrailingPegToString(peg) {
    switch (peg) {
        case WebAPI.Order.TrailingPeg.BESTBID:
            return "BESTBID";
        case WebAPI.Order.TrailingPeg.BESTASK:
            return "BESTASK";
        case WebAPI.Order.TrailingPeg.LASTTRADE:
            return "LASTTRADE";
        default:
            return "";
    }
}

/// <summary> Converts order execute instruction enum value from string.</summary>
/// <param name="str"> String to convert.</param>
/// <returns>Appropriate WebAPI.Order.ExecInstruction value.</returns>
function orderExecInstructionFromString(str) {
    switch (str) {
        case "AON":
            return WebAPI.Order.ExecInstruction.AON;
        case "ICEBERG":
            return WebAPI.Order.ExecInstruction.ICEBERG;
        case "QT":
            return WebAPI.Order.ExecInstruction.QT
        case "TRAIL":
            return WebAPI.Order.ExecInstruction.TRAIL;
        case "FUNARI":
            return WebAPI.Order.ExecInstruction.FUNARI;
        case "MIT":
            return WebAPI.Order.ExecInstruction.MIT;
        case "MLM":
            return WebAPI.Order.ExecInstruction.MLM;
    }
    return 0;
}

/// <summary> Fill begining zero in time part string(hours, minutes seconds) if needs (5:6:3 => 05:06:03).</summary>
/// <param name="timePart"> The first parameter.</param>
function fillBeginingZero(timePart) {
    if (timePart < 10) {
        return "0" + timePart;
    }
    return timePart;
}

/// <summary> Format time to hhmmss string.</summary>
/// <param name="time"> Time object to format.</param>
/// <returns> The formatted time to hhmmss string.</returns>
function formatTimeToHHMMSSString(time) {
    return fillBeginingZero(time.getHours()) + ":" + fillBeginingZero(time.getMinutes()) + ":" + fillBeginingZero(time.getSeconds());
}

function formatTimeToShortDateTime(time) {
    return time.toDateString() + ' ' + fillBeginingZero(time.getHours()) + ":" + fillBeginingZero(time.getMinutes()) + ":" + fillBeginingZero(time.getSeconds());
}

/// <summary> The orders table columns enum.</summary>
var OrdersTableEnum = {
    OrderId: {name: "OrderId", value: 0},
    Account: {name: "Account", value: 1},
    Side: {name: "Side", value: 2},
    Qty: {name: "Qty", value: 3},
    Instrument: {name: "Instrument", value: 4},
    Type: {name: "Type", value: 5},
    LmtPrice: {name: "LmtPrice", value: 6},
    StpPrice: {name: "StpPrice", value: 7},
    FillPrice: {name: "FillPrice", value: 8},
    Duration: {name: "Duration", value: 9},
    Status: {name: "Status", value: 10},
    GTD: {name: "GTD", value: 11},
    GTT: {name: "GTT", value: 12},
    PlaceTime: {name: "PlaceTime", value: 13},
    ExecInstraction: {name: "ExecInstraction", value: 14},
    VisibleQty: {name: "VisibleQty", value: 15},
    MinVisibleQty: {name: "MinVisibleQty", value: 16},
    TrailingOffset: {name: "TrailingOffset", value: 17},
    TrailingPeg: {name: "TrailingPeg", value: 18},
    TriggerQty: {name: "TriggerQty", value: 19}
};
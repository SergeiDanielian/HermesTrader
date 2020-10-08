// file:	W:\WebAPI\Sample\WebAPISampleJS\scripts\realTime.js

/// <summary> The current contract properties helper var.</summary>
var contract = {
    bestBid: null,
    bestAsk: null,
    trade: null,
    values: {},
    bids: [],
    asks: []
};


/// <summary> The quotes logging flag.</summary>
var logQuotes = false;

/// <summary> Identifier for the current symbol contract.</summary>
var rt_currentSymbolContractId = null;

/// <summary> The right current subscription level.</summary>
var rt_currentSubscriptionLevel = null;

/// <summary> Clears quotes boxes.</summary>
function clearRTQuotes() {
    ui.bid.textContent = "";
    ui.ask.textContent = "";
    ui.open.textContent = "";
    ui.high.textContent = "";
    ui.low.textContent = "";
    ui.close.textContent = "";
    ui.yesterdaySettlement.textContent = "";
    ui.yesterdayClose.textContent = "";
    ui.totalVolume.textContent = "";
}

/// <summary> Clears trade box.</summary>
function clearRTTrade() {
    ui.trade.textContent = "";
}

/// <summary> Clears real time dom table.</summary>
function clearRTDOM() {
    showDomRow(ui.domPriceBid1, ui.bid1, 0, null, "Grey", null);
    showDomRow(ui.domPriceBid2, ui.bid2, 0, null, "Grey", null);
    showDomRow(ui.domPriceBid3, ui.bid3, 0, null, "Grey", null);
    showDomRow(ui.domPriceBid4, ui.bid4, 0, null, "Grey", null);
    showDomRow(ui.domPriceBid5, ui.bid5, 0, null, "Grey", null);
    showDomRow(ui.domPriceAsk1, ui.ask1, 0, null, "Grey", null);
    showDomRow(ui.domPriceAsk2, ui.ask2, 0, null, "Grey", null);
    showDomRow(ui.domPriceAsk3, ui.ask3, 0, null, "Grey", null);
    showDomRow(ui.domPriceAsk4, ui.ask4, 0, null, "Grey", null);
    showDomRow(ui.domPriceAsk5, ui.ask5, 0, null, "Grey", null);
}

/// <summary> Clears the dom and quotes depending to given level.</summary>
/// <param name="level"> New level.</param>
function clearDOMAndQuotes(level) {
    if (level < 4) {
        clearRTDOM();
        clearOrdersDOM();
    }
    if (level < 2) {

        clearRTQuotes();
    }
    if (level < 1) {
        clearRTTrade();
    }
}

/// <summary> Process the market data subscription status.</summary>
/// <param name="result"> The subscription status result.</param>
function processMarketDataSubscriptionStatus(result) {
    log("MarketDataSubscriptionStatus: contract_id: " + result.contract_id +
    ", status_code: " + result.status_code +
    ", text_message: " + result.text_message);
    clearDOMAndQuotes(result.level);
}

/// <summary> Process the real time market updates.</summary>
/// <param name="result"> The updated result.</param>
function processRealTimeMarketData(result) {
    if (result.is_snapshot) {
        log("Snapshot: contractId: " + result.contract_id);
        for (var i = 0; i < result.quote.length; ++i) {
            var q = result.quote[i];
            log(quoteToString(q));
        }
        var values = result.market_values;
        if (values) {
            log("O: " + values.open_price + ", H: " +  getCorrectPrice(rt_currentSymbolContractId, values.high_price) +
            ", L: " + getCorrectPrice(rt_currentSymbolContractId, values.low_price) + ", C: " + getCorrectPrice(rt_currentSymbolContractId, values.close_price) +
            ", yesterday_settlement: " + getCorrectPrice(rt_currentSymbolContractId, values.yesterday_settlement) +
            ", yesterday_close: " + getCorrectPrice(rt_currentSymbolContractId, values.yesterday_close) +
            ", total_volume: " + values.total_volume);
        }
        contract.bestBid = null;
        contract.bestAsk = null;
        contract.trade = null;
        contract.bids = [];
        contract.asks = [];
    }
    if (result.market_values != null){
        contract.values = result.market_values;
    }
    if (result.contract_id != rt_currentSymbolContractId) {
        return;
    }
    var quote = result.quote;
    for (var i = 0; i < quote.length; i++) {
        var qt = quote[i];
        if (logQuotes)
            log(quoteToString(qt));
        var indicators = qt.session_ohlc_indicator;
        if (indicators) {
            for (var j = 0; j < indicators.length; j++) {
                if (contract.values) {
                    var ind = indicators[j];
                    if (ind == WebAPI.Quote.SessionOhlcIndicator.OPEN)
                        contract.values.open_price = qt.price;
                    else if (ind == WebAPI.Quote.SessionOhlcIndicator.HIGH)
                        contract.values.high_price = qt.price;
                    else if (ind == WebAPI.Quote.SessionOhlcIndicator.LOW)
                        contract.values.low_price = qt.price;
                    else if (ind == WebAPI.Quote.SessionOhlcIndicator.CLOSE)
                        contract.values.close_price = qt.price;
                }
            }
        }
        if (qt.type == WebAPI.Quote.Type.BESTBID)
            contract.bestBid = qt.volume != 0 ? qt : null;
        else if (qt.type == WebAPI.Quote.Type.BESTASK)
            contract.bestAsk = qt.volume != 0 ? qt : null;
        else if (qt.type == WebAPI.Quote.Type.TRADE) {
            if(qt.volume != 0 ) {
                contract.trade = qt;
                if(!result.is_snapshot) {
                    contract.values.total_volume = parseInt(qt.volume) + parseInt(contract.values.total_volume);
                }
            }
            else{
                contract.trade = null;
            }
        }
        if (qt.type == WebAPI.Quote.Type.BID)
            insertQuotesUpdate(qt, contract.bids);
        else if (qt.type == WebAPI.Quote.Type.ASK)
            insertQuotesUpdate(qt, contract.asks);
    }
    if (webApiHandlers.onRealTimeMarketData)
        webApiHandlers.onRealTimeMarketData();
}

/// <summary> Executes the instrument subscribe button clicked action.</summary>
function onInstrumentSubscribeBtnClicked() {
    var inst = $("#rtInstrumentInput").get(0).value.toUpperCase();
    if (!inst) {
        alert("Instrument can not be empty");
        return;
    }
    var level = $("#requestType").get(0).value;
    unsubscribe(rt_currentSymbolContractId);
    cleanQuotes(contract);
    resolveSymbol(inst, function (resolution) {
        setSubscription(resolution.contractId, level);
    });
    rt_currentSubscriptionLevel = level;
}

/// <summary> Executes the instrument subscription level changed action.</summary>
/// <param name="selector"> Sender selector.</param>
function onInstrumentSubscriptionLevelChanged(selector) {
    //TODO You can add processing if you need
}

/// <summary> Executes the real time market data update action.</summary>
function onRealTimeMarketDataUpdate() {
    if (rt_currentSubscriptionLevel > 0) {
        ui.trade.textContent = quoteToString(contract.trade);
    }
    if ((rt_currentSubscriptionLevel > 1)) {
        ui.bid.textContent = (contract.bestBid) ? quoteToString(contract.bestBid) : "";
        ui.ask.textContent = (contract.bestAsk) ? quoteToString(contract.bestAsk) : "";
        if (contract.values) {
            ui.open.textContent = (contract.values.open_price) ? getCorrectPrice(rt_currentSymbolContractId, contract.values.open_price) : "";
            ui.high.textContent = (contract.values.high_price) ? getCorrectPrice(rt_currentSymbolContractId, contract.values.high_price) : "";
            ui.low.textContent = (contract.values.low_price) ? getCorrectPrice(rt_currentSymbolContractId, contract.values.low_price) : "";
            ui.close.textContent = (contract.values.close_price) ? getCorrectPrice(rt_currentSymbolContractId, contract.values.close_price) : "";
            ui.yesterdaySettlement.textContent = (contract.values.yesterday_settlement) ? getCorrectPrice(rt_currentSymbolContractId, contract.values.yesterday_settlement) : "";
            ui.yesterdayClose.textContent = (contract.values.yesterday_close) ? getCorrectPrice(rt_currentSymbolContractId, contract.values.yesterday_close) : "";
            ui.indicativeOpen.textContent = (contract.values.indicative_open) ? getCorrectPrice(rt_currentSymbolContractId, contract.values.indicative_open) : "";
            ui.totalVolume.textContent = (contract.values.total_volume) ? contract.values.total_volume : "";
        }
    }
    if (rt_currentSubscriptionLevel > 3) {
        if (contract.bids.length > 0) {
            try {
                var n = contract.bids.length;
                showDomRow(ui.domPriceBid1, ui.bid1, n - 1, contract.bids, "Green", rt_currentSymbolContractId);
                showDomRow(ui.domPriceBid2, ui.bid2, n - 2, contract.bids, "Green", rt_currentSymbolContractId);
                showDomRow(ui.domPriceBid3, ui.bid3, n - 3, contract.bids, "Green", rt_currentSymbolContractId);
                showDomRow(ui.domPriceBid4, ui.bid4, n - 4, contract.bids, "Green", rt_currentSymbolContractId);
                showDomRow(ui.domPriceBid5, ui.bid5, n - 5, contract.bids, "Green", rt_currentSymbolContractId);
                //Order tab DOM update
                showDomRow(ui.ordDomPriceBid1, ui.ordBid1, n - 1, contract.bids, "Green", rt_currentSymbolContractId);
                showDomRow(ui.ordDomPriceBid2, ui.ordBid2, n - 2, contract.bids, "Green", rt_currentSymbolContractId);
                showDomRow(ui.ordDomPriceBid3, ui.ordBid3, n - 3, contract.bids, "Green", rt_currentSymbolContractId);
                showDomRow(ui.ordDomPriceBid4, ui.ordBid4, n - 4, contract.bids, "Green", rt_currentSymbolContractId);
                showDomRow(ui.ordDomPriceBid5, ui.ordBid5, n - 5, contract.bids, "Green", rt_currentSymbolContractId);

            } catch (ex) {
            }
        }
        if (contract.asks.length > 0) {
            try {
                showDomRow(ui.domPriceAsk1, ui.ask1, 0, contract.asks, "Red", rt_currentSymbolContractId);
                showDomRow(ui.domPriceAsk2, ui.ask2, 1, contract.asks, "Red", rt_currentSymbolContractId);
                showDomRow(ui.domPriceAsk3, ui.ask3, 2, contract.asks, "Red", rt_currentSymbolContractId);
                showDomRow(ui.domPriceAsk4, ui.ask4, 3, contract.asks, "Red", rt_currentSymbolContractId);
                showDomRow(ui.domPriceAsk5, ui.ask5, 4, contract.asks, "Red", rt_currentSymbolContractId);
                //Order tab DOM update
                showDomRow(ui.ordDomPriceAsk1, ui.ordAsk1, 0, contract.asks, "Red", rt_currentSymbolContractId);
                showDomRow(ui.ordDomPriceAsk2, ui.ordAsk2, 1, contract.asks, "Red", rt_currentSymbolContractId);
                showDomRow(ui.ordDomPriceAsk3, ui.ordAsk3, 2, contract.asks, "Red", rt_currentSymbolContractId);
                showDomRow(ui.ordDomPriceAsk4, ui.ordAsk4, 3, contract.asks, "Red", rt_currentSymbolContractId);
                showDomRow(ui.ordDomPriceAsk5, ui.ordAsk5, 4, contract.asks, "Red", rt_currentSymbolContractId);
            } catch (ex) {
            }
        }
    }
}

/// <summary> Executes the right log quotes click action.</summary>
function onRtLogQuotesClick() {
    var checkbox = $('#rt-log-quotes').get(0);
    logQuotes = checkbox.checked;
}

/// <summary> Symbol item clicked in symbols list.</summary>
/// <param name="item"> The first parameter.</param>
function rtSymbolsItemClicked(item) {
    $("#rtInstrumentInput").get(0).value = item.innerText;
}

/// <summary> Shows the dom row.</summary>
/// <param name="cellPrice"> The first parameter.</param>
/// <param name="cellVol"> The second parameter.</param>
/// <param name="index"> The third parameter.</param>
/// <param name="quotes"> The fourth parameter.</param>
/// <param name="color"> The fifth parameter.</param>
/// <param name="contractId"> The parameter 6.</param>
function showDomRow(cellPrice, cellVol, index, quotes, color, contractId) {
    cellPrice.textContent = quotes ? getCorrectPrice(contractId, quotes[index].price) : "";
    cellVol.textContent = quotes ? quotes[index].volume : "";
    cellVol.style.backgroundColor = color;
}

/// <summary> Sets a subscription.</summary>
/// <param name="contractId"> Contract id to subscribe.</param>
/// <param name="level"> Subscription level.</param>
function setSubscription(contractId, level) {
    var s = null;
    for (var i = 0; i < subscriptions.length; ++i) {
        if (subscriptions[i].contractId == contractId) {
            s = subscriptions[i];
            break;
        }
    }
    if (rt_currentSymbolContractId != contractId || rt_currentSubscriptionLevel != level) {
        subscribe(contractId, level);
        clearDOMAndQuotes(0);
        rt_currentSubscriptionLevel = level;
        rt_currentSymbolContractId = contractId;
    }
    if (!s) {
        s = new Subscription(contractId);
        subscriptions.push(s);
    }
    var metadata = (level) ? getMetadata(rt_currentSymbolContractId) : level;
    ui.symbol.textContent = metadata.fullSymbol;
}

/// <summary> Subscribes to contract.</summary>
/// <param name="contractId"> Contract id to subscribe.</param>
/// <param name="level"> Subscription level.</param>
function subscribe(contractId, level) {
    var subs = new WebAPI.MarketDataSubscription;
    subs.contract_id = contractId;
    subs.level = level;
    var clMsg = new WebAPI.ClientMsg;
    clMsg.market_data_subscription = subs;
    sendMessage(clMsg, "Sent: Subscribe: " + contractId + ", level: " + level);
}

/// <summary> Unsubscribes the given parameter 1.</summary>
/// <param name="contractId"> Contract id.</param>
function unsubscribe(contractId) {
    if (contractId == null) {
        return;
    }
    var subs = new WebAPI.MarketDataSubscription;
    subs.contract_id = contractId;
    subs.level = WebAPI.MarketDataSubscription.Level.NONE;
    var clMsg = new WebAPI.ClientMsg;
    clMsg.market_data_subscription = subs;
    sendMessage(clMsg, "Sent: Unsubscribe: " + contractId);
    rt_currentSubscriptionLevel = WebAPI.MarketDataSubscription.Level.NONE;
    rt_currentSymbolContractId = null;
}

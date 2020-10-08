// file:	W:\WebAPI\Sample\WebAPISampleJS\scripts\orders.js

/// <summary> State of the order modify.</summary>
var orderModifyState = false;

/// <summary> The orders.</summary>
var orders = new Map();

/// <summary> Identifier for the current selected order chain.</summary>
var currentSelectedOrderChainId = null;

/// <summary> Subscribes to trade subscription.</summary>
function tradeSubscription() {
    var request = new WebAPI.TradeSubscription;
    request.id = 1;
    request.subscription_scope = 2; // net positions
    request.publication_type = 4; // all auth accounts
    request.subscribe = true;

    var clMsg = new WebAPI.ClientMsg;
    clMsg.trade_subscription = request;
    sendMessage(clMsg, "Sent: TradeSubscription");
}

/// <summary> Order type changed.</summary>
/// <param name="typeSelector"> Sender selector.</param>
function orderTypeChanged(typeSelector) {
    var orderTypeSelector = $("#orderType").get(0);
    var execInstr = $("#execInstruction").get(0);
    var duration = $("#duration").get(0);
    var orderTypeStr = orderTypeSelector.options[orderTypeSelector.selectedIndex].innerText;

    var isLMTSelected = orderTypeStr == "LMT";
    var isMKTSelected = orderTypeStr == "MKT";
    var isSTPSelected = orderTypeStr == "STP";
    var isSTLSelected = orderTypeStr == "STL";

    execInstr.disabled = orderModifyState || isMKTSelected;

    //duration.disabled = !orderModifyState;

    $("#limitPrice").get(0).disabled = !(isLMTSelected || isSTLSelected);
    $("#stopPrice").get(0).disabled = !(isSTPSelected || isSTLSelected);

    $("#activationTime").get(0).disabled = !orderModifyState || isMKTSelected;
    $("#suspensionTime").get(0).disabled = !orderModifyState || isMKTSelected;

    var validList = ["DAY", "GTC", "GTD", "GTT", "FAK", "FOK", "ATO", "ATC"];

    if (isSTPSelected || isSTLSelected) {
        validList = ["DAY", "GTC", "FAK", "FOK", "GTD"];
    }
    else if (isMKTSelected) {
        validList = ["DAY", "GTC", "GTD", "FAK", "FOK", "ATO", "ATC"];
    }
    enableSelectorItems(validList, $("#duration").get(0));
    validateExecInstruction();
}

/// <summary> Validate execute instruction based on values of of the inputs on the order page.</summary>
function validateExecInstruction() {
    var orderTypeSelector = $("#orderType").get(0);
    var selectedOrderTypeStr = orderTypeSelector.options[orderTypeSelector.selectedIndex].innerText;

    if (selectedOrderTypeStr == "LMT") {
        validateExecInstructionForLMT();
    }
    else if (selectedOrderTypeStr == "STP" || selectedOrderTypeStr == "STL") {
        validateExecInstructionForSTPSTL();
    } else {
        $("#execInstruction").get(0).selectedIndex = 0;
    }
}

/// <summary> Validates execute instruction for "LMT" order type.</summary>
function validateExecInstructionForLMT() {
    var duration = $("#duration").get(0);
    var durationTypeStr = duration.options[duration.selectedIndex].innerText;
    var execInstrSelector = $("#execInstruction").get(0);
    var validList = ["AON", "ICEBERG", "TRAIL", "FUNARI", "MIT", "None"];
    var goodTill = $("#goodTill").get(0);
    goodTill.disabled = true;
    if (durationTypeStr == "GTC" || durationTypeStr == "GTD") {
        validList = ["AON", "ICEBERG", "MIT", "None"];
        goodTill.disabled = false;
    }
    else if (durationTypeStr == "ATO" || durationTypeStr == "ATC") {
        validList = ["None"];
    }
    else if (durationTypeStr == "FAK" || durationTypeStr == "FOK") {
        validList = ["ICEBERG", "MIT", "None"];
    }

    enableSelectorItems(validList, execInstrSelector);
}

/// <summary> Validates execute instruction for "STP" and "STL order type.</summary>
function validateExecInstructionForSTPSTL() {
    var execInstrSelector = $("#execInstruction").get(0);
    var validList = ["QT", "TRAIL", "None"];

    enableSelectorItems(validList, execInstrSelector);
}

/// <summary> Enables the selector's valid items which are given.</summary>
/// <param name="validValuesRange"> Valid values range for the given selector.</param>
/// <param name="selector"> Selector to validate.</param>
function enableSelectorItems(validValuesRange, selector) {
    for (var i = 0; i < selector.options.length; ++i) {
        if (($.grep(validValuesRange, function (e) {
                return e == selector.options[i].innerText;
            }).length) != 0) {
            selector[i].style.color = "Black";
            selector[i].disabled = false;
        } else {
            selector[i].style.color = "LightGrey";
            selector[i].disabled = true;
        }
    }
    var selectedStr = selector[selector.selectedIndex].innerText;
    if (($.grep(validValuesRange, function (e) {
            return e == selectedStr;
        }).length) == 0) {
        selector.selectedIndex = 0;
        // we should call this functions to update controls
        // as programmaticality change selector's value not cause change event
        executionInstructionChanged(null);
        orderDurationChanged(null);
    }
}

/// <summary> Execution instruction changed.</summary>
/// <param name="patternSelector"> Sender selector.</param>
function executionInstructionChanged(patternSelector) {
    validateExecInstruction();
    var execInstr = $("#execInstruction").get(0);
    var execInstrStr = execInstr.options[execInstr.selectedIndex].innerText;

    var enableIcebergControls = execInstrStr != "ICEBERG";
    $("#visibleQty").get(0).disabled = enableIcebergControls;
    $("#minVisibleQty").get(0).disabled = enableIcebergControls;

    var enableTrailControls = execInstrStr != "TRAIL";
    $("#trailOffset").get(0).disabled = enableTrailControls;
    $("#trailingPeg").get(0).disabled = enableTrailControls;

    var enableQTControls = execInstrStr != "QT";
    $("#triggerQty").get(0).disabled = enableQTControls;
}

/// <summary> Order duration changed.</summary>
/// <param name="durationSelector"> Sender selector.</param>
function orderDurationChanged(durationSelector) {
    validateExecInstruction();
    var duration = $("#duration").get(0);
    var durationTypeStr = duration.options[duration.selectedIndex].innerText;
    var goodTill = $("#goodTill").get(0);
    goodTill.disabled = true;
    goodTill.disabled = !(durationTypeStr == "GTT" || durationTypeStr == "GTD");
}

/// <summary> New order button clicked.</summary>
function newOrderBtnClicked() {
    orderModifyState = false;
    $("#orderAccounts").get(0).disabled = false;
    $("#orderInstruments").get(0).disabled = false;
    $("#qty").get(0).disabled = false;
    $("#orderType").get(0).disabled = false;
    $("#duration").get(0).disabled = false;
    orderTypeChanged();
    executionInstructionChanged();
    orderDurationChanged();
    $("#orderModifyBtn").get(0).disabled = true;
    $("#orderCancelBtn").get(0).disabled = true;
    updatePlaceButtons(true);
    $("#orderToModifyId").get(0).value = "";
}

/// <summary> Enables the order controls for the ordermodifing.</summary>
function enableOrderControlsForModify() {
    $("#orderAccounts").get(0).disabled = true;
    $("#orderInstruments").get(0).disabled = true;
    $("#qty").get(0).disabled = false;
    $("#orderType").get(0).disabled = true;
    $("#duration").get(0).disabled = false;
    orderTypeChanged();
    executionInstructionChanged();
    orderDurationChanged();
    $("#orderModifyBtn").get(0).disabled = false;
    $("#orderCancelBtn").get(0).disabled = false;
    updatePlaceButtons(false);
}

/// <summary> Updates buy and sell buttons state depends on given flag.</summary>
/// <param name="isNeworder"> Flag to inform about new/placed order state.</param>
function updatePlaceButtons(isNeworder) {
    var buyBtn = $("#orderBuy").get(0);
    buyBtn.disabled = !isNeworder;
    buyBtn.style.color = isNeworder ? "green" : "grey";
    var sellBtn = $("#orderSell").get(0);
    sellBtn.disabled = !isNeworder;
    sellBtn.style.color = isNeworder ? "red" : "grey";
}

/// <summary> Place buy order with the selected parameters in order page.</summary>
function buy() {
    log("Buy:");
    $("#side").get(0).value = "Buy";
    placeOrder(WebAPI.Order.Side.BUY)
}

/// <summary> Place sell order with the selected parameters in order page.</summary>
function sell() {
    log("Sell:");
    $("#side").get(0).value = "Sell";
    placeOrder(WebAPI.Order.Side.SELL)
}

/// <summary> Collect order properties for the order modifying.</summary>
/// <param name="order"> Order for which properties needs to be collected.</param>
function collectOrderPropertiesToModify(order) {
    var qty, duration;

    var instrSelector = $("#orderInstruments").get(0);
    var contractId = instrSelector.options[instrSelector.selectedIndex].value;
    if (!contractId) {
        alert("Instrument can not be empty");
        return;
    }
    // Read order inputs
    qty = $("#qty").get(0).value;
    if(qty != null && qty <= 0) {
        alert("Order quantity should be greater than 0");
        return;
    }
    order.qty = qty;
    order.when_utc_time = timeToProto(new Date());
    var execInstruction = $("#execInstruction").get(0).value;
    switch (parseInt(execInstruction)) {
        case WebAPI.Order.ExecInstruction.ICEBERG:
            order.visible_qty = $("#visibleQty").get(0).value;
            if(order.min_visible_qty != null) {
                order.min_visible_qty = $("#minVisibleQty").get(0).value;
            }
            break;
        case WebAPI.Order.ExecInstruction.TRAIL:
            return;
        case WebAPI.Order.ExecInstruction.QT:
            order.trigger_qty = $("#triggerQty").get(0).value;
            break;
    }
    var goodTill = getTimeField("goodTill");
    order.duration = $("#duration").get(0).value;
    if(order.duration == WebAPI.Order.Duration.GTD) {
        order.good_thru_date = timeToProto(goodTill);
    } else if(order.duration == WebAPI.Order.Duration.GTT) {
        order.good_thru_utc_time = timeToProto(goodTill);
    }

    var order_type = $("#orderType").get(0).value;
    if (order_type == WebAPI.Order.OrderType.LMT || order_type == WebAPI.Order.OrderType.STL) {
        order.limit_price = getRawPrice(contractId, $("#limitPrice").get(0).value);
    }
    if (order_type == WebAPI.Order.OrderType.STP || order_type == WebAPI.Order.OrderType.STL) {
        order.stop_price = getRawPrice(contractId, $("#stopPrice").get(0).value);
    }
}


/// <summary> Collect order properties for the order placing.</summary>
/// <param name="order"> Order for which properties needs to be collected.</param>
function collectOrderProperties(order) {
    var qty, execInstruction, duration, account, limitPrice, stopPrice, visibleQty,
        minVisibleQty, trailOffset, trailingPeg, triggerQty, activationTime, suspensionTime, goodTill;

    var instrSelector = $("#orderInstruments").get(0);
    var contractId = instrSelector.options[instrSelector.selectedIndex].value;
    if (!contractId) {
        alert("Instrument can not be empty");
        return;
    }

    // Read order inputs
    order.qty = $("#qty").get(0).value;
    order.order_type = $("#orderType").get(0).value;
    order.contract_id = contractId;
    order.duration = $("#duration").get(0).value;
    order.account_id = $("#orderAccounts").get(0).value;
    order.is_manual = true;
    order.cl_order_id = "CQGWebAPI_" + new Date().getTime();

    goodTill = getTimeField("goodTill");
    if(order.duration == WebAPI.Order.Duration.GTD) {
        order.good_thru_date = timeToProto(goodTill);
    } else if(order.duration == WebAPI.Order.Duration.GTT) {
        order.good_thru_utc_time = timeToProto(goodTill);
    }

    execInstruction = $("#execInstruction").get(0).value;
    if (execInstruction != 0) {
        var instr = [execInstruction];
        order.exec_instruction = instr;
    }
    switch (parseInt(execInstruction)) {
        case WebAPI.Order.ExecInstruction.ICEBERG:
            order.visible_qty = $("#visibleQty").get(0).value;
            order.min_visible_qty = $("#minVisibleQty").get(0).value;
            break;
        case WebAPI.Order.ExecInstruction.TRAIL:
            order.trail_offset = parseInt($("#trailOffset").get(0).value);
            order.trailing_peg = parseInt($("#trailingPeg").get(0).value);
            break;
        case WebAPI.Order.ExecInstruction.QT:
            order.trigger_qty = $("#triggerQty").get(0).value;
            break;
    }
    if (order.order_type == WebAPI.Order.OrderType.LMT || order.order_type == WebAPI.Order.OrderType.STL) {
        limitPrice = getRawPrice(contractId, $("#limitPrice").get(0).value);
        if (limitPrice != "")
            order.limit_price = limitPrice;
    }
    if (order.order_type == WebAPI.Order.OrderType.STP || order.order_type == WebAPI.Order.OrderType.STL) {
        stopPrice = getRawPrice(contractId, $("#stopPrice").get(0).value);
        if(stopPrice != "")
            order.stop_price = stopPrice;
    }

    activationTime = getTimeField("activationTime");
    suspensionTime = getTimeField("suspensionTime");

    // NOTE this code is dead as the appropriate controls are hidden 
    // I hope sometime we will use it that is why it isn't removed
    if(activationTime != null) {
        order.activation_utc_time = timeToProto(activationTime);
    }
    if (suspensionTime != null) {
        order.suspension_utc_time = timeToProto(suspensionTime);
    }
    order.when_utc_time = timeToProto(new Date());
}

/// <summary> Place the order.</summary>
/// <param name="side"> The placed order side.</param>
function placeOrder(side) {
    var inst = $("#orderInstruments").get(0).options[$("#orderInstruments").get(0).selectedIndex].text;

    // Create request
    var clMsg = new WebAPI.ClientMsg;
    var request = new WebAPI.OrderRequest;
    request.request_id = requestID++;
    var newOrder = new WebAPI.NewOrder;
    var order = new WebAPI.Order;
    request.request_id = requestID++;

    collectOrderProperties(order);
    order.side = side;

    newOrder.order = order;
    newOrder.suspended = false;
    request.new_order = newOrder;
    clMsg.order_request = request;
    sendMessage(clMsg, "Sent: NewOrder:" + ((side == WebAPI.Order.Side.SELL) ? "Sell" : "Buy") + inst + " : " + order.qty);
}

/// <summary> Cancels the current selected order.</summary>
function cancelOrder() {
    if (currentSelectedOrderChainId == null) {
        return;
    }
    var currentOrderStatus = orders[currentSelectedOrderChainId];

    var clMsg = new WebAPI.ClientMsg;
    var request = new WebAPI.OrderRequest;
    var cancelOrder = new WebAPI.CancelOrder;

    cancelOrder.account_id = currentOrderStatus.account_id;
    cancelOrder.order_id = currentOrderStatus.order_id;
    cancelOrder.orig_cl_order_id = currentOrderStatus.order.cl_order_id;
    cancelOrder.cl_order_id = "CQGWebAPI_" + new Date().getTime();
    cancelOrder.when_utc_time = timeToProto(new Date());

    request.cancel_order = cancelOrder;
    request.request_id = requestID++;
    clMsg.order_request = request;
    var instrSelector = $("#orderInstruments").get(0);
    var inst = instrSelector.options[instrSelector.selectedIndex].value;

    sendMessage(clMsg, "Sent: Cancel Order:" + ((cancelOrder.side == WebAPI.Order.Side.SELL) ? "Sell" : "Buy") + inst + ' : ' + cancelOrder.qty);
}

/// <summary> Modifies the selected order.</summary>
function modifyOrder() {

    if (currentSelectedOrderChainId == null) {
        return;
    }
    var currentOrderStatus = orders[currentSelectedOrderChainId];
    var modifyOrder = new WebAPI.ModifyOrder;

    modifyOrder.cl_order_id = "CQGWebAPI_" + new Date().getTime();
    modifyOrder.order_id = currentOrderStatus.order_id;
    modifyOrder.account_id = currentOrderStatus.account_id;
    modifyOrder.orig_cl_order_id = currentOrderStatus.order.cl_order_id;

    collectOrderPropertiesToModify(modifyOrder);

    var clMsg = new WebAPI.ClientMsg;
    var request = new WebAPI.OrderRequest;
    request.request_id = requestID++;

    request.modify_order = modifyOrder;
    clMsg.order_request = request;
    sendMessage(clMsg, "Sent: Modify:" + ((modifyOrder == WebAPI.Order.Side.SELL) ? "Sell" : "Buy"));
}

/// <summary> Process the trade subscription status.</summary>
/// <param name="msg"> The subscription status.</param>
function processTradeSubscriptionStatus(msg) {
    log("TradeSubscriptionStatus: id: " + msg.id +
    ", result_code: " + msg.status_code +
    ", text_message:" + msg.text_message);
}

/// <summary> Process the order status change.</summary>
/// <param name="orderStatus"> The order new status.</param>
function processOrderStatusChange(orderStatus) {
    if (orderStatus.transaction_status.length > 0) {
        log("Order num: " + orderStatus.order.cl_order_id + " Status: " + orderStatusToString(orderStatus.status));
        if (orderStatus.status == WebAPI.OrderStatus.Status.REJECTED) {
            log("Rejection reason: " + orderStatus.transaction_status[0].text_message);
        }
        orders[orderStatus.chain_order_id] = orderStatus;
        showOrder(orderStatus);
    }
}

/// <summary> Process the order request rejection.</summary>
/// <param name="msg"> The rejection message.</param>
function processOrderRequestReject(msg) {
    log("OrderReject: rejectCode: " + msg.reject_code +
    ", message: " + msg.text_message);
}

/// <summary> Order dom price clicked.</summary>
/// <param name="priceBox"> Sender box.</param>
function orderDomPriceClicked(priceBox) {
    var orderTypeSelector = $("#orderType").get(0);
    var orderTypeStr = orderTypeSelector.options[orderTypeSelector.selectedIndex].innerText;

    $("#limitPrice").get(0).value = (orderTypeStr == "LMT" || orderTypeStr == "STL") ? priceBox.innerText : "";
    $("#stopPrice").get(0).value = (orderTypeStr == "STP" || orderTypeStr == "STL") ? priceBox.innerText : "";
}

/// <summary> Shows the order by adding it into orders table.</summary>
/// <param name="orderStatus"> Order status object to be shown.</param>
function showOrder(orderStatus) {
    var order = orderStatus.order;
    var table = $('#ordersTable').get(0);
    var orderRow = document.getElementById(orderStatus.chain_order_id);
    if (orderRow) {
        orderRow.cells[OrdersTableEnum.OrderId.value].innerText = order.cl_order_id;
        var fcmAccountId = findSelectorTextByValue($("#orderAccounts"), orderStatus.account_id);
        orderRow.cells[OrdersTableEnum.Account.value].innerText = fcmAccountId;

        orderRow.cells[OrdersTableEnum.Side.value].innerText = orderSideToString(order.side);
        orderRow.cells[OrdersTableEnum.Qty.value].innerText = order.qty;
        orderRow.cells[OrdersTableEnum.Type.value].innerText = orderTypeToString(order.order_type);
        orderRow.cells[OrdersTableEnum.LmtPrice.value].innerText = getCorrectPrice(order.contract_id, order.limit_price);
        orderRow.cells[OrdersTableEnum.StpPrice.value].innerText = getCorrectPrice(order.contract_id, order.stop_price);
        if(orderStatus.fill_cnt > 0) {
            orderRow.cells[OrdersTableEnum.FillPrice.value].innerText = getCorrectPrice(order.contract_id, orderStatus.avg_fill_price);
        }
        orderRow.cells[OrdersTableEnum.Duration.value].innerText = durationTypeToString(order.duration);
        orderRow.cells[OrdersTableEnum.Status.value].innerText = orderStatusToString(orderStatus.status);
        orderRow.cells[OrdersTableEnum.GTD.value].innerText = (order.good_thru_date ? timeFromProto(order.good_thru_date).toDateString() : "");
        orderRow.cells[OrdersTableEnum.GTT.value].innerText = (order.good_thru_utc_time ? formatTimeToShortDateTime(timeFromProto(order.good_thru_utc_time)) : "");
        orderRow.cells[OrdersTableEnum.PlaceTime.value].innerText = formatTimeToHHMMSSString(timeFromProto(orderStatus.submission_utc_time));
        orderRow.cells[OrdersTableEnum.ExecInstraction.value].innerText = orderExecInstructionToString(order.exec_instruction[0]);
        orderRow.cells[OrdersTableEnum.VisibleQty.value].innerText = (order.visible_qty) ? order.visible_qty : "";
        orderRow.cells[OrdersTableEnum.MinVisibleQty.value].innerText = (order.min_visible_qty) ? order.min_visible_qty : "";
        orderRow.cells[OrdersTableEnum.TrailingOffset.value].innerText = (order.trail_offset) ? order.trail_offset : "";
        orderRow.cells[OrdersTableEnum.TrailingPeg.value].innerText = (order.trailing_peg) ? orderTrailingPegToString(order.trailing_peg) : "";
        orderRow.cells[OrdersTableEnum.TriggerQty.value].innerText = (order.trigger_qty) ? order.trigger_qty : "";
    } else {
        var row = table.insertRow(1);
        var cell = row.insertCell(OrdersTableEnum.OrderId.value);
        row.onclick = function () {
            orderClicked(row);
        };

        if (order) {
            addContractMetadataFromOrder(orderStatus);
            var instrumentName = getSymbolNameFromOrder(orderStatus);
            if (order.contract_id) {
                resolveSymbol(instrumentName, function () {
                    setSubscription(order.contract_id, WebAPI.MarketDataSubscription.Level.TRADES_BBA_DOM);
                });
                $("#orderInstruments").get(0).disabled = false;
            }
            var fcmAccountId = findSelectorTextByValue($("#orderAccounts"), orderStatus.account_id);
            addNewOptionToSelector($("#orderInstruments"), instrumentName, order.contract_id);
            addNewOptionToSelector($("#accountFilter"), fcmAccountId, orderStatus.account_id);
            addNewOptionToSelector($("#instrumentFilter"), instrumentName, instrumentName);
            row.setAttribute("id", orderStatus.chain_order_id);
            cell.innerText = order.cl_order_id;
            cell.width = cell.innerText.length * 5;

            row.insertCell(OrdersTableEnum.Account.value).innerText = fcmAccountId;
            row.insertCell(OrdersTableEnum.Side.value).innerText = orderSideToString(order.side);
            row.insertCell(OrdersTableEnum.Qty.value).innerText = order.qty;
            row.insertCell(OrdersTableEnum.Instrument.value).innerText = instrumentName;
            row.insertCell(OrdersTableEnum.Type.value).innerText = orderTypeToString(order.order_type);
            row.insertCell(OrdersTableEnum.LmtPrice.value).innerText = getCorrectPrice(order.contract_id, order.limit_price);
            row.insertCell(OrdersTableEnum.StpPrice.value).innerText = getCorrectPrice(order.contract_id, order.stop_price);
            row.insertCell(OrdersTableEnum.FillPrice.value).innerText =
                getCorrectPrice(order.contract_id, (orderStatus.fill_cnt > 0) ? orderStatus.avg_fill_price : null);
            row.insertCell(OrdersTableEnum.Duration.value).innerText = durationTypeToString(order.duration);
            row.insertCell(OrdersTableEnum.Status.value).innerText = orderStatusToString(orderStatus.status);
            row.insertCell(OrdersTableEnum.GTD.value).innerText = (order.good_thru_date ? timeFromProto(order.good_thru_date).toDateString() : "");
            row.insertCell(OrdersTableEnum.GTT.value).innerText = (order.good_thru_utc_time ? formatTimeToShortDateTime(timeFromProto(order.good_thru_utc_time)) : "");
            row.insertCell(OrdersTableEnum.PlaceTime.value).innerText = formatTimeToHHMMSSString(timeFromProto(orderStatus.submission_utc_time));
            row.insertCell(OrdersTableEnum.ExecInstraction.value).innerText = orderExecInstructionToString(order.exec_instruction[0]);
            row.insertCell(OrdersTableEnum.VisibleQty.value).innerText = (order.visible_qty) ? order.visible_qty : "";
            row.insertCell(OrdersTableEnum.MinVisibleQty.value).innerText = (order.min_visible_qty) ? order.min_visible_qty : "";
            row.insertCell(OrdersTableEnum.TrailingOffset.value).innerText = (order.trail_offset) ? order.trail_offset : "";
            row.insertCell(OrdersTableEnum.TrailingPeg.value).innerText = (order.trailing_peg) ? orderTrailingPegToString(order.trailing_peg) : "";
            row.insertCell(OrdersTableEnum.TriggerQty.value).innerText = (order.trigger_qty) ? order.trigger_qty : "";
            if (order.side == WebAPI.Order.Side.BUY) {
                row.className = "orderGreen";
            } else {
                row.className = "orderRed";
            }
        }
    }

    //Scroll up
    $("#ordTableDiv").get(0).scrollTop = 0;

    // Enables filters
    if (orders) {
        $("#statusFilter").get(0).disabled = false;
        $("#accountFilter").get(0).disabled = false;
        $("#accountFilter").get(0).disabled = false;
        $("#sideFilter").get(0).disabled = false;
        $("#instrumentFilter").get(0).disabled = false;
        $("#typeFilter").get(0).disabled = false;
        $("#durationFilter").get(0).disabled = false;
        $("#statusFilter").get(0).disabled = false;
        $("#instructionFilter").get(0).disabled = false;
    }
    filterOrdersTable();
}

/// <summary> Is order state final.</summary>
/// <param name="statusStr"> Status to check.</param>
function isOrderStateFinal(statusStr) {
    return (statusStr == "FILLED" || statusStr == "REJECTED" ||
    statusStr == "DISCONNECTED" || statusStr == "EXPIRED" ||
    statusStr == "CANCELLED" || statusStr == "IN_CANCEL");
}

/// <summary> Order clicked.</summary>
/// <param name="row"> Clicked row object.</param>
function orderClicked(row) {
    var canNotBeCanceledOrModified = isOrderStateFinal(row.cells[OrdersTableEnum.Status.value].innerText);
    if (!canNotBeCanceledOrModified) {
        var modifyOrderId = $("#orderToModifyId").get(0);
        orderModifyState = true;
        modifyOrderId.value = row.cells[OrdersTableEnum.OrderId.value].innerText;

        $("#qty").get(0).value = row.cells[OrdersTableEnum.Qty.value].innerText;
        $("#orderType").get(0).selectedIndex = orderTypeIndexFromString(row.cells[OrdersTableEnum.Type.value].innerText);
        $("#execInstruction").get(0).selectedIndex = orderExecInstructionFromString(row.cells[OrdersTableEnum.ExecInstraction.value].innerText);

        var durationSelector = $("#duration").get(0);
        var index = getIndexByTextFromSelector(row.cells[OrdersTableEnum.Duration.value].innerText, durationSelector);
        durationSelector.selectedIndex = index;

        var accountSelector = $("#orderAccounts").get(0);
        index = getIndexByTextFromSelector(row.cells[OrdersTableEnum.Account.value].innerText, accountSelector);
        accountSelector.selectedIndex = index;

        var pegSelector = $("#trailingPeg").get(0);
        index = getIndexByTextFromSelector(row.cells[OrdersTableEnum.TrailingPeg.value].innerText, pegSelector);
        pegSelector.selectedIndex = index;
        $("#trailOffset").get(0).value = row.cells[OrdersTableEnum.TrailingOffset.value].innerText;
        $("#visibleQty").get(0).value = row.cells[OrdersTableEnum.VisibleQty.value].innerText;
        $("#minVisibleQty").get(0).value = row.cells[OrdersTableEnum.MinVisibleQty.value].innerText;
        $("#triggerQty").get(0).value = row.cells[OrdersTableEnum.TriggerQty.value].innerText;
        $("#limitPrice").get(0).value = row.cells[OrdersTableEnum.LmtPrice.value].innerText;
        $("#stopPrice").get(0).value = row.cells[OrdersTableEnum.StpPrice.value].innerText;

        var activationTime = getTimeField("activationTime");
        var suspensionTime = getTimeField("suspensionTime");

        currentSelectedOrderChainId = row.id;
        enableOrderControlsForModify();
    } else {
        $("#orderToModifyId").get(0).value = "";
        currentSelectedOrderChainId = null;
    }
    $("#orderModifyBtn").get(0).disabled = canNotBeCanceledOrModified;
    $("#orderCancelBtn").get(0).disabled = canNotBeCanceledOrModified;
}

/// <summary> Filters the orders table.</summary>
function filterOrdersTable() {
    var table = $('#ordersTable').get(0);

    for (var i = 1; i < table.rows.length; ++i) {
        var showRow = true;
        var accountRow = table.rows[i].cells[OrdersTableEnum.Account.value].innerText;
        var sideRow = table.rows[i].cells[OrdersTableEnum.Side.value].innerText;
        var instrumentRow = table.rows[i].cells[OrdersTableEnum.Instrument.value].innerText;
        var typeRow = table.rows[i].cells[OrdersTableEnum.Type.value].innerText;
        var durationRow = table.rows[i].cells[OrdersTableEnum.Duration.value].innerText;
        var statusRow = table.rows[i].cells[OrdersTableEnum.Status.value].innerText;
        var instructionRow = table.rows[i].cells[OrdersTableEnum.ExecInstraction.value].innerText;

        var accountFilter = $("#accountFilter").get(0).options[$("#accountFilter").get(0).selectedIndex].text;
        var sideFilter = $("#sideFilter").get(0).options[$("#sideFilter").get(0).selectedIndex].text;
        var instrumentFilter = $("#instrumentFilter").get(0).options[$("#instrumentFilter").get(0).selectedIndex].text;
        var typeFilter = $("#typeFilter").get(0).options[$("#typeFilter").get(0).selectedIndex].text;
        var durationFilter = $("#durationFilter").get(0).options[$("#durationFilter").get(0).selectedIndex].text;
        var statusFilter = $("#statusFilter").get(0).options[$("#statusFilter").get(0).selectedIndex].text;
        var instructionFilter = $("#instructionFilter").get(0).options[$("#instructionFilter").get(0).selectedIndex].text;


        showRow = accountRow == accountFilter || accountFilter == "ALL";
        showRow = (sideRow == sideFilter || sideFilter == "ALL") && showRow;
        showRow = (instrumentRow == instrumentFilter || instrumentFilter == "ALL") && showRow;
        showRow = (typeRow == typeFilter || typeFilter == "ALL") && showRow;
        showRow = (durationRow == durationFilter || durationFilter == "ALL") && showRow;
        showRow = (statusRow == statusFilter || statusFilter == "ALL") && showRow;
        showRow = (instructionRow == instructionFilter || instructionFilter == "ALL") && showRow;


        if (showRow) {
            table.rows[i].style.display = '';
        } else {
            table.rows[i].style.display = 'none';
        }
    }
}

/// <summary> Cleans the order table's rows.</summary>
function cleanRows() {
    var table = $('#ordersTable').get(0);

    while (table.rows.length > 1) {
        table.deleteRow(1)
    }
}


/// <summary> Instrument changed.</summary>
function orderInstrumentChanged() {
    var instrumnetBox = $("#orderInstruments").get(0);
    var contractId = instrumnetBox.options[instrumnetBox.selectedIndex].value;
    var contractSubscriptonLevel = $("#requestType").get(0); //TODO find better solution
    contractSubscriptonLevel.options.selectedIndex = 4;

    unsubscribe(rt_currentSymbolContractId);
    cleanQuotes(contract);

    rt_currentSubscriptionLevel = WebAPI.MarketDataSubscription.Level.TRADES_BBA_DOM;
    setSubscription(contractId, rt_currentSubscriptionLevel);

    $("#rtInstrumentInput").get(0).value = instrumnetBox.options[instrumnetBox.selectedIndex].text;
}

/// <summary> Clears orders DOM table.</summary>
function clearOrdersDOM() {
    showDomRow(ui.ordDomPriceBid1, ui.ordBid1, 0, null, "LightGrey", null);
    showDomRow(ui.ordDomPriceBid2, ui.ordBid2, 0, null, "LightGrey", null);
    showDomRow(ui.ordDomPriceBid3, ui.ordBid3, 0, null, "LightGrey", null);
    showDomRow(ui.ordDomPriceBid4, ui.ordBid4, 0, null, "LightGrey", null);
    showDomRow(ui.ordDomPriceBid5, ui.ordBid5, 0, null, "LightGrey", null);

    showDomRow(ui.ordDomPriceAsk1, ui.ordAsk1, 0, null, "LightGrey", null);
    showDomRow(ui.ordDomPriceAsk2, ui.ordAsk2, 0, null, "LightGrey", null);
    showDomRow(ui.ordDomPriceAsk3, ui.ordAsk3, 0, null, "LightGrey", null);
    showDomRow(ui.ordDomPriceAsk4, ui.ordAsk4, 0, null, "LightGrey", null);
    showDomRow(ui.ordDomPriceAsk5, ui.ordAsk5, 0, null, "LightGrey", null);
}

function clearOrderControls() {
    cleanSelector($("#orderAccounts").get(0));
    cleanSelector($("#orderInstruments").get(0));
    $("#orderToModifyId").get(0).value = "";
}
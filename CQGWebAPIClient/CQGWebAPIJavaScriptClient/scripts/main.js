// file:	W:\WebAPI\Sample\WebAPISampleJS\scripts\main.js

/// <summary> Initialization .</summary>
$(document).ready(function () {
    $('.tabs .tab-links a').on('click', function (e) {
        var currentAttrValue = $(this).attr('href');

        // Show/Hide Tabs
        $('.tabs ' + currentAttrValue).show().siblings().hide();

        // Change/remove current tab to active
        $(this).parent('li').addClass('active').siblings().removeClass('active');

        e.preventDefault();
    });

    $('#bar-chart').hide();

    initializeControlsHandlers();
    initializeTimeAndSalePeriod();
    initializeSessionInfoPeriod();
    onTimeBarsPeriodChange();
});

/// <summary> Initializes the controls handlers.</summary>
function initializeControlsHandlers() {
    $("#rtInstrumentInput").keypress(function (e) {
        var event = e || window.event;
        var charCode = event.which || event.keyCode;

        if (charCode == '13') {
            onInstrumentSubscribeBtnClicked();
            return false;
        }
    });
}

/// <summary> Establishes the connect.</summary>
function connect() {
    if (websocket != null) {
        log("Already connected.");
        return;
    }

    var host = $("#url").get(0).value;
    try {
        websocket = new WebSocket(host);
        websocket.binaryType = 'arraybuffer';

        websocket.onopen = function () {
            log("Welcome - status " + this.readyState);
            logon();
        };

        websocket.onclose = function (evt) {
            log("Disconnected - status " + this.readyState);
            delete websocket;
            websocket = null;
            resolutionRequests = [];
            subscriptions = [];
            contractsMetadata = [];
            $("#logoff").get(0).disabled = true;
            $("#logon").get(0).disabled = false;
            $("#changePW").get(0).disabled = true;
            $("#url").get(0).disabled = false;
        };

        websocket.onmessage = function (msg) {
            processMessage(msg.data);
        };

        websocket.onerror = function (evt) {
            log("Error:" + evt.data);
            disconnect();
        };

        log('WebSocket - status ' + websocket.readyState);

        $("#user").get(0).focus();
    }
    catch (ex) {
        log(ex.message);
    }
}

/// <summary> Disconnects from server.</summary>
function disconnect() {
    if (!websocket) {
        log("Not connected.");
    }
    else {
        websocket.close();
        delete websocket;
        websocket = null;
        $("#logon").get(0).disabled = false;
        $("#logoff").get(0).disabled = true;
        $("#changePW").get(0).disabled = true;
        clearData();
    }
}

/// <summary> Clears the data all old data.</summary>
function clearData() {
    cleanRows();
    clearOrdersDOM();
    clearRTDOM();
    clearRTQuotes();
    clearRTTrade();
    clearAccountData();
    clearOrderControls();
    orderModifyState = false;
    orders.clear();
    currentSelectedOrderChainId = null;
    resolutionRequests = [];
    subscriptions = [];
    contractsMetadata = [];
}

/// <summary> Logon into web api server.</summary>
function logon() {
    var user, pass, onetime, msg;
    user = $("#user").get(0);
    pass = $("#pass").get(0);
    onetime = $("#onetime").get(0);
    msg = user.value + pass.value;
    if (!msg) {
        alert("Message can not be empty");
        disconnect();
        return;
    }
    var clMsg = new WebAPI.ClientMsg;
    var logon = new WebAPI.Logon;
    logon.user_name = user.value;
    logon.password = pass.value;
    if (onetime) {
        logon.one_time_password = onetime.value;
    }
    logon.client_id = "WebApiTest";
    logon.client_version = "0.1";
    logon.collapsing_level = 0;
    clMsg.logon = logon;
    sendMessage(clMsg, "Sent: Login: " + user.value + " : " + pass.value);
}

/// <summary> Logoff.</summary>
function logoff() {
    var clMsg = new WebAPI.ClientMsg;
    var logoff = new WebAPI.Logoff;
    logoff.text_message = "Going away!";
    clMsg.logoff = logoff;
    sendMessage(clMsg, "Sent: Logoff: " + logoff.textMessage);
}

/// <summary> Changes the password.</summary>
function changePW() {
    var newpw, pass;
    pass = $("#pass").get(0);
    newpw = $("#newpass").get(0);
    if (!newpw) {
        alert("New PW can not be empty");
        return;
    }

    var clMsg = new WebAPI.ClientMsg;
    var logon = new WebAPI.PasswordChange;
    logon.old_password = pass.value;
    logon.new_password = newpw.value;
    clMsg.password_change = logon;
    sendMessage(clMsg, "Sent: PasswordChange: " + pass.value + " : " + newpw.value);
}

//<editor-fold desc="Data processing functions">

/// <summary> Process the messages from web api server.</summary>
/// <note>In general this function just call approprite processing function for each message type</note>
/// <param name="msg"> Messege object.</param>
function processMessage(msg) {
    var sMsg = WebAPI.ServerMsg.decode(msg);
    if (sMsg.logged_off) {
        processLoggedOff(sMsg.logged_off);
        return;
    }
    if (sMsg.logon_result)
        processLogonResult(sMsg.logon_result);
    for (var i = 0; i < sMsg.information_report.length; ++i)
        processInformationReport(sMsg.information_report[i]);
    for (var i = 0; i < sMsg.market_data_subscription_status.length; ++i)
        processMarketDataSubscriptionStatus(sMsg.market_data_subscription_status[i]);
    for (var i = 0; i < sMsg.real_time_market_data.length; ++i)
        processRealTimeMarketData(sMsg.real_time_market_data[i]);
    if (sMsg.password_change_result)
        processPasswordChangeResult(sMsg.password_change_result);
    for (var i = 0; i < sMsg.user_message.length; ++i)
        processUserMessage(sMsg.user_message[i]);
    for (var i = 0; i < sMsg.order_request_reject.length; ++i)
        processOrderRequestReject(sMsg.order_request_reject[i]);
    for (var i = 0; i < sMsg.trade_subscription_status.length; ++i)
        processTradeSubscriptionStatus(sMsg.trade_subscription_status[i]);
    for (var i = 0; i < sMsg.time_bar_report.length; ++i)
        processTimeBarReport(sMsg.time_bar_report[i]);
    for (var i = 0; i < sMsg.time_and_sales_report.length; ++i)
        processTimeAndSalesReport(sMsg.time_and_sales_report[i]);
    for (var i = 0; i < sMsg.order_status.length; ++i)
        processOrderStatusChange(sMsg.order_status[i]);
}

/// <summary> Process the logon result.</summary>
/// <param name="result"> Logon result.</param>
function processLogonResult(result) {
    var isLogonSuccess = (result.result_code == WebAPI.LogonResult.ResultCode.SUCCESS);
    disableControls(Boolean(isLogonSuccess));
    if (Boolean(isLogonSuccess)) {
        log("baseTime: " + result.base_time);
        baseTime = new Date(Date.parse(result.base_time + "Z"))

        log("SUCCESSFUL logon Result:" + result.text_message);
        log("baseTime: " + baseTime);
        requestAccounts();
    }
    else {
        log("FAILED logon Result:" + result.text_message);
        disconnect();
    }
}

/// <summary> Process the logged off.</summary>
/// <param name="reason"> Loggoff reason.</param>
function processLoggedOff(reason) {
    try {
        switch (reason.logoff_reason) {
            case WebAPI.LoggedOff.LogoffReason.BY_REQUEST:
                log("Logged off. Reason : By Request");
                break;
            case WebAPI.LoggedOff.LogoffReason.REDIRECTED:
                log("Logged off. Reason : Redirected " + reason.redirect_url);
                break;
            case WebAPI.LoggedOff.LogoffReason.FORCED:
                log("Logged off. Reason : Forced");
                break;
            case WebAPI.LoggedOff.LogoffReason.REASSIGNED:
                log("Logged off. Reason : Reassigned");
                break;
            default:
                log("Invalid logoff reason: " + reason.logoff_reason);
                break;
        }
        clearData();
        disableControls(false);
        disconnect();
    }
    catch (ex) {
        log(ex.message);
    }
}

/// <summary> Process the information report.</summary>
/// <param name="msg"> The information report.</param>
function processInformationReport(msg) {
    if (msg.symbol_resolution_report) {
        processSymbolResolutionReport(msg.id, msg.symbol_resolution_report);
    }
    if (msg.session_information_report) {
        processSessionInformationReport(msg.id, msg.session_information_report);
    }
    if (msg.accounts_report) {
        processAccountsInformationReport(msg.id, msg.accounts_report);
    }
}

/// <summary> Process the password change result.</summary>
/// <param name="result"> The password change result.</param>
function processPasswordChangeResult(result) {
    if (result.result_code == WebAPI.PasswordChangeResult.ResultCode.SUCCESS) {
        log("SUCCESS paswword change:" + result.text_message);
    } else {
        log("FAILED password change:" + result.text_message);
    }
}

/// <summary> Process the user messages.</summary>
/// <param name="result"> The processing result.</param>
function processUserMessage(result) {
    log("UserMessage: From(" + result.from + ") Subject(" + result.subject + ") Message(" + result.text + ")");
}

//</editor-fold>

/// <summary> Parse date.</summary>
/// <param name="str"> The string date to parse.</param>
/// <returns> Date object for the given string.</returns>
function parseDate(str) {
    if (!str)
        return null;
    if (/^(\-|\+)?([0-9]+|Infinity)$/.test(str))
        return new Date(baseTime.getTime() + Number(str));
    return new Date(Date.parse(str));
}

/// <summary> Disables controls depends on the given flag.</summary>
/// <param name="flag"> Flag which shows whenever logged on/off.</param>
function disableControls(flag) {
    $("#logon").get(0).disabled = flag;
    $("#user").get(0).disabled = flag;
    $("#pass").get(0).disabled = flag;
    $("#logoff").get(0).disabled = !flag;
    $("#instrumentSubscribeBtn").get(0).disabled = !flag;
    $("#changePW").get(0).disabled = !flag;
    $("#requestMetadataBtn").get(0).disabled = !flag;
    $("#instrumentSubscribeBtn").get(0).disabled = !flag;
    $("#tsRequestBtn").get(0).disabled = !flag;
    $("#barsRequestBtn").get(0).disabled = !flag;
    $("#barsSubscribeBtn").get(0).disabled = !flag;
    $("#cancelBarsBtn").get(0).disabled = !flag;
    $("#sessionInfoRequestBtn").get(0).disabled = !flag;
}

/// <summary> Gets the quit.</summary>
function quit() {
    websocket.close();
}

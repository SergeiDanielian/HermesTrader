// file:	W:\WebAPI\Sample\WebAPISampleJS\scripts\account.js

/// <summary> The brokerage metadata storage.</summary>
var brokerageMetadataData = null;

/// <summary> Requests the accounts.</summary>
function requestAccounts() {
    log("Account request");
    var infRequest = new WebAPI.InformationRequest();
    infRequest.id = 1;
    infRequest.accounts_request = new WebAPI.AccountsRequest;
    var clMsg = new WebAPI.ClientMsg;
    clMsg.information_request = infRequest;
    sendMessage(clMsg, "Sending account request");
}

/// <summary> Process the accounts information report.</summary>
/// <param name="id">The request id.</param>
/// <param name="msg"> The second parameter.</param>
function processAccountsInformationReport(id, msg) {
    log('Account info received: ' + id);
    brokerageMetadataData = msg;
    var selectBox = $('#accountName').get(0);

    for (var i = 0; i < brokerageMetadataData.brokerage.length; ++i) {
        var info = brokerageMetadataData.brokerage[i];
        if (info.sales_series) {
            for (var j = 0; j < info.sales_series.length; ++j) {
                var salesSeriesInfo = info.sales_series[j];
                for (var k = 0; k < salesSeriesInfo.account.length; ++k) {
                    var newOption = document.createElement("option")
                    newOption.text = salesSeriesInfo.account[k].name;
                    newOption.value = info.id;
                    selectBox.options.add(newOption);
                    addNewOptionToSelector($('#orderAccounts'),
                        salesSeriesInfo.account[k].brokerage_account_id,
                        salesSeriesInfo.account[k].account_id);
                }
            }
        }
    }

    if (selectBox.options.length > 0) {
        selectBox.selectedIndex = 0;
        onAccountSelectionChanged(selectBox);
    }
    /// Subscribing to trading events - to get orders whose are placed before this session.
    var message = new WebAPI.ClientMsg;

    message.trade_subscription = new WebAPI.TradeSubscription();
    message.publication_type = WebAPI.TradeSubscription.PublicationType.ALL_AUTHORIZED;
    message.trade_subscription.subscription_scope.push(
        WebAPI.TradeSubscription.SubscriptionScope.ORDERS,
        WebAPI.TradeSubscription.SubscriptionScope.POSITIONS,
        WebAPI.TradeSubscription.SubscriptionScope.COLLATERAL);
    message.trade_subscription.subscribe = true;
    message.trade_subscription.id = requestID++;
    sendMessage(message, "Requesting TradeSubscription");
}

/// <summary> Executes the account selection changed action.</summary>
/// <param name="selector"> Sender selector.</param>
function onAccountSelectionChanged(selector) {
    var selectedAccount = selector.options[selector.selectedIndex].text;
    var brokerId = selector.options[selector.selectedIndex].value;
    for (var i = 0; i < brokerageMetadataData.brokerage.length; ++i) {
        var info = brokerageMetadataData.brokerage[i];
        if (info.id == brokerId && info.sales_series) {
            for (var j = 0; j < info.sales_series.length; ++j) {
                var salesSeriesInfo = info.sales_series[j];
                for (var k = 0; k < salesSeriesInfo.account.length; ++k) {
                    var account = salesSeriesInfo.account[k];
                    if (account.name == selectedAccount) {
                        $('#gwAccId').get(0).innerText = account.account_id;
                        $('#gwAccName').get(0).innerText = account.name;
                        $('#lastStatement').get(0).innerText = sessionTimeToString(timeFromProto(account.last_statement_date));
                        $('#fcmAccId').get(0).innerText = account.brokerage_account_id;
                        $('#fcm').get(0).innerText = brokerId;
                        $('#salesSerName').get(0).innerText = salesSeriesInfo.name;
                        $('#salesSerId').get(0).innerText = salesSeriesInfo.number;

                        $('#accId').get(0).innerText = account.account_id;
                        $('#accName').get(0).innerText = account.name;
                        $('#brokId').get(0).innerText = info.id;
                        $('#brokAccId').get(0).innerText = account.brokerage_account_id;
                        return;
                    }
                }
            }
        }
    }
}

/// <summary> Clears the account data.</summary>
function clearAccountData() {
    cleanSelector($("#accountName").get(0));

    $('#gwAccId').text('');
    $('#gwAccName').text('');
    $('#lastStatement').text('');
    $('#fcmAccId').text('');
    $('#fcm').text('');
    $('#salesSerName').text('');
    $('#salesSerId').text('');

    $('#accId').text('');
    $('#accName').text('');
    $('#brokId').text('');
    $('#brokAccId').text('');
}

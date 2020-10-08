//every instrument has its own price_scale, we must multiply
// the quote price and the price_scale to get the correct price
// since we have multiple requests, we need to claim globel arrays
// that save the symbols and their real time data
var price_scale=[], contract_symbols=[], real_price=[];

//rows is index of the number of rows in the symbol table, we add or minus
// this number by clicking Add Button or Delete Button
//rowcount is the total number of rows in the symbol table, has the same
// value of our requests
var rows=0, rowcount;

//requestMetadata must run after user logged on
// there are two required message user need to send for metadata:
// 1. (int) id in information_request
// 2. (string) symbol in symbol_resolution_request under information_request
function requestMetadata(){
    //multiple requests depending on symbols in the table
    if(rows==0){alert("Symbol can not be empty!"); return;}
    var symbolTable = document.getElementById("rtSymbolsTbl");
    for(var i = 0; i < rows; i++){
        var symbol = symbolTable.rows.item(i).cells[0].innerText;
        var infRequest = new WebAPI.InformationRequest;
        var symbolRequest = new WebAPI.SymbolResolutionRequest;
        symbolRequest.symbol = symbol;
        infRequest.id = i;
        infRequest.symbol_resolution_request = symbolRequest;
        var clMsg = new WebAPI.ClientMsg;
        clMsg.information_request = infRequest;
        sendMessage(clMsg, "Sent: MetaData Request of " + symbol);
    }
}

//process Metadata information in the symbol_resolution_report we received from Server
function processInformationReport(result){
    console.log(result.symbol_resolution_report.contract_metadata);
    rowcount = rows;
    var contract_symbol = result.symbol_resolution_report.contract_metadata.contract_symbol;
    var contract_id = result.symbol_resolution_report.contract_metadata.contract_id;
    price_scale[contract_id] = result.symbol_resolution_report.contract_metadata.correct_price_scale;
    contract_symbols[contract_id] = contract_symbol;
    console.log(contract_symbols[contract_id] + " : " +  price_scale[contract_id]);
    //enable the Real Time Data Request Button when we processed the message
    $("#realTime").get(0).disabled = false;
}

//this function run when the Real Time Data Request button clicked, it will send
// request once and receive real_time_market_data continuously, that is why
// the request message type is repeated. We must run this function after
// receiving the information_report, for we must use the contract_id to
// compelete the request
function realTimedata(){
    //
    for(var i = 0; i < rows; i++){
        var subscription = new WebAPI.MarketDataSubscription;
        //this contract_id cannot change by user, it is determinded by the
        // total number of reports the user received from the server for the
        // metadata. If user has 3 reports, then the contract_id will be
        // 1, 2, 3 respectively
        subscription.contract_id = i+1;
        //there are four levels of real time data user can request
        //NONE = 0;             Collapsing is not not preferred.
        //DOM = 1;              DOM data is collapsed.
        //DOM_BBA = 2;          DOM, best bid/ ask quotes are collapsed delivering only last BBA but all trades.
        //DOM_BBA_TRADES = 3;   DOM, best bid/ ask and trades quotes are collapsed delivering only last values.
        subscription.level = 1;
        var clMsg = new WebAPI.ClientMsg;
        clMsg.market_data_subscription = subscription;
        sendMessage(clMsg, "Sent: realTimedata request for " + contract_symbols[i+1]);
    }
}

//this function run when real_time_market_data received from the server
//
function processRealTimeMarketData(result){
    //ther are six quote types user can choose
		//TRADE = 0;         Trade quote.
		//BESTBID = 1;       Best bid quote.
		//BESTASK = 2;       Best ask quote.
		//BID = 3;           Bid quote (DOM level).
		//ASK = 4;           Ask quote (DOM level).
		//SETTLEMENT = 5;    Settlement quote.
    var quote = result.quote;
    if(quote){
      for(var i = 0; i < rows; i++){
        if(result.contract_id==i+1){
          //in this case we are using the Trade quote: quote[0]
          if(quote[0]){
            //prec is the decimals we want depending on the price_scale
            var prec = price_scale[i+1].toString().split(".")[1].length || 0;
            real_price[i+1] = quote[0].price * price_scale[i+1];
            real_price[i+1] = real_price[i+1].toFixed(prec);
            console.log(contract_symbols[i+1] + ": " + real_price[i+1]);
          }
        }
      }
    }
}

//run when Add Button clicked, add symbol as the last row to the table
function addSymbol(){
    var symboltoadd = $("#symbol").get(0).value.toUpperCase();
    if(!symboltoadd){alert("Symbol can not be empty");return;}
    var row = "<tr><td>" + symboltoadd + "</td></tr>";
    $(row).appendTo($("#rtSymbolsTbl"));
    rows++;
}

//run when Delete Button clicked, delete the last row in the table
function deleteSymbol(){
    document.getElementById("rtSymbolsTbl").deleteRow(rows-1);
    rows--;
}

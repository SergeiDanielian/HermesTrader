//user need to use correct_price_scale to calculate the real price in the timeBar.js
//so that we make the "correct_price_scale" a globel variable
var correct_price_scale;

//requestMetadata must run after user logon and before any other request
// there are two required messages user needs to send for metadata:
// 1. (int) "id" in "information_request"
// 2. (string) "symbol" in "symbol_resolution_request" under "information_request"
function requestMetadata(){
    //this is a single Metadata request; later example will have multiple requests
    var infRequest = new WebAPI.InformationRequest;
    var symbolRequest = new WebAPI.SymbolResolutionRequest;
    symbolRequest.symbol = $("#symbol").get(0).value;
    infRequest.id = 1;
    infRequest.symbol_resolution_request = symbolRequest;
    var clMsg = new WebAPI.ClientMsg;
    clMsg.information_request = infRequest;
    sendMessage(clMsg, "Sent: Metadata request");
}

//process metadata information in the "symbol_resolution_report" we received from Server
function processInformationReport(result){
    console.log(result.symbol_resolution_report.contract_metadata);
    contract_symbol = result.symbol_resolution_report.contract_metadata.contract_symbol;
    correct_price_scale = result.symbol_resolution_report.contract_metadata.correct_price_scale;
    currency = result.symbol_resolution_report.contract_metadata.currency;
    description = result.symbol_resolution_report.contract_metadata.description;
    tick_size = result.symbol_resolution_report.contract_metadata.tick_size;
    tick_value = result.symbol_resolution_report.contract_metadata.tick_value;
    title = result.symbol_resolution_report.contract_metadata.title;
    //when the user changes the symbol using the input box and clicks "Metadata Request" button
    // results can be observed from the console with the following syntax
    console.log("Contract_symbol:     " + contract_symbol);
    console.log("Correct_price_scale: " + correct_price_scale );
    console.log("Currency:            " + currency);
    console.log("Description:         " + description);
    console.log("Tick_size:           " + tick_size);
    console.log("Tick_value:          " + tick_value);
    console.log("Title:               " + title);
}

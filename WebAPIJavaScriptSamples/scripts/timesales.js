function requestTimeSales(){
    var params = new WebAPI.TimeAndSalesParameters;
    params.contract_id = 1;
    params.level = 3; //Trades_BBA_Volumes = 3 Trades = 1
    seconds_number = parseInt($('#tick-seconds').val());
    milliseconds_in_second = 1000;

    current_date = new Date();
    params.from_utc_time = current_date.getTime() - parseInt(base_time) -
                            seconds_number * milliseconds_in_second;
    var request = new WebAPI.TimeAndSalesRequest;
    request.request_id = 1;
    request.time_and_sales_parameters = params;
    var clMsg = new WebAPI.ClientMsg;
    clMsg.time_and_sales_request = request;
    sendMessage(clMsg, "Send TimeAndSaleRequest");
}

function processTimeAndSalesReport(message){
    is_report_complete = message.is_report_complete;
    if (is_report_complete){
        console.log("Time and Sales Report complete!");
    }

    for (var i = 0; i < message.quote.length; i++){

      quote_utc_time = new Date(message.quote[i].quote_utc_time.low + parseInt(base_time)).toLocaleString() + " " +
                      + new Date(message.quote[i].quote_utc_time.low + parseInt(base_time)).getMilliseconds().toString();

      price = (message.quote[i].price * correct_price_scale).toFixed(2);
      //there are 6 different Type types:
      switch(message.quote[i].type){
          case 0:
              type = "TRADE"
              break;
          case 1:
              type = "BEST_BID"
              break;
          case 2:
              type = "BEST_ASK"
              break;
          case 3:
              type = "BID"
              break;
          case 4:
              type = "ASK"
              break;
          case 5:
              type = "SETTLEMENT"
              break;
          default:
              type = "UNKNOWEN"
      }
      if (message.quote[i].volume){
          volume = message.quote[i].volume.low;
      }
      else{
          volume = null;
      }
      console.log("Local time:" + quote_utc_time + "    " + type + ": "
                   + price + "     Volume:" + volume);
    }

}

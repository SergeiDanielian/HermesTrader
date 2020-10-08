//user can call "requestTimeBar" function after receiving the "information_report,"
//there are four required messages user needs to send for historical data:
// 1. (uint32) "request_id"     in "time_bar_request"
// 2. (uint32) "contract_id"    in "time_bar_parameters" under "time_bar_request"
// 3. (uint32) "bar_unit"       in "time_bar_parameters" under "time_bar_request"
// 4. (sint64) "from_utc_time"  in "time_bar_parameters" under "time_bar_request"
function requestTimeBar(){
    var params = new WebAPI.TimeBarParameters;
    params.contract_id = 1;
    params.bar_unit = parseInt($('#time-bars-interval').val());
    bars_number = parseInt($('#barsNumber').val());
    milliseconds_in_minute = 60000;
    //using new Date(), creates a new date object with the current date and time
    current_date = new Date();
    //Because millisecond time integers are very large, this API uses a process
    //to shorten time values used for requesting and receiving data
    //using getTime() function, formats the date to the number of milliseconds since January 1, 1970, 00:00:00.
    //To get historical data starting from a specific time, first we take the getTime() value and subtract
    //the base_time we received from the logon_report; then we subtract the amount of time
    //(converted to milliseconds) for which we want data. This value is "params.from_utc_time"

    //the server will send historical data from "params.from_utc_time" to now
    params.from_utc_time = current_date.getTime() - parseInt(base_time) -
                            bars_number * milliseconds_in_minute;
    var request = new WebAPI.TimeBarRequest;
    request.request_id = 1;
    request.time_bar_parameters = params;
    var clMsg = new WebAPI.ClientMsg;
    clMsg.time_bar_request = request;
    sendMessage(clMsg, "Send TimeBarRequest");
}



//parsing the "time_bar_report" message
function processTimeBarReport(message){
    //Message response to large requests for many historical bars will be
    //broken up into multiple time_bar messages
    //the is_report_complete will let you know whether the request has been satisfied
    is_report_complete = message.is_report_complete;
    if (is_report_complete){
        console.log("Report complete!");
    }
    //using for loop, display every bar's time, OHLC prices, and volume
    for (var i = 0; i < message.time_bar.length; i++){
        //using toLocaleString(), returns your local time
        bar_utc_time = new Date(message.time_bar[i].bar_utc_time.low + parseInt(base_time)).toLocaleString();
        open_price = (message.time_bar[i].open_price * correct_price_scale).toFixed(2);
        high_price = (message.time_bar[i].high_price * correct_price_scale).toFixed(2);
        low_price = (message.time_bar[i].low_price * correct_price_scale).toFixed(2);
        close_price = (message.time_bar[i].close_price * correct_price_scale).toFixed(2);
        if (message.time_bar[i].volume){
            volume = message.time_bar[i].volume.low;
        }
        else{
            volume = null;
        }
        console.log("Local time:" + bar_utc_time + "     Open:" + open_price +
                    "      High:" + high_price + "     Low:" + low_price +
                    "      Close:" + close_price + "     Volume:" + volume);
    }
}

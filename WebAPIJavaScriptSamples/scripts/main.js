// main.js has 9 functions:
// require(), initWebAPI() functions build the WebAPI Object
// connect(), disconnect(), logon(), logoff() functions control the logon states
// sendMessage(), processMessage() functions send and process messages
// processLogonResult() Spectacularly process logon_result in processMessage()
//
// Download the UML of WebAPI PowerPoint from website:
//

//both websocket and WebAPI are globel objects that need to be alive all the time
//base_time is very important!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
var websocket, WebAPI, base_time;

console.log("Start of program");

//this function always execute first, run initWebAPI() if WebSockets and ArrayBuffer
// are supported by the ProtoBuf we are using
//let mod = "ProtoBuf";
require(["ProtoBuf"], function (ProtoBufInit) {
  console.log("Inside require");

  var body = $("#body").get(0);
  if ("WebSocket" in window) {
    if ("ArrayBuffer" in window) {
      console.log("Inside arraybuffer");
      initWebAPI(); //see function in line 30
    } else {
      console.log("ArrayBuffer is not supported");
    }
  } else {
    console.log("WebSockets are not supported");
  }
});

//initWebAPI() build the WebAPI Object through webapi_1.proto, which
// formats every message we send to or receive from the server
function initWebAPI() {
  var protobuf = require("ProtoBuf");
  var builder = protobuf.protoFromFile("protocol/webapi_1.proto");
  console.log("before webapi builder");
  WebAPI = builder.build("WebAPI_1");
}

//run when Connect button clicked, there are four main processes:
// 1. creat new websocket to wss://demoapi.cqg.com:443
// 2. react properly when connection is open and ready to communicate
// 3. run processMessage() function when message(s) received from server
// 4&5. react properly when onclose or onerror events received
function connect() {
  //create a new websocket if there is no websocket. read more about WebSocket:
  // https://developer.mozilla.org/en-US/docs/Web/API/WebSocket
  console.log("inside connect");
  //initWebAPI();
  
  if (websocket != null) {
    console.log("Already connected."); //uncomment to see the console
    return;
  }
  var host = $("#url").get(0).value;
  //console.log(host);//uncomment to see the console
  websocket = new WebSocket(host);
  websocket.binaryType = "arraybuffer";
  $("#state").html("Connecting...".big().bold().fontcolor("green"));
  //there are four readyStates:
  // CONNECTING 	    0	The connection is not yet open.
  // OPEN	            1	The connection is open and ready to communicate.
  // CLOSING	        2	The connection is in the process of closing.
  // CLOSED	          3	The connection is closed or couldn't be opened.
  //console.log('WebSocket status: ' + websocket.readyState);//uncomment to see the console

  //websocket.onopen()
  //An event listener to be called when the WebSocket connection's readyState
  // changes to OPEN; this indicates that the connection is ready to send
  // and receive data. The event is a simple one with the name "open".
  websocket.onopen = function () {
    //console.log("Connected! status: " + this.readyState);//uncomment to see console
    $("#state").html(" Connected!".big().bold().fontcolor("green"));
    $("#connect").get(0).disabled = true;
    $("#disconnect").get(0).disabled = false;
    $("#logon").get(0).disabled = false;
    $("#logoff").get(0).disabled = false;
  };
  //websocket.onmessage()
  //An event listener to be called when a message is received from the server
  //The listener receives a MessageEvent named "msg"
  websocket.onmessage = function (msg) {
    processMessage(msg.data); //see processMessage() function in line 167
  };
  //websocket.onclose()
  //An event listener to be called when the WebSocket connection's readyState
  // changes to CLOSED. The listener receives a CloseEvent named "close".
  websocket.onclose = function (evt) {
    //console.log("Disconnected! status: " + this.readyState);//uncomment to see console
    delete websocket;
    websocket = null;
    $("#state").html(" Disconnected!".big().bold().fontcolor("red"));
    $("#connect").get(0).disabled = false;
    $("#disconnect").get(0).disabled = true;
    $("#logon").get(0).disabled = true;
    $("#logoff").get(0).disabled = true;
  };
  //websocket.onerror()
  //An event listener to be called when an error occurs.
  websocket.onerror = function (evt) {
    //console.log("Error:" + evt.data);//uncomment to see console
  };
}

//run when Disconnect button clicked, close and delete websocket
function disconnect() {
  if (!websocket) {
    console.log("Not connected.");
  } else {
    websocket.close();
    delete websocket;
    websocket = null;
  }
}

//run when Logon button clicked, send required Logon messages to the WebAPI server
// ****pay attention that a user is only allowed to logon once for each connection
// in order to logon again, user need to connect to server again after logoff()
function logon() {
  var user, pass;
  user = $("#user").get(0);
  pass = $("#pass").get(0);
  if (!user.value || !pass.value) {
    alert("UserName or Password can not be empty");
    return;
  }
  //clMsg is the message we will send to the server, the server will response
  // depending on the required and optional messages contained in the clMsg.
  // In WebAPI.Logon, there are 4 required messages and 6 optional messages.
  // In this example, we use required messages only
  var clMsg = new WebAPI.ClientMsg();
  var logon = new WebAPI.Logon();
  logon.user_name = user.value; // required
  logon.password = pass.value; // required
  logon.client_app_id = "WebApiTest"; // required, "WebApiTest" is the only id for individual user
  logon.client_version = "any name will be fine"; // required, name it "anyfing" you want
  clMsg.logon = logon;
  //see sendMessage() function in line 153, this function is called all the time
  sendMessage(clMsg, "Sent: Required Logon Information ");
  $("#logon").get(0).disabled = true;
  $("#logoff").get(0).disabled = false;
  if (document.getElementById("request")) {
    $("#request").get(0).disabled = false;
  }
}

//run when Logoff button clicked, send required Logoff messages to the server
// user will be auto-logged off after five minutes disconnection
// user will be auto-disconnected after logged off for one minute
// I suggest run disconnect() right after logoff, why? it makes life easier
function logoff() {
  var clMsg = new WebAPI.ClientMsg();
  var logoff = new WebAPI.Logoff();
  logoff.text_message = "Going away!";
  clMsg.logoff = logoff;
  sendMessage(clMsg, "Sent: Logoff: " + logoff.text_message);
  $("#logon").get(0).disabled = false;
  $("#logoff").get(0).disabled = true;
  disconnect(); //want harder life? comment this to see some interesting behaviors
}

//sendMessage() function will encode and send your WebAPI requset(s) to
// the server, and will console a confirm message for the user as well
function sendMessage(message, logMsg) {
  try {
    var buffer = message.encode(); //encode
    websocket.send(buffer.toArrayBuffer()); //send
    console.log(logMsg);
  } catch (ex) {
    console.log(ex.message);
  }
}

//separate and console ServerMsg depending on user's requirements
function processMessage(msg) {
  //WebAPI.ServerMsg.decode()function is used to translate ArrayBuffer{} to
  // readable Message{} which contains information_report, logon_result,
  // market_data_subscription_status, real_time_market_data and so on
  var sMsg = WebAPI.ServerMsg.decode(msg);
  //console.log(sMsg);//uncomment to see the whole ServerMsg
  if (sMsg.logon_result) processLogonResult(sMsg.logon_result); //see function in line 182
  //add the processInformationReport function to separate Metadata message
  for (var i = 0; i < sMsg.information_report.length; ++i)
    //see processInformationReport function in metadata.js line xxxx
    processInformationReport(sMsg.information_report[i]);
  for (var i = 0; i < sMsg.real_time_market_data.length; ++i)
    processRealTimeMarketData(sMsg.real_time_market_data[i]);
  for (var i = 0; i < sMsg.trade_subscription_status.length; ++i)
    processTradeSubscriptionStatus(sMsg.trade_subscription_status[i]);
  for (var i = 0; i < sMsg.time_bar_report.length; ++i)
    processTimeBarReport(sMsg.time_bar_report[i]);
  for (var i = 0; i < sMsg.time_and_sales_report.length; ++i)
    processTimeAndSalesReport(sMsg.time_and_sales_report[i]);
}

//Spectacularly process the logon_result
function processLogonResult(result) {
  //There are 8 Logon results, so as 8 ResultCode, user can compare the
  // ResultCode to result_code to detect your own logon states:
  // 1. CONCURRENT_SESSION:105
  // 2. ENCODING_TYPE_NOT_SUPPORTED:107
  // 3. FAILURE:101
  // 4. NO_ONETIME_PASSWORD:103
  // 5. PASSWORD_EXPIRED:104
  // 6. REDIRECTED:106
  // 7. ROUTINE_ERROR:108
  // 8. SUCCESS:0
  var isLogonSuccess =
    result.result_code == WebAPI.LogonResult.ResultCode.SUCCESS;
  if (isLogonSuccess) {
    baseTime = new Date(Date.parse(result.base_time + "Z"));
    utcbaseTime = new Date(baseTime).toUTCString();
    //add base_time to initialize time bars we want to have in timeBar.js
    base_time = baseTime.getTime();
    //there are 8 keys in result, let's console three of them
    console.log("Successful to logon! Your user id is:" + result.user_id);
    console.log("baseTime:                            " + baseTime);
    console.log("base_Time:                           " + base_time);
    console.log("sessionToken:                        " + result.session_token);
    if (document.getElementById("logonresult")) {
      $("#logonresult").html(
        "Logon Result: Successful to logon!" +
          "<br>Your user id is:     " +
          result.user_id +
          "<br>baseTime:            " +
          baseTime +
          "<br>UTC baseTime:        " +
          utcbaseTime +
          "<br>sessionToken:        " +
          result.session_token
      );
    }
  } else {
    console.log("Failed to logon");
    disconnect();
  }
}

//initWebAPI();

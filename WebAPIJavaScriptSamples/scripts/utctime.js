//calculateUTC function
function calculateUTC(){
    if(parseInt(base_time)){
      //
      var start_date = $("#start-date").val().split("-");
      start_day = start_date[2];
      start_month = start_date[1];
      start_year = start_date[0];
      var start_time = $("#start-time").val().split(":");
      start_minute = start_time[1];
      start_hour = start_time[0];
      var end_date = $("#end-date").val().split("-");
      end_day = end_date[2];
      end_month = end_date[1];
      end_year = end_date[0];
      var end_time = $("#end-time").val().split(":");
      end_minute = end_time[1];
      end_hour = end_time[0];

      var whole_start_date = new Date(start_year,start_month-1,start_day,start_hour,start_minute);
      var whole_end_date = new Date(end_year,end_month-1,end_day,end_hour,end_minute);
      //the calculation is to subtract the base_time from the input date in millisecond format
      var from_utc_time = whole_start_date - parseInt(base_time);
      var to_utc_time = whole_end_date - parseInt(base_time);

      $("#fromutctime").html("The From UTC Time you entered is:    " + whole_start_date
                              + "<br>The equivalent 'from_utc_time' is:   " + from_utc_time.toString().big().bold());
      $("#toutctime").html("The To UTC Time you entered is:      " + whole_end_date
                              + "<br>The equivalent 'to_utc_time' is:     " + to_utc_time.toString().big().bold());
    }
    else{
      $("#fromutctime").html("Please first Logon to get the baseTime");
    }
}

function calculateReal(){
    var millisecond_input = $("#milli-time").get(0).value;
    var real_utc_time = +millisecond_input + +parseInt(base_time);
    var real_utc_time_string = new Date(real_utc_time).toUTCString();

    var real_local_time = new Date(Date.parse(real_utc_time_string));

    $("#utctime").html("The millisecond time you entered is:    " + millisecond_input.toString()
                            + "<br>The equivalent 'UTC Time' is:   " + real_utc_time_string.big().bold());
    $("#localtime").html("The equivalent 'Local Time' is:   " + real_local_time.toString().big().bold());
}

function basetimeSave(){
    var a = $("#base_time_pasted").get(0).value;
    console.log(a);
    base_time = Date.parse(a);
    console.log(base_time);
}

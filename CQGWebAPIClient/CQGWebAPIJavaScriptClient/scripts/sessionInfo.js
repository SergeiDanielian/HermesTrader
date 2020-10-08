// file:	W:\WebAPI\Sample\WebAPISampleJS\scripts\sessionInfo.js

/// <summary> Requests session information.</summary>
function requestSessionInfo() {
    var symbol = $('#session-info-symbol').val();
    var from = getTimeField('session-info-from');
    var to = getTimeField('session-info-to');

    var view = $('#session-info');
    view.empty();

    resolveSymbol(symbol, function (resolution) {
        var sessionInfoId = resolution.metadata.session_info_id;

        var request = new WebAPI.SessionInformationRequest;
        request.session_info_id = sessionInfoId;
        if (from != null)
            request.from_utc_time = timeToProto(from);
        if (to != null)
            request.to_utc_time = timeToProto(to);

        var inf = new WebAPI.InformationRequest;
        inf.id = requestID++;
        inf.session_information_request = request;

        var message = new WebAPI.ClientMsg;
        message.information_request = inf;

        log("RequestSessionInfo " + sessionInfoId);
        sendMessage(message);
    });
}

/// <summary> Process the session information report.</summary>
/// <param name="id"> The request id.</param>
/// <param name="msg"> The session information report.</param>
function processSessionInformationReport(id, msg) {
    log('Session information: session_info_id: ' + msg.session_info_id);
    for (var i = 0; i < msg.session_segment.length; ++i) {
        var segment = msg.session_segment[i];
        log('----------- Session ' + segment.session_segment_id + ' -----------');
        log('from: ' + sessionTimeToString(timeFromProto(segment.from_utc_time)));
        log('to: ' + sessionTimeToString(timeFromProto(segment.to_utc_time)));

        for (var i = 0; i < segment.session_schedule.length; ++i) {
            var schedule = segment.session_schedule[i];
            log('name: ' + schedule.name);
            for (var j = 0; j < schedule.session_day.length; ++j)
                log('Day: ' + sessionDayToString(schedule.session_day[j]));
            for (var j = 0; j < schedule.session_holiday.length; ++j)
                log('Holiday: ' + sessionHolidayToString(schedule.session_holiday[j]));
            log('primary: ' + (schedule.is_primary ? "Yes" : "No"));
        }
    }
}

/// <summary> Initializes the session information period controls in view page.</summary>
function initializeSessionInfoPeriod() {
    var from = new Date();
    from.setHours(from.getHours() - 48);
    $('#session-info-from').val(from.toLocaleString());
    $('#session-info-to').val(new Date().toLocaleString());
}
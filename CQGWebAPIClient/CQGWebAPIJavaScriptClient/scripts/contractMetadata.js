// file:	W:\WebAPI\Sample\WebAPISampleJS\scripts\contractMetadata.js

/// <summary> Executes the request contract metadata clicked action.</summary>
function onRequestContractMetadataClicked() {
    var symbol = $('#cm-symbol').val();

    resolveSymbol(symbol, function (resolution) {
        var metadata = resolution.metadata;
        var fieldNames = Object.keys(metadata);
        var view = $('#metadata');
        view.empty();
        var table = $('<table>');
        fieldNames.forEach(function (name) {
            if (metadata[name] != null) {
                var row = $('<tr>').appendTo(table);
                $('<td>').text(name).appendTo(row);
                if (name == 'last_trading_date')
                    $('<td>').text(timeFromProto(metadata[name]).toLocaleString()).appendTo(row);
                else
                    $('<td>').text(metadata[name]).appendTo(row);
            }
        });
        table.appendTo(view);
    });
}

/// <summary> Process the symbol resolution report.</summary>
/// <param name="id"> The request id.</param>
/// <param name="msg"> Symbol resolution report.</param>
function processSymbolResolutionReport(id, msg) {
    var metadata = msg.contract_metadata;
    log('Metadata: Symbol: ' + metadata.contract_symbol +
    ', ContactId: ' + metadata.contract_id);

    var r = null;
    for (var i = 0; i < resolutionRequests.length; ++i) {
        if (resolutionRequests[i].requestId == id) {
            r = resolutionRequests[i];
            break;
        }
    }

    if (!r) {
        return;
    }
    $("#orderNewBtn").get(0).disabled = false;
    var selectBox = $("#orderInstruments");
    addNewOptionToSelector(selectBox, metadata.contract_symbol, metadata.contract_id)
    selectBox.get(0).selectedIndex = getIndexByTextFromSelector(metadata.contract_symbol, selectBox.get(0));

    var row = document.getElementById(metadata.contract_symbol);
    if (!row) {
        row = $("<tr id='" + metadata.contract_symbol + "'>").append($("<td onclick='rtSymbolsItemClicked(this)'>").html(metadata.contract_symbol));
        $("#rtSymbolsTbl").append(row);
        var addedRow = document.getElementById(metadata.contract_symbol);
        addedRow.setAttribute("id", metadata.contract_symbol);
    }

    r.contractId = metadata.contract_id;
    r.fullSymbol = metadata.contract_symbol;
    r.metadata = metadata;

    var callbacks = r.callbacks;
    r.callbacks = [];

    for (var i = 0; i < callbacks.length; ++i)
        callbacks[i](r);
}



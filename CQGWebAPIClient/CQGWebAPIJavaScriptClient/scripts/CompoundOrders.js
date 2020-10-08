/**
 * Created by daniilpr on 24.12.2014.
 */
/// <summary>Load data from file</summary>
var compoundOrderXML = loadXMLDoc('structure.xml');


/// <summary>Generate tree structure depends XML, set unique orderName attribute for each order node in XML.</summary>
/// <param name="order"> Order for which properties needs to be collected.</param>
/// <param name="isNewOrder"> Flag to recognize is order new or should be modified.</param>
function createTreeStructureFromXML() {
    compoundOrderXML = loadXMLDoc('structure.xml');
    deleteTree();
    var treeRoot = addOrderToTreeStructure(true, null);
    var treeRootContent = treeRoot.children(".Content").get(0);
    treeRootContent.className += " SelectedElement";
    compoundOrderXML.getElementsByTagName("CompoundOrder")[0].setAttribute("orderName", treeRootContent.innerText);
    recursXML(compoundOrderXML.getElementsByTagName("CompoundOrder")[0], treeRoot.get(0));
}


/// <summary>Recursively look thought XML, for each XML order node generate unique orderName and create corresponding tree node.</summary>
/// <param name="rootNode"> XML root node.</param>
/// <param name="treeRoot"> Root node of tree structure.</param>
function recursXML(rootNode, treeRoot) {
    var childNodes = rootNode.childNodes;
    for (var i = 0; i < childNodes.length; i++) {
        if (childNodes[i].nodeType == 1) {
            rootNode = childNodes[i];
            if (rootNode.nodeName != 'CompoundOrderEntry') {
                var isCompound = (rootNode.nodeName == 'CompoundOrder');
                var oldTreeRoot = treeRoot;
                var rootElement = addOrderToTreeStructure(isCompound, treeRoot);
                if (isCompound) {
                    treeRoot = rootElement.children(".Container").get(0);
                }
                rootNode.setAttribute("orderName", rootElement.children(".Content").get(0).innerText);
            }
            recursXML(rootNode, treeRoot);
            if (isCompound) treeRoot = oldTreeRoot;
        }
    }
}


/// <summary>Return nearest parent node with specified class</summary>
/// <param name="node">Parent for this node should be returned</param>
/// <param name="className">Name of the class</param>
function getParentByClass(node, className) {
    currentNode = node.parentNode;
    while (!$(currentNode).hasClass(className)) {
        var currentNode = currentNode.parentNode;
    }
    return currentNode;
}


/// <summary>Clear tree structure</summary>
function deleteTree() {
    var nodesToDelete = $(".ordersTree").children("ul.Container").children(".Node");
    for (var j = 0; j < nodesToDelete.length; j++) {
        deleteOrderFromTree(nodesToDelete[j]);
    }
}


/// <summary>Generate unique nodeName for tree node, same name stored in corresponding attribute of XML node.</summary>
/// <param name="rootContainer">Parent container in tree structure .</param>
/// <param name="isNewOrder"> Flag to recognize is order compound or regular.</param>
function generateNodeName(rootContainer, isCompound) {
    //search for parent name
    var parentNumber = $(rootContainer).parent().children(".Content").get(0).innerText.split("_")[1];
    if (!parentNumber) parentNumber = "";
    var nodeName = "";
    if (isCompound) {
        var compoundOrdersNumber = $(rootContainer).children(".ExpandOpen,.ExpandClose").length + 1;
        nodeName = "compoundOrder_" + parentNumber + "." + compoundOrdersNumber;
    }
    else {
        var regularOrdersNumber = $(rootContainer).children(".ExpandLeaf").length + 1;
        nodeName = "regularOrder_" + parentNumber + "." + regularOrdersNumber;
    }
    if (parentNumber == "") {
        var re = new RegExp("\\.");
        nodeName = nodeName.replace(re, '');
    }
    return nodeName
}


/// <summary>Add order to tree structure</summary>
/// <param name="parentNode">Parent node in tree structure.</param>
/// <param name="isCompound"> Flag to recognize is order compound or regular.</param>
function addOrderToTreeStructure(isCompound, parentNode) {
    if (!parentNode) parentNode = $(".SelectedElement").get(0);
    if (!parentNode) parentNode = $(".ordersTree").children("div.Content").get(0);
    parentNode = parentNode.parentNode.getElementsByTagName("ul")[0];
    var rootContainer = parentNode;
    var newNodeName = generateNodeName(rootContainer, isCompound);
    $(rootContainer).children(".IsLast").each(function (i) {
            $(this).toggleClass("IsLast", false)
        }
    );

    var childStructure = createStructure(isCompound, newNodeName);
    rootContainer.appendChild(childStructure);
    return $(rootContainer).children(".IsLast");
}


/// <summary>Create tree structure for order node</summary>
/// <param name="orderName">Unique node name.</param>
/// <param name="isCompound"> Flag to recognize is order compound or regular.</param>
function createStructure(isCompound, orderName) {
    var createExpandDiv = document.createElement("div");
    createExpandDiv.className += "Expand";
    var createContentText = document.createTextNode(orderName);
    var createContentDiv = document.createElement("div");
    createContentDiv.className += "Content";
    createContentDiv.appendChild(createContentText);
    var createContainerUl = document.createElement("ul");
    createContainerUl.className += "Container";
    var className = "Node ExpandLeaf IsLast";
    if (isCompound) className = "Node ExpandOpen IsLast";
    var createdNode = document.createElement("li");
    createdNode.className = className;
    createdNode.appendChild(createExpandDiv);
    createdNode.appendChild(createContentDiv);
    createdNode.appendChild(createContainerUl);
    return createdNode;
}


/// <summary>Load XML document from file</summary>
/// <param name="fname">File name.</param>
function loadXMLDoc(fName) {
    if (window.XMLHttpRequest) {
        xhttp = new XMLHttpRequest();
    }
    else {
        xhttp = new ActiveXObject("Microsoft.XMLHTTP");
    }
    xhttp.open("GET", fName, false);
    try {
        xhttp.responseType = "msxml-document"
    } catch (err) {
    }
    xhttp.send("");
    return xhttp.responseXML;
}


/// <summary>Get nodes from xml by XPath expression, return XPathResult value </summary>
/// <param name="xml">Source xml.</param>
/// <param name="path"> Valid xpath expression.</param>
function getNodeFormXMLByXPath(xml, path) {
    //code for IE
    if (window.ActiveXObject || xhttp.responseType == "msxml-document") {
        xml.setProperty("SelectionLanguage", "XPath");
        nodes = xml.selectNodes(path)[0];
        return nodes;
    }
    // code for Chrome, Firefox, Opera, etc.
    else if (document.implementation && document.implementation.createDocument) {
        var nodes = xml.evaluate(path, xml, null, XPathResult.ANY_TYPE, null).iterateNext();
        return nodes;
    }
}


/// <summary>Get attributes of XML node and pass those attributes to corresponding displaying procedure</summary>
/// <param name="orderName">Unique order name</param>
//From XML to Screen
function getExistingOrderProperties(orderName) {
    var path = '//*[@orderName="' + orderName + '"]';
    var orderAttributes = getOrderAttributesFromXML(path);
    var genericValues = new GenerateValues();
    for (var attrName in genericValues) {
        if (genericValues.hasOwnProperty(attrName)) {
            orderAttributes[attrName] = genericValues[attrName];
        }
    }
    orderAttributes["limit_price"] = (orderAttributes["limit_price"]) ?  orderAttributes["limit_price"] : "";
    orderAttributes["stop_price"] = (orderAttributes["stop_price"]) ? orderAttributes["stop_price"] : "";
    if (orderName.indexOf('regular') > -1) displayRegularOrder(orderAttributes);
    else displayCompoundOrder(orderAttributes)
}


/// <summary>Populate compound order attributes to order properties details form</summary>
/// <param name="orderAttributes">List of orderAttributes</param>
function displayCompoundOrder(orderAttributes) {
    $("#clCompoundId").get(0).value = orderAttributes["orderName"];
    $("#compoundOrderType").get(0).selectedIndex = orderAttributes["type"] - 1;
    toggleFormView(true);
}


/// <summary>Populate regular order attributes to order properties details form</summary>
/// <param name="orderAttributes">List of orderAttributes</param>
function displayRegularOrder(orderAttributes) {
    var modifyOrderId = $("#orderToModifyId").get(0);
    orderModifyState = true;
    modifyOrderId.value = orderAttributes.orderName;
    var orderTypeSelector = $("#orderType").get(0);
    $("#qty").get(0).value = orderAttributes.qty;
    //In proto side starts from 1 --> (orderAttributes.side-1)
    $("#side").get(0).selectedIndex = orderAttributes.side - 1;
    //In proto order_type starts from 1 --> (orderAttributes.order_type-1)
    orderTypeSelector.selectedIndex = orderAttributes.order_type - 1;
    $("#execInstruction").get(0).selectedIndex = orderAttributes.exec_instruction;
    var durationSelector = $("#duration").get(0);
    //In proto duration starts from 1 --> (orderAttributes.duration-1)
    durationSelector.selectedIndex = orderAttributes.duration - 1;
    var orderAccountSelector = $("#orderAccounts").get(0);
    orderAccountSelector.selectedIndex = -1;
    for (var i = 0; i < orderAccountSelector.options.length; ++i) {
        if (orderAccountSelector.options[i].value == orderAttributes.account_id) {
            orderAccountSelector.selectedIndex = i;
        }
    }
    var orderTypeStr = orderTypeSelector.options[orderTypeSelector.selectedIndex].text;
    $("#limitPrice").get(0).value = (orderTypeStr == "LMT" || orderTypeStr == "STL") ? orderAttributes.limit_price : "";
    $("#stopPrice").get(0).value = (orderTypeStr == "STP" || orderTypeStr == "STL") ? orderAttributes.stop_price : "";
    $("#trailingPeg").get(0).value = (orderAttributes.trailing_peg) ? orderAttributes.trailing_peg : "";
    $("#trailOffset").get(0).value = (orderAttributes.trail_offset) ? orderAttributes.trail_offset : "";
    $("#visibleQty").get(0).value = (orderAttributes.visible_qty) ? orderAttributes.visible_qty : "";
    $("#minVisibleQty").get(0).value = (orderAttributes.min_visible_qty) ? orderAttributes.min_visible_qty : "";
    $("#triggerQty").get(0).value = (orderAttributes.trigger_qty) ? orderAttributes.trigger_qty : "";
    enableOrderControlsForModify();
    orderAccountSelector.disabled = false;
    $("#orderInstruments").get(0).disabled = false;
    orderTypeSelector.disabled = false;
    $("#side").get(0).disabled = false;
    toggleFormView(false);
}


/// <summary>Generate unique values for order cl_order_id and when_utc_time using time and date</summary>
function GenerateValues() {
    this.cl_order_id = "CQGWebAPI_" + new Date().getTime() + +Math.random().toString();
    this.when_utc_time = timeToProto(new Date());
}


/// <summary>Get attributes from XML by xPath and accumulate in orderAttributes result</summary>
/// <param name="path">xPath</param>
function getOrderAttributesFromXML(path) {
    var orderAttributes = {};
    var result = getNodeFormXMLByXPath(compoundOrderXML, path);
    var i = 0;
    while (result.attributes[i]) {
        orderAttributes[result.attributes[i].name] = result.attributes[i].value;
        i++;
    }
    return orderAttributes;
}


/// <summary>Delete order node from XML </summary>
/// <param name="deletedNode">Node to delete </param>
function deleteOrderFromXML(deletedNode) {
    if (deletedNode) {
        var parentNode = deletedNode.parentNode;
        parentNode.removeChild(deletedNode);
    }
}


/// <summary>Set properties of selected order, from screen to orderAttributes list, and pass it to setOrderAttributesToXML procedure</summary>
//From Screen to XML
function putExistingOrderProperties() {
    var orderName = $(".SelectedElement")[0].innerText;
    var path = '//*[@orderName="' + orderName + '"]';
    var orderAttributes = {};
    orderModifyState = true;
    if (orderName.indexOf("compound") > -1) {
        orderAttributes["orderName"] = $("#clCompoundId").get(0).value;
        orderAttributes["type"] = $("#compoundOrderType").get(0).selectedIndex + 1;
    }
    else {
        var instrSelector = $("#orderInstruments").get(0);
        var contractId = instrSelector.options[instrSelector.selectedIndex].value;
        orderAttributes.qty = $("#qty").get(0).value;
        orderAttributes.contract_id = contractId;
        var orderTypeSelector = $("#orderType").get(0);
        //In proto order_type starts from 1 --> (orderTypeSelector.selectedIndex+1)
        orderAttributes.order_type = orderTypeSelector.selectedIndex + 1;
        orderAttributes.exec_instruction = ( $("#execInstruction").get(0).selectedIndex > 0) ? $("#execInstruction").get(0).selectedIndex : "";
        orderAttributes.side = $("#side").get(0).selectedIndex + 1;
        var durationSelector = $("#duration").get(0);
        //In proto duration starts from 1 --> (orderAttributes.duration-1)
        orderAttributes.duration = durationSelector.selectedIndex + 1;
        var orderAccountSelector = $("#orderAccounts").get(0);
        orderAttributes.account_id = orderAccountSelector.options[orderAccountSelector.selectedIndex].value;
        var orderTypeStr = orderTypeSelector.options[orderTypeSelector.selectedIndex].text;
        /// if user did not fill in corresponding fields on the form, limit price and stop price will be generated depends on realTime values
        orderAttributes.stop_price = "";
        orderAttributes.limit_price = "";
        if ((orderTypeStr == "LMT" || orderTypeStr == "STL")) {
            if ($("#limitPrice").get(0).value != "") {
                orderAttributes.limit_price = $("#limitPrice").get(0).value;
            }

            else {
                orderAttributes.limit_price = $(ordDomPriceBid1).get(0).innerText * 1.01;
            }
        }
        if (orderTypeStr == "STP" || orderTypeStr == "STL") {
            if ($("#stopPrice").get(0).value != "") {
                orderAttributes.stop_price = $("#stopPrice").get(0).value;
            }
            else {
                orderAttributes.stop_price = $(ordDomPriceBid1).get(0).innerText * 0.99;
            }

        }
        orderAttributes.trailing_peg = $("#trailingPeg").get(0).value;
        orderAttributes.trail_offset = $("#trailOffset").get(0).value;
        orderAttributes.visible_qty = $("#visibleQty").get(0).value;
        orderAttributes.min_visible_qty = $("#minVisibleQty").get(0).value;
        orderAttributes.trigger_qty = $("#triggerQty").get(0).value;
    }
    setOrderAttributesToXML(path, orderAttributes);
}


/// <summary>Set values from orderAttributes to corresponding XML node</summary>
/// <param name="path">xPath of XML node</param>
/// <param name="orderAttributes">list of order properties</param>
function setOrderAttributesToXML(path, orderAttributes) {
    var result = getNodeFormXMLByXPath(compoundOrderXML, path);
    for (var i in orderAttributes) {
        if (orderAttributes.hasOwnProperty(i)) {
            if (orderAttributes[i] != "") {
                result.setAttribute(i, orderAttributes[i]);
            }
        }
    }
    return orderAttributes;
}


/// <summary>Delete corresponding node from tree structure</summary>
/// <param name="deletedNode">Node to delete</param>
function deleteOrderFromTree(deletedNode) {
    if (deletedNode) {
        var parentTreeNodeContainer = getParentByClass(deletedNode, "Container");
        parentTreeNodeContainer.removeChild(deletedNode);
        if ($(deletedNode).hasClass("IsLast")) {
            var siblingNode = $(parentTreeNodeContainer).children(".Node").last().get(0);
            if (siblingNode) siblingNode.className += " IsLast";
        }
    }
}


/// <summary>Delete selected Node from tree structure and from XML</summary>
function removeOrder() {
    var orderName = $(".SelectedElement").get(0).innerText;
    var path = '//*[@orderName="' + orderName + '"]/..';
    var xmlNode = getNodeFormXMLByXPath(compoundOrderXML, path);
    deleteOrderFromXML(xmlNode);
    var treeNode = getParentByClass($(".SelectedElement").get(0), "Node");
    var parentTreeNodeContainer = getParentByClass($(".SelectedElement").get(0), "Container");
    var parentTreeNode = getParentByClass(parentTreeNodeContainer, "Node");
    deleteOrderFromTree(treeNode);
    displaySelected($(parentTreeNode).children(".Content").get(0));
}


/// <summary>Serialize Xml Node to string</summary>
/// <param name="xmlNode">Node to Serialize</param>
function serializeXmlNode(xmlNode) {
    if (typeof xmlNode.xml != "undefined") {
        return xmlNode.xml;
    } else if (typeof window.XMLSerializer != "undefined") {
        return (new window.XMLSerializer()).serializeToString(xmlNode);
    }
    return "";
}


/// <summary>Display serialized xml in new window</summary>
function displayXML() {
    var xmlNode = compoundOrderXML;
    var myWindow = window.open('', "_blank", "toolbar=no, scrollbars=yes, resizable=yes, top=500, left=500, width=400, height=400");
    var d = myWindow.document.createElement("div");
    d.innerText = serializeXmlNode(xmlNode).toString();
    myWindow.document.body.appendChild(d);
}


/// <summary>Create Compound order request depends on XML. Send this request to WebAPI</summary>
function populateOrder() {
    var clMsg = new WebAPI.ClientMsg;
    var request = new WebAPI.OrderRequest;
    var newCompoundOrder = new WebAPI.NewCompoundOrder;
    var xmlRoot = getNodeFormXMLByXPath(compoundOrderXML, "//NewCompoundOrder");
    newCompoundOrder.partial_fills_handling = getXMLAttributeByName(xmlRoot, "partial_fills_handling");
    var parentCompoundOrderObj = new WebAPI.CompoundOrder;
    newCompoundOrder.compound_order = parentCompoundOrderObj;
    var xmlCompoundOrder = getNodeFormXMLByXPath(compoundOrderXML, "//NewCompoundOrder/CompoundOrder");
    parentCompoundOrderObj.type = getXMLAttributeByName(xmlCompoundOrder, "type");
    parentCompoundOrderObj.cl_compound_id = "CQGWebAPI_" + new Date().getTime() + +Math.random().toString();
    recursXMLDomToObjectModel(xmlCompoundOrder, parentCompoundOrderObj);
    request.request_id = requestID++;
    request.new_compound_order = newCompoundOrder;
    clMsg.order_request.push(request);
    sendMessage(clMsg, "Sent: NewCompoundOrder");
}


/// <summary>Recursively create compound order Objects depends on XML </summary>
/// <param name="xmlCompoundOrder">Current XML Node</param>
/// <param name="parentCompoundOrderObj">Corresponding object from compound order request </param>
function recursXMLDomToObjectModel(xmlCompoundOrder, parentCompoundOrderObj) {
    var childNodes = xmlCompoundOrder.childNodes;
    for (var i = 0; i < childNodes.length; i++) {
        if (childNodes[i].nodeType == 1) {
            var oldParentCompoundOrderObj = parentCompoundOrderObj;
            if (childNodes[i].nodeName != 'CompoundOrderEntry') {
                newCompoundOrderEntry = new WebAPI.CompoundOrderEntry;
                if (childNodes[i].nodeName == 'CompoundOrder') {
                    currentOrderObj = new WebAPI.CompoundOrder;
                    setOrderObjAttributes(currentOrderObj, childNodes[i]);
                    newCompoundOrderEntry.compound_order = currentOrderObj;
                }
                else {
                    currentOrderObj = new WebAPI.Order;
                    setOrderObjAttributes(currentOrderObj, childNodes[i]);
                    newCompoundOrderEntry.order = currentOrderObj;
                }
                parentCompoundOrderObj.add("compound_order_entry",newCompoundOrderEntry);
                if (childNodes[i].nodeName == 'CompoundOrder') {
                    parentCompoundOrderObj = currentOrderObj;
                }
            }
            xmlCompoundOrder = childNodes[i];
            recursXMLDomToObjectModel(xmlCompoundOrder, parentCompoundOrderObj);
            parentCompoundOrderObj = oldParentCompoundOrderObj;
        }
    }
}


/// <summary>Cross browser function for getting attribute value.</summary>
/// <param name="xmlObject">Source XML</param>
/// <param name="attributeName">Name of attribute</param>
function getXMLAttributeByName(xmlObject, attributeName) {
    return (xmlObject.getAttribute(attributeName).value) ? xmlObject.getAttribute(attributeName).value : xmlObject.getAttribute(attributeName);
}


/// <summary>Set or generate attributes of order depends on corresponding XML node</summary>
/// <param name="orderObj">Order object</param>
/// <param name="parentCompoundOrderObj">Corresponding XML node</param>
function setOrderObjAttributes(orderObj, orderXML) {
    // Copy all values from XML to Order Object except orderName. orderName - unique key field generated in createTreeStructureFromXML
    for (var i = 0; i < orderXML.attributes.length; i++) {
        if ((orderXML.attributes[i].name != "orderName")) {
            orderObj[orderXML.attributes[i].name] = orderXML.attributes[i].value;
        }
    }
    if (orderXML.nodeName == 'CompoundOrder') {
        orderObj["cl_compound_id"] = "CQGWebAPI_" + new Date().getTime() + Math.random().toString();
    }
    else {
        orderObj["cl_order_id"] = "CQGWebAPI_" + new Date().getTime() + Math.random().toString();
        orderObj["when_utc_time"] = timeToProto(new Date());
        //If value does not set in XML set default value for account_id
        if (!orderObj["account_id"]) {
            orderObj["account_id"] = 2;
        }
        var orderTypeSelector = $("#orderType").get(0);
        var orderTypeStr = orderTypeSelector.options[orderObj["order_type"] - 1].text;
        var limitPrice = "";
        var stopPrice = "";
        if (orderTypeStr == "LMT" || orderTypeStr == "STL") {
            if (orderXML.getAttribute("limit_price")) {
                orderObj["limit_price"] = getRawPrice(orderObj["contract_id"], getXMLAttributeByName(orderXML, "limit_price"));
            }
            else {
                orderObj["limit_price"] = getRawPrice(orderObj["contract_id"], $(ordDomPriceBid1).get(0).innerText) * 1.01;
            }
        }
        if (orderTypeStr == "STP" || orderTypeStr == "STL") {
            if (orderXML.getAttribute("stop_price")) {
                orderObj["stop_price"] = getRawPrice(orderObj["contract_id"], getXMLAttributeByName(orderXML, "stop_price"));
            }
            else {
                orderObj["stop_price"] = getRawPrice(orderObj["contract_id"], $(ordDomPriceAsk1).get(0).innerText) * 0.99;
            }
        }
    }
}


/// <summary>Toggle details form to display compound or regular order</summary>
/// <param name="isCompound">True for compound order, false for regular order</param>
function toggleFormView(isCompound) {
    if (isCompound) {
        var displayingBlock = $("#compoundOrderPropertiesToPlace")[0];
        var hidingBlock = $("#orderPropertiesToPlace")[0];
    }
    else {
        displayingBlock = $("#orderPropertiesToPlace")[0];
        hidingBlock = $("#compoundOrderPropertiesToPlace")[0];
    }
    displayingBlock.style.display = "block";
    hidingBlock.style.display = "none";
}


/// <summary>Display properties of selected element on the details form</summary>
/// <param name="selectedElement">Element to displaying</param>
function displaySelected(selectedElement) {
    if (!$(selectedElement).hasClass('Content')) {
        return; // click on wrong element
    }
    var node = $(".SelectedElement");
    if (node) node.toggleClass('SelectedElement', false);
    selectedElement.className = selectedElement.className + " SelectedElement";
    var displayCompound = !$(selectedElement.parentNode).hasClass('ExpandLeaf');
    var orderNumber = selectedElement.innerText;
    getExistingOrderProperties(orderNumber);
    toggleFormView(displayCompound);
}

/// <summary>Change expand state of clicked object, by changing css class</summary>
/// <param name="event">Event</param>
function treeToggle(event) {
    event = event || window.event;
    var clickedElem = event.target || event.srcElement;
    if (!$(clickedElem).hasClass('Expand')) {
        displaySelected(clickedElem);
        return; // click on wrong element
    }
    // Set clicked Node
    var node = clickedElem.parentNode;
    if ($(node).hasClass('ExpandLeaf')) {
        return; // Click on tree leaf
    }
    // Setup new Class Node
    var newClass = $(node).hasClass('ExpandOpen') ? 'ExpandClosed' : 'ExpandOpen';
    //Switch currentClass to newClass
    //Replace open|close to newClass by RegExp
    var re = /(^|\s)(ExpandOpen|ExpandClosed)(\s|$)/;
    node.className = node.className.replace(re, '$1' + newClass + '$3');
}


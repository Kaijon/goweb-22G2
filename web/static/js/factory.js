//  Variables
var SUB_FACTORY_TOPIC = "global/factoryMode/#";
var globalBase64TstPkg = "";


// called when a message arrives
const topicHandlers_Factory = {
    global: {
        factoryMode: {
            TestPkg: handleTestPkgMessage
        }
    },
    factory: {
        info: {
            MAC: handleMacMessage,
            PCBASN: handlePcbaMessage,
            SysSN: handleSystemSerialMessage,
            ModelName: handleModelNameMessage,
            SkuName: handleSkuNameMessage
        }
    }
};

// Initialize previous values of SKU, SN, and etc parameters
let prevMac = '';
let prevPcba = '';
let prevSystemSerial = '';
let prevModelName = '';
let prevSkuName = '';

// functions
// Check if a value has changed
function hasFacValueChanged(value, prevValue) {
    return value !== prevValue;
}

function onMessageArrived_Factory(message) {
    if (document.readyState !== 'complete') {
        console.log('Document is not loaded yet, onMessageArrived_Factory()');
        return;
    }
    console.log('onMessageArrived_Factory() called!');

    const fullTopic = message.destinationName;
    const payload = message.payloadString;
    const topics = fullTopic.split("/");

    let handler = topicHandlers_Factory;
    for (let i = 0; i < topics.length; i++) {
        handler = handler[topics[i]];
        if (handler === undefined) {
            console.log(`No topic matched! Topic = ${topics.slice(0, i + 1).join('/')}`);
            return;
        }
        if (typeof handler === 'function') {
            handler(payload);
            return;
        }
    }
    console.log(`onMessageArrived_Factory:No topic matched! Topic = ${fullTopic}`);
}

function handleMacMessage(payload) {
    console.log('handleMacMessage() called!');
    try {
        const element = getElementByIdOrThrow("txt_macAddr");
        element.value = payload;
        prevMac = payload;
        updatePath();
    } catch (error) {
        console.error(error);
    }
    // Set default keyboard focus to the Operator ID field
    var operatorIdField = document.getElementById('txt_operator');
    if (operatorIdField) {
        operatorIdField.focus();
    }
}
function handlePcbaMessage(payload) {
    console.log('handlePcbaMessage() called!');
    try {
        const element = getElementByIdOrThrow("txt_pcbaSN");
        element.value = payload;
        prevPcba = payload;
    } catch (error) {
        console.error(error);
    }
}
function handleSystemSerialMessage(payload) {
    console.log('handleSystemSerialMessage() called!');
    try {
        const element = getElementByIdOrThrow("txt_systemSerial");
        element.value = payload;
        prevSystemSerial = payload;
        // update id=fullPath
        //change to use MAC as filename
        //updatePath();
    } catch (error) {
        console.error(error);
    }
}
function handleModelNameMessage(payload) {
    console.log('handleModelNameMessage() called!');
    try {
        const element = getElementByIdOrThrow("txt_modelName");
        element.value = payload;
        prevModelName = payload;
    } catch (error) {
        console.error(error);
    }
}
function handleSkuNameMessage(payload) {
    console.log('handleSkuNameMessage() called!');
    try {
        const element = getElementByIdOrThrow("txt_skuName");
        element.value = payload;
        prevSkuName = payload;
    } catch (error) {
        console.error(error);
    }
}

function handleTestPkgMessage(payloada) {
    console.log('handleTestPkgMessage() called with payloada: ' + payloada);
    // this function is just a test function for the test package delivery
    var wannaTest = false;
    if (wannaTest) {
        // payload is a zip file converted by base64, convert it back to ArrayBuffer and save it to a zip file
        var base64 = payloada;
        var arrayBuffer = base64ToArrayBuffer(base64);
        // save arrayBuffer to testPkg.zip file in ~/Downloads
        var fileName = "testPkg.zip";
        saveArrayBuffer(arrayBuffer, fileName);
    }
}
function base64ToArrayBuffer(base64) {
    var binaryString = window.atob(base64);
    var len = binaryString.length;
    var bytes = new Uint8Array(len);
    for (var i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
}
function saveArrayBuffer(arrayBuffer, fileName) {
    console.log('saveArrayBuffer() called!');
    var blob = new Blob([arrayBuffer], { type: "application/octet-stream" });
    var url = URL.createObjectURL(blob);
    var link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
}

function updatePath() {
    console.log('updatePath() called!');
    var macAddr = document.getElementById("txt_macAddr").value;
    var fullPathElement = document.getElementById("fullPath");
    fullPathElement.innerHTML = macAddr + ".txt";
}

function submitFacData() {
    console.log('submitFacData() called!');
    var mac = document.getElementById("txt_macAddr").value;
    var pcba = document.getElementById("txt_pcbaSN").value;
    var systemSerial = document.getElementById("txt_systemSerial").value;
    var modelName = document.getElementById("txt_modelName").value;
    var skuName = document.getElementById("txt_skuName").value;
    // check if the value has been changed
    if (hasFacValueChanged(mac, prevMac)) {
        publishMessageWithOpt("factory/info/MAC", mac, 0, true);
    }
    if (hasFacValueChanged(pcba, prevPcba)) {
        publishMessageWithOpt("factory/info/PCBASN", pcba, 0, true);
    }
    if (hasFacValueChanged(systemSerial, prevSystemSerial)) {
        publishMessageWithOpt("factory/info/SysSN", systemSerial, 0, true);
    }
    if (hasFacValueChanged(modelName, prevModelName)) {
        publishMessageWithOpt("factory/info/ModelName", modelName, 0, true);
    }
    if (hasFacValueChanged(skuName, prevSkuName)) {
        publishMessageWithOpt("factory/info/SkuName", skuName, 0, true);
    }
}

// function to publish xmlDoc and globalBase64TstPkg
function publishXmlAndTstPkg() {
    console.log('publishXmlAndTstPkg() called!');

    // Retry to resolve the issue of the session 'globalBase64TstPkg' not being saved successfully.
    function retryUntilNotNull(maxRetries, delay) {
        return new Promise((resolve, reject) => {
            let retries = 0;

            function check() {
                var globalBase64TstPkg = sessionStorage.getItem("globalBase64TstPkg");
                if (globalBase64TstPkg !== null) {
                    console.log("getItem globalBase64TstPkg successfully");
                    resolve(globalBase64TstPkg);
                } else if (retries < maxRetries) {
                    console.error("globalBase64TstPkg is null");
                    retries++;
                    setTimeout(check, delay);
                } else {
                    reject(new Error('globalBase64TstPkg is still null after maximum retries'));
                }
            }
            check();
        });
    }

    retryUntilNotNull(10, 1000) // Maximum retry count is 10 times, with a delay of 1000 milliseconds.
        .then(globalBase64TstPkg => {
            // get xmlDoc from sessionStorage
            var xmlDoc = sessionStorage.getItem("xmlDoc");
            if (xmlDoc === null) {
                console.error("xmlDoc is null");
                return;
            }
            // publish xmlDoc to global/factoryMode/xml
            publishMessage("global/factoryMode/xml", xmlDoc);
            // publish globalBase64TstPkg to global/factoryMode/TestPkg
            publishMessage("global/factoryMode/TestPkg", globalBase64TstPkg);
        })
        .catch(error => {
            console.error(error.message);
        });
}

// function to load file and process the xml file

function loadFile() {
    console.log('loadFile() called!');
    var fileInput = document.getElementById("fileInput");
    var file = fileInput.files[0];
    var reader = new FileReader();
    var selectionSwitch = document.getElementById("selection-switch");

    reader.onload = function (e) {
        var zip = new JSZip();
        var arrayBuffer = e.target.result;
        var base64 = arrayBufferToBase64(arrayBuffer);
        // save the base64 to seesionStorage("globalBase64TstPkg")
        sessionStorage.setItem("globalBase64TstPkg", base64);
        // Process xml and save it to sessionStorage("xmlDoc")
        zip.loadAsync(arrayBuffer).then(function (zipFiles) {
            zipFiles.forEach(function (relativePath, zipEntry) {
                if (zipEntry.name.endsWith(".xml")) {
                    zipEntry.async("text").then(function (content) {
                        var parser = new DOMParser();
                        var xmlDoc = parser.parseFromString(content, "text/xml");

                        // Delete xmlDoc's checkbox's style=noshow if id=selection-switch checked
                        if (selectionSwitch.checked) {
                            var checkboxes = xmlDoc.getElementsByTagName("checkbox");
                            for (var i = 0; i < checkboxes.length; i++) {
                                checkboxes[i].removeAttribute("style");
                            }
                        }
                        // save xmlDoc to sessionStorage for later use
                        var serializer = new XMLSerializer();
                        var updatedXmlDocStr = serializer.serializeToString(xmlDoc);
                        sessionStorage.setItem("xmlDoc", updatedXmlDocStr);
                        // Use xmlDoc to update page
                        updatePageWithXml(xmlDoc);
                    });
                }
            });
        }); // end of zip.loadAsync
    };
    reader.readAsArrayBuffer(file);
    // At the end of the function, reset the value of the file input element
    document.getElementById('fileInput').value = '';

    // log the selectionSwitch disable or not
    console.log('selectionSwitch.checked: ' + selectionSwitch.checked);

    if (selectionSwitch.checked) {
        // Do nothing. the xml and tstPkg will be published when the user clicks the entStep3Test button
        console.log('selectionSwitch is checked');
    } else {
        // submit all of them to MQTT broker here once file is loaded
        console.log('selectionSwitch is not checked, publishXmlAndTstPkg()');
        publishXmlAndTstPkg();
    }
}

function dynamicTopicHandler(resultTopic, resultID) {
    // create a handle function that function name is id of the test tag and handle the result
    var handler = function (message) {
        var payload = message.payloadString;
        var topics = message.destinationName.split("/");
        var result = document.getElementById(resultID);
        if (result === null) {
            console.error("Element with ID " + resultID + " not found");
            return;
        }
        result.style.textAlign = "center";
        console.log('id: ' + resultID + ", result: " + payload + ', topic: ' + message.destinationName);
        if (result) {
            // split payload by ',' and get the first element, the rest is the result message
            var parts = payload.split(',');
            payload = parts[0];
            var reason = parts[1] ? parts[1] : "";  // if parts[1] is undefined, set reason to an empty string
            result.textContent = payload;
            if (payload === "PASS") {
                result.style.backgroundColor = "lightgreen";
                result.title = reason;
            } else if (payload === "FAIL") {
                result.style.backgroundColor = "red";
                // add reason into result placeholder
                result.title = reason;
            }
        } else {
            console.error("Element with ID '" + resultID + "_result' not found");
        }
        console.log('handler() called with payload: ' + payload);
    }
    addDynamicTopicHandler(resultTopic, handler);
    // subscribe to the topic
    subscribeTopic(resultTopic);
}

function createTableCell(content, style = {}) {
    const td = document.createElement("td");
    td.textContent = content;
    Object.assign(td.style, style);
    return td;
}

function handleCheckbox(td, elements, id) {
    console.log("id: " + id + ", value: " + elements[0].textContent);
    var checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.id = id;
    checkbox.name = checkbox.id;
    checkbox.checked = elements[0].textContent === "true";
    td.style.textAlign = "center";
    td.appendChild(checkbox);

    // Add an event listener for the change event
    checkbox.addEventListener("change", function () {
        // Load xmlDoc from sessionStorage
        var xmlDocStr = sessionStorage.getItem("xmlDoc");
        var parser = new DOMParser();
        var xmlDoc = parser.parseFromString(xmlDocStr, "text/xml");

        // Find the corresponding <test> element in xmlDoc using XPath
        var xpath = "//test[id='" + this.id + "']/checkbox";
        var xpathResult = xmlDoc.evaluate(xpath, xmlDoc, null, XPathResult.ANY_TYPE, null);
        var checkboxElement = xpathResult.iterateNext();

        if (checkboxElement) {
            if (this.checked) {
                console.log("Checkbox is checked");
                // Set the text content of the <checkbox> element to "true"
                checkboxElement.textContent = "true";
            } else {
                console.log("Checkbox is not checked");
                // Set the text content of the <checkbox> element to "false"
                checkboxElement.textContent = "false";
            }

            // Save the modified xmlDoc back to sessionStorage
            var serializer = new XMLSerializer();
            var updatedXmlDocStr = serializer.serializeToString(xmlDoc);
            sessionStorage.setItem("xmlDoc", updatedXmlDocStr);
        } else {
            console.error("Could not find the corresponding <checkbox> element in xmlDoc");
        }
    });
}

function handleButtons(td, elements) {
    var buttons = elements[0].getElementsByTagName("button");
    for (var k = 0; k < buttons.length; k++) {
        var button = document.createElement("button");
        button.id = buttons[k].getElementsByTagName("id")[0].textContent;
        button.style.backgroundColor = buttons[k].getElementsByTagName("color")[0].textContent;
        button.textContent = button.id;
        var topic = buttons[k].getElementsByTagName("topic")[0].textContent;
        var color = button.style.backgroundColor;
        var btnID = button.id;
        button.onclick = (function (topic, btnID) {
            return function () {
                if (topic) {
                    publishMessage(topic, btnID);
                }
            };
        })(topic, btnID);
        button.style.width = '1.5cm';
        button.style.height = '0.7cm';
        button.style.borderRadius = '5px';
        button.onmousedown = function () {
            this.style.boxShadow = '0 0 10px 5px rgba(0, 0, 0, 0.5)';
        };
        button.onmouseup = function () {
            this.style.boxShadow = 'none';
        };
        td.style.display = 'flex';
        td.style.justifyContent = 'space-around';
        td.appendChild(button);
    }
}

function handleName(td, elements) {
    td.textContent = elements[0].textContent.replace(/ /g, '_');
}

function handleResultField(td, elements, idResult) {
    td.id = idResult;
}

function handleResultTopic(elements, idResult) {
    var resultTopic = elements[0].textContent;
    console.log('handleResultTopic() called!' + resultTopic + ', idResult: ' + idResult);
    dynamicTopicHandler(resultTopic, idResult);
}

function handleDescriptionMultiLang(td, elements) {
    var userLang = (navigator.language || navigator.userLanguage).substring(0, 2);
    console.log('navigator.language:', navigator.language, 'userLang:', userLang);
    var description = "";
    var defaultDescription = "";

    for (var i = 0; i < elements.length; i++) {
        var lang = elements[i].getAttribute('lang');

        // If no lang attribute, use the textContent directly
        if (!lang) {
            description = elements[i].textContent;
            console.log('No lang attribute, used textContent directly');
            break;
        }

        var langs = lang ? lang.split(',') : [];

        if (langs.includes(userLang)) {
            description = elements[i].textContent;
            console.log('Matched userLang:', userLang);
            break;
        }

        if (langs.includes('en')) {
            defaultDescription = elements[i].textContent;
            console.log('Matched English');
        }
    }

    // use English description, if user's language is not found
    if (description === "") {
        description = defaultDescription;
        console.log('Used English description');
    }

    // use first description, if no lang tag found
    if (description === "" && elements.length > 0) {
        description = elements[0].textContent;
        console.log('Used first description');
    }

    td.textContent = description;
    console.log('description:', description);
}

function createTableCellForTest(test, headerChild) {
    var td = document.createElement("td");
    td.style.border = "1px solid black";
    var idElements = test.getElementsByTagName("id");
    var id = idElements.length > 0 ? idElements[0].textContent : "";
    var idResult = id + "_result";
    var elements = test.getElementsByTagName(headerChild.tagName);
    if (elements.length > 0) {
        switch (headerChild.tagName) {
            case "checkbox":
                handleCheckbox(td, elements, id);
                break;
            case "buttons":
                handleButtons(td, elements);
                break;
            case "name":
                handleName(td, elements);
                break;
            case "resultField":
                handleResultField(td, elements, idResult);
                break;
            case "description":
                handleDescriptionMultiLang(td, elements);
                break;
            default:
                td.textContent = elements[0].textContent;
                break;
        }
    }

    return td;
}

function handleHiddenTestCell(test, headerChild) {
    var idElements = test.getElementsByTagName("id");
    var id = idElements.length > 0 ? idElements[0].textContent : "";
    var idResult = id + "_result";
    var elements = test.getElementsByTagName(headerChild.tagName);
    if (elements.length > 0) {
        switch (headerChild.tagName) {
            case "resultTopic":
                handleResultTopic(elements, idResult);
                break;
            default:
                break;
        }
    }
    return idResult;
}

function createTestRow(test, headerChildren) {
    var tr = document.createElement("tr");
    tr.style.border = "1px solid black";

    for (var j = 0; j < headerChildren.length; j++) {
        if (headerChildren[j].getAttribute('style') !== 'noshow') {
            var td = createTableCellForTest(test, headerChildren[j]);
            tr.appendChild(td);
        } else {
            handleHiddenTestCell(test, headerChildren[j]);
        }
    }

    return tr;
}

function createHeaderRow(headerChildren) {
    var tr = document.createElement("tr");
    tr.style.backgroundColor = "lightgray";

    for (let i = 0; i < headerChildren.length; i++) {
        if (headerChildren[i].getAttribute('style') === 'noshow') {
            continue;
        }
        const td = createTableCell(headerChildren[i].textContent, {
            textAlign: "center",
            border: "none"
        });

        if (headerChildren[i].tagName === "checkbox") {
            td.style.width = "40px";
        }

        tr.appendChild(td);
    }

    return tr;
}

function updatePageWithXml(xmlDoc) {
    console.log(xmlDoc.documentElement);

    var info = xmlDoc.getElementsByTagName("info")[0];
    if (!info) {
        console.error('No <info> tag found in XML document');
        return;
    }

    var version = info.getElementsByTagName("version")[0];
    if (!version) {
        console.error('No <version> tag found in <info> tag');
        return;
    }

    document.getElementById("tstVer").textContent = 'Testing factory Service version: ' + version.textContent;

    var tests = xmlDoc.getElementsByTagName("test");
    var tstCard = document.getElementById("tstCard");

    tstCard.innerHTML = "";

    var header = xmlDoc.getElementsByTagName("header")[0];
    var headerChildren = header.children;

    var headerRow = createHeaderRow(headerChildren);
    tstCard.appendChild(headerRow);

    for (var i = 0; i < tests.length; i++) {
        var testRow = createTestRow(tests[i], headerChildren);
        tstCard.appendChild(testRow);
    }
}

function arrayBufferToBase64(buffer) {
    var binary = '';
    var bytes = new Uint8Array(buffer);
    var len = bytes.byteLength;
    for (var i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
}

function getInputValues(formElement) {
    return Array.from(formElement.getElementsByTagName("input"))
        .map(input => `${input.name}:${input.value}`)
        .join('\n');
}

function getRowContent(cells, itemIndex, retCodeIndex, reasonIndex) {
    const reason = cells[reasonIndex].title ? ` Value:${cells[reasonIndex].title}` : "";
    const item = cells[itemIndex].textContent;
    const retCode = cells[retCodeIndex].textContent === 'PASS' ? 0 : 1;
    // return `Item:${item.padEnd(15)} Ret_Code:${retCode}${reason}`;     // I think this is better, need to talk with SFS system owner.
    return `Item:${item}${' '.repeat(15)}Ret_Code:${retCode}${reason}`;
}

function saveTestResult() {
    const fullPathElement = document.getElementById("fullPath");
    const tstVerElement = document.getElementById("tstVer");
    const table = document.getElementById("tstCard");
    const tstItemForm = document.getElementById("tstItemForm");
    const systemSerial = document.getElementById("txt_systemSerial").value;
    const macAddr = document.getElementById("txt_macAddr").value;
    const macAddressUpperCase = macAddr.toUpperCase();
    const macWithSemicolons = macAddressUpperCase.match(/.{2}/g).join(":");

    let fileContent = getInputValues(tstItemForm);
    fileContent += `\nDevice:${systemSerial}\n`;
    fileContent += `Mac address:${macWithSemicolons}\n`;

    const isSelectionSwitchChecked = document.getElementById("selection-switch").checked;
    const itemIndex = isSelectionSwitchChecked ? 1 : 0;
    const retCodeIndex = isSelectionSwitchChecked ? 2 : 1;
    const reasonIndex = isSelectionSwitchChecked ? 2 : 1;

    const rows = Array.from(table.rows);
    for (let i = 1; i < rows.length; i++) {
        const cells = rows[i].cells;
        let shouldAddRow = true;
        if (isSelectionSwitchChecked) {
            const checkbox = cells[0].getElementsByTagName('input')[0];
            shouldAddRow = checkbox.checked;
        }
        if (shouldAddRow) {
            fileContent += getRowContent(cells, itemIndex, retCodeIndex, reasonIndex) + '\n';
        }
    }
    fileContent += "END";

    const blob = new Blob([fileContent], { type: "text/plain;charset=utf-8" });
    const fullPathContent = fullPathElement.textContent.replace(/\\/g, "\\\\");
    console.log('saveTestResult() called! fullPathContent: ' + fullPathContent);
    saveAs(blob, fullPathContent);
}

function addVerToDeviceInfo(message) {
    console.log('addVerToDeviceInfo() called!');
    const payload = message.payloadString;
    const json = JSON.parse(payload);
    var version = json.FWVersion;
    var element = document.getElementById("fwVer");
    if (element) {
        element.innerHTML = "Firmware Version: <b style='color:red;'>" + version + "</b>";
    } else {
        console.error("Element with id 'fwVer' not found");
    }
    // check if we need to switch the cards
    checkInputFormAndSwitchCards();
}

// implement entStep3Test click event
function entStep3Test() {
    console.log('entStep3Test() called!');
    // clear the tstCard result before publish the xml and tstPkg
    var table = document.getElementById("tstCard");
    var rows = table.rows;
    for (var i = 1; i < rows.length; i++) {
        var cells = rows[i].cells;
        for (var j = 0; j < cells.length; j++) {
            if (cells[j].id && cells[j].id.includes("_result")) {
                cells[j].textContent = "";
                cells[j].style.backgroundColor = "white";
                cells[j].title = "";
            }
        }
    }
    // xmlDoc was updated and save back to seesinStorage when the checkbox selected event is triggered
    publishXmlAndTstPkg();
}

function validateMacInput(input) {
    var value = input.value;
    var valid = /^[0-9A-Fa-f]*$/i.test(value);
    if (!valid) {
        input.value = value.slice(0, -1);
    }
}

function checkInputFormAndSwitchCards() {
    var form = document.getElementById('inputForm');
    var inputs = form.getElementsByTagName('input');
    var allFilled = true;

    for (var i = 0; i < inputs.length; i++) {
        if (inputs[i].value === '') {
            allFilled = false;
            break;
        }
    }
    if (allFilled) {
        var cards = Array.from(document.querySelectorAll('.card'));
        var cardWithForm = cards.find(card => card.contains(form));
        var otherCard = cards.find(card => !card.contains(form));
        var parentElement = cardWithForm.parentElement;
        parentElement.insertBefore(cardWithForm, otherCard.nextSibling);
    }
}
// Function to process "Enter == Tab" feature
function processEnterKeyAsTab() {
    var formInputs = Array.prototype.slice.call(document.querySelectorAll('#tstItemForm input, #inputForm input'));
    formInputs.forEach(function (input, index) {
        input.addEventListener('keydown', function (event) {
            if (event.key === 'Enter') {
                event.preventDefault();
                var nextInput = formInputs[(index + 1) % formInputs.length];
                nextInput.focus();
            }
        });
    });
}

// Function to process QR code input
function waitForElement(id, callback) {
    var element = document.getElementById(id);
    if (element) {
        callback(element);
    } else {
        setTimeout(function () {
            waitForElement(id, callback);
        }, 100);  // check every 100 ms
    }
}

function fillFields(parsedData) {
    console.log('fillFields() called!', parsedData);
    var fields = ['macAddr', 'pcbaSN', 'systemSerial', 'modelName', 'skuName'];
    fields.forEach(function (field) {
        waitForElement('txt_' + field, function (element) {
            console.log('element:', element, 'parsedData:', parsedData[field]);
            if (parsedData[field]) {
                element.value = '';
                element.value = parsedData[field];
            }
        });
    });
}

function processQRCodeInput() {
    var inputString = '';
    window.addEventListener('keyup', function (event) {
        if (event.key === ';') {
            inputString = processQRCodeString(inputString);
        } else {
            inputString += event.key;
        }
    });
}

// Function to process QR code string
function processQRCodeString(inputString) {
    try {
        inputString = inputString.replace(/Shift/g, '');
        var startPos = inputString.indexOf('QRcode:');
        var endPos = inputString.indexOf(';');
        if (endPos === -1) {
            endPos = inputString.length;
        }
        if (startPos !== -1 && endPos !== -1) {
            inputString = inputString.slice(startPos + 7, endPos);
        }
        var items = inputString.split(',');
        var parsedData = items.map(function (item) {
            var pair = item.split('=');
            return { [pair[0].toString()]: pair[1] };
        }).reduce(function (result, pair) {
            return Object.assign(result, pair);
        }, {});
        fillFields(parsedData);
        return '';
    } catch (error) {
        // do nothing
    }
}

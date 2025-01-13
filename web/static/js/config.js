//  Variables
var SUB_GROUPNAME_TOPIC = "status/io/sensorhub/triggerBox/groupName/#";
var SUB_GROUPNAME_AREA1 = "txt_groupName1";
var SUB_GROUPNAME_AREA2 = "txt_groupName2";
var SUB_GROUPNAME_AREA3 = "txt_groupName3";
var SUB_GROUPNAME_AREA4 = "txt_groupName4";
var SUB_GROUPNAME_AREA5 = "txt_groupName5";
var SUB_DURATIONTIME_TOPIC = "status/io/sensorhub/triggerBox/durationTime";
var SUB_DURATIONTIME_AREA = "txt_durationTime";
var SUB_SNIFFMODE_TOPIC = "status/io/sensorhub/triggerBox/sniffMode";
var SUB_SNIFFMODE_AREA = "sel_sniffMode";
var SUB_GPIOAND_TOPIC = "status/io/sensorhub/gpio/and";
var SUB_GPIOAND_AREA = "txt_gpioAnd";
var SUB_GPIOSTOP_TOPIC = "status/io/sensorhub/gpio/stop";
var SUB_GPIOSTOP_AREA = "txt_gpioStop";
var SUB_CRASH_TOPIC = "status/io/sensorhub/crash";
var SUB_CRASH_AREA = "sel_crash";

// Initialize previous values of configuration parameters
let prevGroupNames = ['', '', '', '', ''];
let prevSniffMode = '';
let prevDurationTime = '';
let prevGpioAnd = '';
let prevGpioStop = '';
let prevCrashThreshold = '';

// called when a message arrives
const topicHandlers_Conf = {
    status: {
        io: {
            sensorhub: {
                gpio: {
                    and: handleGpioAndMessage,
                    stop: handleGpioStopMessage
                },
                triggerBox: {
                    groupName: {
                        1: handleGroupName1Message,
                        2: handleGroupName2Message,
                        3: handleGroupName3Message,
                        4: handleGroupName4Message,
                        5: handleGroupName5Message
                    },
                    durationTime: handleDurationTimeMessage,
                    sniffMode: handleSniffModeMessage
                },
                crash: handleCrashThresholdMessage
            }
        }
    }
};

function getElementByIdOrThrow(id) {
    const element = document.getElementById(id);
    if (!element) {
        throw new Error('DOM is not ready or the element with id ' + id + ' does not exist');
    }
    return element;
}

function handleMessage(id, payload, prevValue) {
    console.log('handleMessage() called for id: ' + id);
    try {
        const element = getElementByIdOrThrow(id);
        element.value = payload;
        return payload; // return the new value for updating the prevValue
    } catch (error) {
        console.error(error);
    }
}

function handleGpioAndMessage(payload) {
    prevGpioAnd = handleMessage(SUB_GPIOAND_AREA, payload);
}

function handleGpioStopMessage(payload) {
    prevGpioStop = handleMessage(SUB_GPIOSTOP_AREA, payload);
}

function handleGroupName1Message(payload) {
    prevGroupNames[0] = handleMessage(SUB_GROUPNAME_AREA1, payload);
}

function handleGroupName2Message(payload) {
    prevGroupNames[1] = handleMessage(SUB_GROUPNAME_AREA2, payload);
}

function handleGroupName3Message(payload) {
    prevGroupNames[2] = handleMessage(SUB_GROUPNAME_AREA3, payload);
}

function handleGroupName4Message(payload) {
    prevGroupNames[3] = handleMessage(SUB_GROUPNAME_AREA4, payload);
}

function handleGroupName5Message(payload) {
    prevGroupNames[4] = handleMessage(SUB_GROUPNAME_AREA5, payload);
}

function handleDurationTimeMessage(payload) {
    prevDurationTime = handleMessage(SUB_DURATIONTIME_AREA, payload);
}

function handleSniffModeMessage(payload) {
    prevSniffMode = handleMessage(SUB_SNIFFMODE_AREA, payload);
}

function handleCrashThresholdMessage(payload) {
    prevCrashThreshold = handleMessage(SUB_CRASH_AREA, payload);
}

function onMessageArrived_conf(message) {
    if (document.readyState !== 'complete') {
        console.log('Document is not loaded yet, onMessageArrived_conf()');
        return;
    }
    console.log('onMessageArrived_conf() called!');

    const fullTopic = message.destinationName;
    const payload = message.payloadString;
    const topics = fullTopic.split("/");

    let handler = topicHandlers_Conf;
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
    console.log(`onMessageArrived_conf:No topic matched! Topic = ${fullTopic}`);
}

// Check if a value has changed
function hasValueChanged(value, prevValue) {
    return value !== prevValue;
}

// submit data to MQTT broker while clicking submit button
function submitData() {
    console.log('submitData() called!');
    for (let i = 1; i <= 5; i++) {
        const groupNameElement = document.getElementById(`txt_groupName${i}`);
        if (groupNameElement) {
            const groupName = groupNameElement.value;
            if (hasValueChanged(groupName, prevGroupNames[i - 1])) {
                //print out the value change previous and now for all changed group names                
                console.log('Group name ' + i + ' has been changed: ' + prevGroupNames[i - 1] + ' -> ' + groupName);
                publishMessage(`config/ble/groupName/${i}`, groupName);
                prevGroupNames[i - 1] = groupName;
            }
        }
    }
    const sniffMode = document.getElementById(SUB_SNIFFMODE_AREA).value;
    if (hasValueChanged(sniffMode, prevSniffMode)) {
        // print out the value changed. previous and now for sniff mode
        console.log('Sniff mode has been changed: ' + prevSniffMode + ' -> ' + sniffMode);
        publishMessage("config/ble/sniffMode", sniffMode);
        prevSniffMode = sniffMode;
    }
    const durationTime = document.getElementById(SUB_DURATIONTIME_AREA).value;
    if (hasValueChanged(durationTime, prevDurationTime)) {
        // print out the value changed. previous and now
        console.log('Duration time has been changed: ' + prevDurationTime + ' -> ' + durationTime);
        publishMessage("config/ble/durationTime", durationTime);
        prevDurationTime = durationTime;
    }
    const gpioAnd = document.getElementById(SUB_GPIOAND_AREA).value;
    if (hasValueChanged(gpioAnd, prevGpioAnd)) {
        // print out the value changed. previous and now
        console.log('GPIO AND has been changed: ' + prevGpioAnd + ' -> ' + gpioAnd);
        publishMessage("config/ble/gpio/and", gpioAnd);
        prevGpioAnd = gpioAnd;
    }
    const gpioStop = document.getElementById(SUB_GPIOSTOP_AREA).value;
    if (hasValueChanged(gpioStop, prevGpioStop)) {
        // print out the value changed. previous and now
        console.log('GPIO STOP has been changed: ' + prevGpioStop + ' -> ' + gpioStop);
        publishMessage("config/ble/gpio/stop", gpioStop);
        prevGpioStop = gpioStop;
    }
}
// submit data to MQTT broker in crash sensor card that topic is config/system/crash
function submitCrashData() {
    const crash = document.getElementById("sel_crash").value;
    if (hasValueChanged(crash, prevCrashThreshold)) {
        // print out the value changed. previous and now
        console.log('Crash threshold has been changed: ' + prevCrashThreshold + ' -> ' + crash);
        publishMessage("config/system/crash", crash);
        prevCrashThreshold = crash;
    }
}

// submit data to MQTT broker while clicking sync PC time button
function syncPCTime() {
    // get current time of PC followed ISO-8601 format
    let date = new Date();

    let year = date.getFullYear();
    let month = ("0" + (date.getMonth() + 1)).slice(-2); // Months are zero based
    let day = ("0" + date.getDate()).slice(-2);
    let hours = ("0" + date.getHours()).slice(-2);
    let minutes = ("0" + date.getMinutes()).slice(-2);
    let seconds = ("0" + date.getSeconds()).slice(-2);

    // Get the timezone offset in minutes, convert it to hours and format it as "+0800" or "-0800"
    let timezoneOffsetInMinutes = date.getTimezoneOffset();
    let timezoneOffsetInHours = -timezoneOffsetInMinutes / 60;
    let timezoneOffsetSign = timezoneOffsetInHours >= 0 ? '+' : '-';
    let timezoneOffsetAbsolute = Math.abs(timezoneOffsetInHours);
    let timezone = `${timezoneOffsetSign}${("0" + timezoneOffsetAbsolute).slice(-2)}00`;

    let currentTime = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${timezone}`;

    console.log('syncPCTime() called! currentTime: ' + currentTime);
    // publish message to MQTT broker
    publishMessage("config/system/time", currentTime);
}

function trySaveFile() {
    console.log('trySaveFile() called!');
    var blob = new Blob(["Hello, world!"], { type: "text/plain;charset=utf-8" });
    saveAs(blob, "myFile.txt");
}
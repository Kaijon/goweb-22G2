//  Variables
var WebSocket_MQTT_Broker_URL = "";
var MQTT_Client_ID = "557842124707";
var MQTT_Client = "";

// connection status and control variables
var isMqttConnected = false;
var maxRetryAttempts = 1000;
var currentRetryAttempt = 0;

function mqtt_Connect_with_Broker_WS() {
    // Get the current URL
    var currentURL = window.location.href;

    // Extract the IP address from the URL
    var ipAddress = extractIPAddressFromURL(currentURL);

    // Set the MQTT broker URL with the extracted IP address
    WebSocket_MQTT_Broker_URL = "ws://" + ipAddress + ":8083/mqtt";
    // WebSocket_MQTT_Broker_URL = "ws://" + ipAddress + ":8083";

    MQTT_Client_ID = gen_MQTT_Client_ID();
    console.log("MQTT_Broker_URL:" + WebSocket_MQTT_Broker_URL + " MQTT_Client_ID:" + MQTT_Client_ID);

    // Create an MQTT Client instance 
    MQTT_Client = new Paho.MQTT.Client(WebSocket_MQTT_Broker_URL, MQTT_Client_ID);

    // Set callback handlers
    MQTT_Client.onConnectionLost = onConnectionLost;
    MQTT_Client.onMessageArrived = onMessageArrived;

    // Attempt MQTT connection
    connectWithRetry();
}

// Function to extract IP address from a URL
function extractIPAddressFromURL(url) {
    var ipAddress = "127.0.0.1";

    // Regular expression to match IP address
    var ipRegex = /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/;

    // Use the regex to find the first IP address in the URL
    var match = url.match(ipRegex);

    if (match) {
        ipAddress = match[0];
    }

    return ipAddress;
}

function connectWithRetry() {
    // Connect to the MQTT Broker with callbacks for success and failure
    MQTT_Client.connect({
        onSuccess: function () {
            console.log("Connected to MQTT Broker");
            mqttConnected = true;
            onConnect();
        },
        onFailure: function (message) {
            // connection failed, look at the error message for more details
            console.log("Connection failed: " + message.errorMessage);
            mqttConnected = false;
            currentRetryAttempt++;

            if (currentRetryAttempt < maxRetryAttempts) {
                // keep connect once < mainRetry times
                console.log("Retrying connection (Attempt " + currentRetryAttempt + ")");
                // timeout 5 seconds before retrying connection
                setTimeout(connectWithRetry, 5000);
            } else {
                // total tried: 5s * maxRetryAttempts (1000 times) = 5000s = 83.33 minutes = 1.39 hours
                console.log("Max retry attempts reached. Connection failed.");
                onConnectionFailure();
            }
        }
    });
}


// Subscribe to MQTT Topic
function subscribeTopic(topic) {
    console.log("subscribe Topic:" + topic);
    MQTT_Client.subscribe(topic);
}

// Unsubscribe to MQTT Topic
function unsubscribeTopic(topic) {
    console.log("unsubscribe Topic:" + topic);
    MQTT_Client.unsubscribe(topic);
}

// publish message to MQTT Topic
function publishMessage(topic, message) {
    console.log("publish message to Topic:" + topic);
    if (isMqttConnected) {
        message = new Paho.MQTT.Message(message);
        message.destinationName = topic;
        MQTT_Client.send(message);
        message.qos = 0;
        message.retained = false;
    } else {
        console.log("MQTT client is not connected.");
        // connect to Broker again
        mqtt_Connect_with_Broker_WS();
    }
}

// publish message to MQTT Topic with QoS and retain options
function publishMessageWithOpt(topic, message, qos, retain) {
    console.log(`publish message to Topic: ${topic}, QoS: ${qos}, Retain: ${retain}`);
    if (isMqttConnected) {
        message = new Paho.MQTT.Message(message);
        message.destinationName = topic;
        message.qos = qos;
        message.retained = retain;
        MQTT_Client.send(message);
    } else {
        console.log("MQTT client is not connected.");
    }
}

// called when the client connected
function onConnect() {
    isMqttConnected = true;
}

// called when the client loses its connection
function onConnectionLost(responseObject) {
    if (responseObject.errorCode !== 0) {
        console.log('lost connection with MQTT Broker. Error: ' + responseObject.errorMessage);
        console.log("Reconnecting...");
        isMqttConnected = false;
        try {
            mqtt_Connect_with_Broker_WS();
        } catch (error) {
            console.error("Failed to connect to MQTT broker:", error);
            // Handle the error or retry the connection
        }
    }
}

// Get Formatted time in Hour:Minute:Seconds AM/PM format
function get_Formatted_Time() {
    var dt = new Date();
    var hours = dt.getHours() == 0 ? "12" : dt.getHours() > 12 ? dt.getHours() - 12 : dt.getHours();
    var minutes = (dt.getMinutes() < 10 ? "0" : "") + dt.getMinutes();
    var seconds = dt.getSeconds();
    var ampm = dt.getHours() < 12 ? "AM" : "PM";
    var formattedTime = hours + ":" + minutes + ":" + seconds + " " + ampm;
    return formattedTime;
}

//  generate Client ID randomly
function gen_MQTT_Client_ID() {
    return String(Math.floor(100000000000 + Math.random() * 900000000000));
}

var topicHandlers = {
    'fota': {
        'info/#': {
            handler: [onMessageArrived_Fota],
        },
    },
    'info': {
        handler: [onMessageArrived_Info],
    },
    'test': {
        'nmea/#': {
            handler: [onMessageArrived_gps],
        },
    },
    'status': {
        'fota/#': {
            handler: [onMessageArrived_Fota],
        },
        'topology/#': {
            handler: [onMessageArrived_Connection],
        },
        'io': {
            'sensorhub': {
                'triggerBox/#': {
                    handler: [onMessageArrived_conf],
                },
                'gpio/#': {
                    handler: [onMessageArrived_conf],
                },
                'crash/#': {
                    handler: [onMessageArrived_conf],
                },
                'events/#': {
                    handler: [onMessageArrived_Info],
                },
            },
        },
    },
    // 'global/#': {
    //     handler: [onMessageArrived_Factory],
    // },
    'factory': {
        'info/#': {
            handler: [onMessageArrived_Factory],
        },
    },
};

// called when a message arrives
function onMessageArrived(message) {
    const fullTopic = message.destinationName;
    const payload = message.payloadString;
    const topics = fullTopic.split("/");

    let currentHandler = topicHandlers;
    for (let i = 0; i < topics.length; i++) {
        if (Object.keys(currentHandler).includes(topics[i] + '/#')) {
            currentHandler = currentHandler[topics[i] + '/#'];
            break;
        }
        currentHandler = currentHandler[topics[i]];
        if (!currentHandler) {
            console.log(`No handler for topic ${fullTopic} |` + topics[i]);
            return;
        }
    }

    if (currentHandler.handler) {
        currentHandler.handler.forEach(function (func) {
            func(message);
        });
    } else {
        console.log(`No function for topic ${fullTopic}`);
    }
}

// Add a dynamic topic handler at runtime
function addDynamicTopicHandler(topic, handler) {
    console.log(`Adding dynamic topic handler for topic ${topic}`);

    var topics = topic.split("/");
    var currentHandler = topicHandlers;

    for (let i = 0; i < topics.length; i++) {
        if (!currentHandler[topics[i]]) {
            currentHandler[topics[i]] = {};
        }
        // if the topic is already existed, add it but replace it.
        if (currentHandler[topics[i]].handler) {
            currentHandler[topics[i]].handler.push(handler);
            return;
        }
        currentHandler = currentHandler[topics[i]];
    }

    if (!currentHandler.handler) {
        currentHandler.handler = [];
    }

    currentHandler.handler.push(handler);
    //print out the detail currentHandler handler number and related topic + handler function as  topicHandlers = {}
    let topicHandlersForLog = Object.keys(topicHandlers).reduce((result, key) => {
        result[key] = topicHandlers[key] instanceof Function ? topicHandlers[key].name : topicHandlers[key];
        return result;
    }, {});

    console.log(`topicHandlers = ${JSON.stringify(topicHandlersForLog)}`);
}

// Remove a dynamic topic handler at runtime
function removeDynamicTopicHandler(topic) {
    console.log(`Removing dynamic topic handler for topic ${topic}`);

    var topics = topic.split("/");
    var currentHandler = topicHandlers;

    for (let i = 0; i < topics.length; i++) {
        if (!currentHandler[topics[i]]) {
            console.log(`No handler for topic ${topic}`);
            return;
        }
        currentHandler = currentHandler[topics[i]];
    }

    if (currentHandler.handler) {
        currentHandler.handler = [];
    }
}
// implement entLoadDefault click event that do publish config/system/loadDefault with value 'yes'
function btnPublishReceiveTopicResult(buttonId, resultTopic, message, backgroundColor) {
    console.log(`btnPublishReceiveTopicResult() called! Button ID: ${buttonId}, backgroundColor: ${backgroundColor}`);
    var button = document.getElementById(buttonId);
    var originalInnerHTML = button.innerHTML;
    button.style.backgroundColor = "gray";
    button.disabled = true;
    button.innerHTML = "Processing...";
    // create a handle function that function name is id of the test tag and handle the result
    var handler = function (msg) {
        console.log(`btnPublishReceiveTopicResult: Received message: ${msg.payloadString}`)
        var payload = msg.payloadString;
        if (payload === "done") {
            // Change the background color of the button to the specified color
            //var button = document.getElementById(buttonId);
            if (button) {
                button.style.backgroundColor = backgroundColor;
                button.title = "done";
                button.innerHTML = originalInnerHTML;
            }
        }
    }
    addDynamicTopicHandler(resultTopic, handler);
    // subscribe to the topic
    subscribeTopic(resultTopic);
    // publish the message
    publishMessage(resultTopic, message);
}

/* implemnt button that do as btnPublishReceiveTopicResult but the payload is a BASE64 binary file and the handler is a function that 
save the message to ~/download/<date-time>.zip file after translate it from BASE64 to binary. */
function btnPublishReceiveTopicResultDownload(buttonId, resultTopic, message, backgroundColor) {
    console.log(`btnPublishReceiveTopicResultDownload() called! Button ID: ${buttonId}, backgroundColor: ${backgroundColor}`);
    // clear the previous handler if it exists
    removeDynamicTopicHandler(resultTopic);
    // change buttonId's backgroundColor to gray for processing and disable this button
    var button = document.getElementById(buttonId);
    if (!button) {
        alert('Button with id ' + buttonId + ' does not exist');
        return;
    }
    var originalInnerHTML = button.innerHTML;
    button.style.backgroundColor = "gray";
    button.disabled = true;
    button.innerHTML = "Processing...";
    // create a handle function that function name is id of the test tag and handle the result
    var handler = function (msg) {
        console.log(`btnPublishReceiveTopicResultDownload: Received message: ${msg.payloadString}`)
        var payload = msg.payloadString;
        // Save the file to the download folder
        var arrayBuffer = function base64ToArrayBuffer(payload) {
            var binaryString = window.atob(payload);
            var len = binaryString.length;
            var bytes = new Uint8Array(len);
            for (var i = 0; i < len; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            return bytes.buffer;
        }
        var blob = new Blob([arrayBuffer(payload)], { type: 'application/gzip' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;

        // Create a date string for the file name
        var date = new Date();
        var dateString = date.getFullYear() +
            ("0" + (date.getMonth() + 1)).slice(-2) +
            ("0" + date.getDate()).slice(-2) + "_" +
            ("0" + date.getHours()).slice(-2) +
            ("0" + date.getMinutes()).slice(-2) +
            ("0" + date.getSeconds()).slice(-2);

        a.download = dateString + '.tar.gz';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        // Change the background color of the button to the specified color and enable the button again
        button.style.backgroundColor = backgroundColor;
        button.title = "done";
        // button.disabled = false;
        button.innerHTML = originalInnerHTML;
    }
    // publish the message
    publishMessage(resultTopic, message);

    addDynamicTopicHandler(resultTopic, handler);
    // subscribe to the topic
    subscribeTopic(resultTopic);
}
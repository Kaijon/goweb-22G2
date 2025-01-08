//  Variables
var SUB_INFO_TOPIC = "info";
var SUB_INFO_AREA = "txt_sysInfo";
var SUB_EVENTS_TOPIC = "status/io/sensorhub/events/#";

// called when a message arrives
const topicHandlers_Info = {
    info: handleInfoMessage,
};

function onMessageArrived_Info(message) {
    if (document.readyState !== 'complete') {
        console.log('Document is not loaded yet, onMessageArrived_Info()');
        return;
    }
    console.log('onMessageArrived_Info() called!');

    const fullTopic = message.destinationName;
    const payload = message.payloadString;
    const topics = fullTopic.split("/");

    let handler = topicHandlers_Info;
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
    console.log(`onMessageArrived_Info:No topic matched! Topic = ${fullTopic}`);
} 

function handleInfoMessage(payload) {
    console.log('handleInfoMessage() called!');
    const cardBody = document.getElementById(SUB_INFO_AREA);
    if (cardBody == null) {
        console.log("cardBody not found");
        return;
    }

    try {
        const jsonData = JSON.parse(payload);
        let formattedPayload = `
            <div class="card mt-3" style="border-radius: 10px;">
                <div class="card-header bg-secondary text-white" style="border-top-left-radius: 10px; border-top-right-radius: 10px;">
                    <h5 class="mb-0">
                        <i class="fa fa-camera-retro mr-2"></i>System Information
                    </h5>
                </div>
                <div class="card-body p-0">
                    <table class="table table-striped table-hover mb-0" style="text-align: center;">
                        <tbody>`;
        for (const key in jsonData) {
            if (jsonData.hasOwnProperty(key)) {
                formattedPayload += `
                            <tr>
                                <th scope="row" style="text-align: right; width: 30%; vertical-align: middle;">${key}</th>
                                <td style="text-align: left; width: 70%; vertical-align: middle;">${jsonData[key]}</td>
                            </tr>`;
            }
        }
        formattedPayload += `
                        </tbody>
                    </table>
                </div>
            </div>`;
        cardBody.innerHTML = formattedPayload;
        cardBody.scrollTop = cardBody.scrollHeight;
    } catch (e) {
        console.log('Invalid JSON payload:', payload);
        cardBody.innerHTML = 'Invalid JSON data received';
    }
}
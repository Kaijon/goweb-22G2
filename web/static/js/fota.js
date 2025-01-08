//  Variables
//var SUB_FOTA_TOPIC = "fota/#";
var SUB_FOTA_TOPIC = "status/fota/#";
var SUB_FOTA_AREA = "progress_info";
var SUB_EVENTS_TOPIC = "fota/#";

// called when a message arrives
const topicHandlers_Fota = {
    fota: {
        info: handleFotaMessage
    },
    status: {
        fota: {
            0: handleFota0Message,
            1: handleFota1Message,
            2: handleFota2Message,
            3: handleFota3Message,
            3: handleFota3Message,
            4: handleFota4Message,
            5: handleFota5Message,
            6: handleFota6Message,
            7: handleFota7Message
        }
    }
};

function onMessageArrived_Fota(message) {
    console.log(`onMessageArrived_Fota`)
    if (document.readyState !== 'complete') {
        console.log('Document is not loaded yet, onMessageArrived_Fota()');
        return;
    }
    console.log('onMessageArrived_Fota() called!');

    const fullTopic = message.destinationName;
    const payload = message.payloadString;
    const topics = fullTopic.split("/");

    let handler = topicHandlers_Fota;
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

//function handleFotaMessage(payloada) {
//    console.log('handleInfoMessage() called!');
//    const formattedPayload = payloada.replace(/\n/g, '<br>');
//    const cardBody = document.getElementById(SUB_FOTA_AREA);
//    // check if the cardBody exists
//    if (cardBody == null) {
//        console.log("cardBody not found");
//        return;
//    }
//    cardBody.innerHTML = formattedPayload;
//    cardBody.scrollTop = cardBody.scrollHeight;
//}

var formattedPayload = '';
function handleFotaMessage(payload) {
    console.log('handleInfoMessage() called!');
    // check if the cardBody exists
    const cardBody = document.getElementById(SUB_FOTA_AREA);
    if (cardBody == null) {
        console.log("cardBody not found");
        return;
    }
    //let formattedPayload = '';
    let parsedPayload;
    let fotaMessages = [];

    try {
        parsedPayload = JSON.parse(payload);
    } catch (error) {
        console.log(`Fail to parse JSON text`);
        cardBody.innerHTML = "Fail to parse JSON text";
        cardBody.scrollTop = cardBody.scrollHeight;
        return; 
    }

    fotaMessages.push(parsedPayload);
    fotaMessages.forEach((message, index) => {
        //formattedPayload += `<strong>Message ${index + 1}:</strong><br>`;
        
        // Create a map to store key-value pairs
        const messageMap = new Map(Object.entries(message));

        messageMap.forEach((value, key) => {
            switch (key) {
                case 'percentage':
                    formattedPayload += `Percentage: ${value}%<br>`;
                    break;
                case 'status':
                    if (value === `success`) {
                        formattedPayload += `<h4 style="color:#9900FF"><strong>FOTA Update Finish, Please Reboot</strong></h4>`;
                    } else {
                        formattedPayload += `<h4 style="color:#F00000"><strong>FOTA Update Failure</strong></h4>`;
                    }
                    break;
                default:
                    formattedPayload += `${key}: ${value}<br>`;
                    break;
            }
        });

        //formattedPayload += '<br>';
    });


    cardBody.innerHTML = formattedPayload;
    cardBody.scrollTop = cardBody.scrollHeight;
}

function handleFota0Message(payload) {
    console.log('handleFota_0_Message() called!');
    // check if the cardBody exists
    const cardBody = document.getElementById(SUB_FOTA_AREA);
    if (cardBody == null) {
        console.log("cardBody not found");
        return;
    }

    //let formattedPayload = '';
    let parsedPayload;
    let fotaMessages = [];

    try {
        parsedPayload = JSON.parse(payload);
    } catch (error) {
        console.log(`Fail to parse JSON text`);
        cardBody.innerHTML = "Fail to parse JSON text";
        cardBody.scrollTop = cardBody.scrollHeight;
        return; 
    }

    fotaMessages.push(parsedPayload);
    fotaMessages.forEach((message, index) => {
        formattedPayload += `<strong>Message:</strong><br>`;
        
        // Create a map to store key-value pairs
        const messageMap = new Map(Object.entries(message));

        messageMap.forEach((value, key) => {
            switch (key) {
                case 'status':
                    formattedPayload += `Extract Image, Status: ${value}<br>`;
                    break;
                default:
                    formattedPayload += `${key}: ${value}<br>`;
                    break;
            }
        });

        //formattedPayload += '<br>';
    });


    cardBody.innerHTML = formattedPayload;
    cardBody.scrollTop = cardBody.scrollHeight;
}

function handleFota1Message(payload) {
    console.log('handleFota_1_Message() called!');
    // check if the cardBody exists
    const cardBody = document.getElementById(SUB_FOTA_AREA);
    const progress = document.getElementById('part1');
    if (cardBody == null) {
        console.log("cardBody not found");
        return;
    }
    if (progress == null) {
        console.log("progress not found");
    }
    let parsedPayload;
    let fotaMessages = [];

    try {
        parsedPayload = JSON.parse(payload);
    } catch (error) {
        console.log(`Fail to parse JSON text`);
        cardBody.innerHTML = "Fail to parse JSON text";
        cardBody.scrollTop = cardBody.scrollHeight;
        return; 
    }

    fotaMessages.push(parsedPayload);
    fotaMessages.forEach((message, index) => {
        
        // Create a map to store key-value pairs
        const messageMap = new Map(Object.entries(message));

        messageMap.forEach((value, key) => {
            switch (key) {
                case 'percentage':
                    formattedPayload += `Percentage: ${value}%<br>`;
                    break;
                case 'status':
                    formattedPayload += `Part1, Status: ${value}<br>`;
                    //progressMessage({ payloadString: '50' });
                    progress.click();
                    break;
                default:
                    formattedPayload += `${key}: ${value}<br>`;
                    break;
            }
        });

        //formattedPayload += '<br>';
    });


    cardBody.innerHTML = formattedPayload;
    cardBody.scrollTop = cardBody.scrollHeight;    
}

function handleFota2Message(payload) {
    console.log('handleFota_2_Message() called!');
    // check if the cardBody exists
    const cardBody = document.getElementById(SUB_FOTA_AREA);
    const progress = document.getElementById('part2');
    if (cardBody == null) {
        console.log("cardBody not found");
        return;
    }
    if (progress == null) {
        console.log("progress not found");
    }
    let parsedPayload;
    let fotaMessages = [];

    try {
        parsedPayload = JSON.parse(payload);
    } catch (error) {
        console.log(`Fail to parse JSON text`);
        cardBody.innerHTML = "Fail to parse JSON text";
        cardBody.scrollTop = cardBody.scrollHeight;
        return; 
    }

    fotaMessages.push(parsedPayload);
    fotaMessages.forEach((message, index) => {
        //formattedPayload += `<strong>Message ${index + 1}:</strong><br>`;
        
        // Create a map to store key-value pairs
        const messageMap = new Map(Object.entries(message));

        messageMap.forEach((value, key) => {
            switch (key) {
                case 'percentage':
                    formattedPayload += `Percentage: ${value}%<br>`;
                    break;
                case 'status':
                    formattedPayload += `Part2, Status: ${value}<br>`;
                    progress.click();
                    break;
                default:
                    formattedPayload += `${key}: ${value}<br>`;
                    break;
            }
        });

        //formattedPayload += '<br>';
    });

    cardBody.innerHTML = formattedPayload;
    cardBody.scrollTop = cardBody.scrollHeight;
}

var num = 0;
function handleFota3Message(payload) {
    console.log('handleFota_3_Message() called!');
    // check if the cardBody exists
    const cardBody = document.getElementById(SUB_FOTA_AREA);
    const progress = document.getElementById('part3');
    if (cardBody == null) {
        console.log("cardBody not found");
        return;
    }
    if (progress == null) {
        console.log("progress not found");
    }

    let parsedPayload;
    let fotaMessages = [];

    try {
        parsedPayload = JSON.parse(payload);
    } catch (error) {
        console.log(`Fail to parse JSON text`);
        cardBody.innerHTML = "Fail to parse JSON text";
        cardBody.scrollTop = cardBody.scrollHeight;
        return; 
    }

    var term = '';
    if (num===0) {
        term = "Part3-a";
    }
    else {
        term = "Part3-b";
    }
    term = "Part3";

    fotaMessages.push(parsedPayload);
    fotaMessages.forEach((message, index) => {
        //formattedPayload += `<strong>Message ${index + 1}:</strong><br>`;
        
        // Create a map to store key-value pairs
        const messageMap = new Map(Object.entries(message));

        messageMap.forEach((value, key) => {
            switch (key) {
                case 'percentage':
                    formattedPayload += `Percentage: ${value}%<br>`;
                    break;
                case 'status':
                    formattedPayload += `${term}, Status: ${value}<br>`;
                    num++;
                    //if (num === 2) {
                        progress.click(); 
                    //}
                    break;
                default:
                    formattedPayload += `${key}: ${value}<br>`;
                    break;
            }
        });

        //formattedPayload += '<br>';
    });

    cardBody.innerHTML = formattedPayload;
    cardBody.scrollTop = cardBody.scrollHeight;
}

function handleFota4Message(payload) {
    console.log('handleFota_4_Message() called!');
    // check if the cardBody exists
    const cardBody = document.getElementById(SUB_FOTA_AREA);
    const progress = document.getElementById('part4');
    if (cardBody == null) {
        console.log("cardBody not found");
        return;
    }
    if (progress == null) {
        console.log("progress not found");
    }

    let parsedPayload;
    let fotaMessages = [];

    try {
        parsedPayload = JSON.parse(payload);
    } catch (error) {
        console.log(`Fail to parse JSON text`);
        cardBody.innerHTML = "Fail to parse JSON text";
        cardBody.scrollTop = cardBody.scrollHeight;
        return; 
    }

    fotaMessages.push(parsedPayload);
    fotaMessages.forEach((message, index) => {
        //formattedPayload += `<strong>Message ${index + 1}:</strong><br>`;
        
        // Create a map to store key-value pairs
        const messageMap = new Map(Object.entries(message));

        messageMap.forEach((value, key) => {
            switch (key) {
                case 'percentage':
                    formattedPayload += `Percentage: ${value}%<br>`;
                    break;
                case 'status':
                    formattedPayload += `Part4, Status: ${value}<br>`;
                    progress.click();
                    break;
                default:
                    formattedPayload += `${key}: ${value}<br>`;
                    break;
            }
        });

        //formattedPayload += '<br>';
    });

    cardBody.innerHTML = formattedPayload;
    cardBody.scrollTop = cardBody.scrollHeight;
}

function handleFota5Message(payload) {
    console.log('handleFota_5_Message() called!');
    // check if the cardBody exists
    const cardBody = document.getElementById(SUB_FOTA_AREA);
    const progress = document.getElementById('part5');
    if (cardBody == null) {
        console.log("cardBody not found");
        return;
    }
    if (progress == null) {
        console.log("progress not found");
    }

    let parsedPayload;
    let fotaMessages = [];

    try {
        parsedPayload = JSON.parse(payload);
    } catch (error) {
        console.log(`Fail to parse JSON text`);
        cardBody.innerHTML = "Fail to parse JSON text";
        cardBody.scrollTop = cardBody.scrollHeight;
        return; 
    }

    fotaMessages.push(parsedPayload);
    fotaMessages.forEach((message, index) => {
        //formattedPayload += `<strong>Message ${index + 1}:</strong><br>`;
        
        // Create a map to store key-value pairs
        const messageMap = new Map(Object.entries(message));

        messageMap.forEach((value, key) => {
            switch (key) {
                case 'percentage':
                    formattedPayload += `Percentage: ${value}%<br>`;
                    break;
                case 'status':
                    formattedPayload += `Part5, Status: ${value}<br>`;
                    progress.click();
                    break;
                default:
                    formattedPayload += `${key}: ${value}<br>`;
                    break;
            }
        });

        //formattedPayload += '<br>';
    });

    cardBody.innerHTML = formattedPayload;
    cardBody.scrollTop = cardBody.scrollHeight;
}

function handleFota6Message(payload) {
    console.log('handleFota_6_Message() called!');
    // check if the cardBody exists
    const cardBody = document.getElementById(SUB_FOTA_AREA);
    const progress = document.getElementById('part6');
    if (cardBody == null) {
        console.log("cardBody not found");
        return;
    }
    if (progress == null) {
        console.log("progress not found");
    }

    let parsedPayload;
    let fotaMessages = [];

    try {
        parsedPayload = JSON.parse(payload);
    } catch (error) {
        console.log(`Fail to parse JSON text`);
        cardBody.innerHTML = "Fail to parse JSON text";
        cardBody.scrollTop = cardBody.scrollHeight;
        return; 
    }

    fotaMessages.push(parsedPayload);
    fotaMessages.forEach((message, index) => {
        //formattedPayload += `<strong>Message ${index + 1}:</strong><br>`;
        
        // Create a map to store key-value pairs
        const messageMap = new Map(Object.entries(message));

        messageMap.forEach((value, key) => {
            switch (key) {
                case 'percentage':
                    formattedPayload += `Percentage: ${value}%<br>`;
                    break;
                case 'status':
                    formattedPayload += `Part6, Status: ${value}<br>`;
                    progress.click();
                    break;
                default:
                    formattedPayload += `${key}: ${value}<br>`;
                    break;
            }
        });

        //formattedPayload += '<br>';
    });

    cardBody.innerHTML = formattedPayload;
    cardBody.scrollTop = cardBody.scrollHeight;
}

function handleFota7Message(payload) {
    console.log('handleFota_7_Message() called!');
    // check if the cardBody exists
    const cardBody = document.getElementById(SUB_FOTA_AREA);
    const progress = document.getElementById('part7');
    if (cardBody == null) {
        console.log("cardBody not found");
        return;
    }
    if (progress == null) {
        console.log("progress not found");
    }

    let parsedPayload;
    let fotaMessages = [];

    try {
        parsedPayload = JSON.parse(payload);
    } catch (error) {
        console.log(`Fail to parse JSON text`);
        cardBody.innerHTML = "Fail to parse JSON text";
        cardBody.scrollTop = cardBody.scrollHeight;
        return; 
    }

    fotaMessages.push(parsedPayload);
    fotaMessages.forEach((message, index) => {
        //formattedPayload += `<strong>Message ${index + 1}:</strong><br>`;
        
        // Create a map to store key-value pairs
        const messageMap = new Map(Object.entries(message));

        messageMap.forEach((value, key) => {
            switch (key) {
                case 'percentage':
                    formattedPayload += `Percentage: ${value}%<br>`;
                    break;
                case 'status':
                    formattedPayload += `Part7, Status: ${value}<br>`;
                    progress.click();
                    break;
                default:
                    formattedPayload += `${key}: ${value}<br>`;
                    break;
            }
        });

        //formattedPayload += '<br>';
    });

    cardBody.innerHTML = formattedPayload;
    cardBody.scrollTop = cardBody.scrollHeight;
}


















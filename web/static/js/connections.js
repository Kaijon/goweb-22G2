//  Variables
var SUB_CONNECTED_DEV_TOPIC = "status/topology/#";

// Define a mapping of topics to handler functions
const topicHandlers_conn = {
    'status': {
        'topology': handleConnectedDevEventMessage
    }
};

function onMessageArrived_Connection(message) {
    if (document.readyState !== 'complete') {
        console.log('Document is not loaded yet, onMessageArrived_Connection()');
        return;
    }
    console.log('onMessageArrived_Connection() called!');

    const fullTopic = message.destinationName;
    const payload = message.payloadString;
    const topics = fullTopic.split("/");

    // Use the topics array to navigate the topicHandlers_conn object
    let handler = topicHandlers_conn;
    for (let i = 0; i < topics.length; i++) {
        handler = handler[topics[i]];
        if (typeof handler === 'undefined') {
            console.log(`No topic matched! Topic = ${topics[i]}`);
            return;
        }
        if (typeof handler === 'function') {
            // If we've found a function, call it with the remaining topics as arguments
            handler.apply(null, topics.slice(i + 1).concat(payload));
            return;
        }
    }
    console.log('No handler function found!');
}

var cardTimeouts = {};
// preserve valueCells for each device
var valueCells = {};

function handleConnectedDevEventMessage(dev_type, dev_sn, payload) {
    console.log('handleConnectedDevEventMessage() called with payload: ' + payload);

    var deviceCard = document.getElementById(dev_sn);

    if (payload == 'refreshing') {
        console.log('payload is refreshing');
        if (deviceCard != null) {
            if (cardTimeouts[dev_sn]) {
                clearTimeout(cardTimeouts[dev_sn]);
            }
            cardTimeouts[dev_sn] = setTimeout(function () {
                if (cardTimeouts[dev_sn]) {
                    console.log('setTimeout() called for dev_sn: ' + dev_sn);
                    deviceCard.remove();
                    for (var key in valueCells) {
                        if (key.startsWith(dev_sn)) {
                            delete valueCells[key];
                        }
                    }
                }
            }, 3000);  // 3 seconds
        }
        return;
    } else if (dev_sn in cardTimeouts) {
        console.log('clearTimeout() called for dev_sn: ' + dev_sn);
        clearTimeout(cardTimeouts[dev_sn]);
    }

    if (deviceCard && 'id' in deviceCard && deviceCard.id == dev_sn) {
        console.log('card: ' + JSON.stringify(deviceCard), 'dev_sn: ' + dev_sn, 'card.id: ' + deviceCard.id);
        updateConnectedDevCard(dev_type, dev_sn, payload);
    } else {
        console.log('card is null or does not have an id property');
        createConnectedDevCard(dev_type, dev_sn, payload);
    }
}


function updateConnectedDevCard(dev_type, dev_sn, payload) {
    console.log('updateConnectedDevCard() called with payload: ' + payload);

    const data = {
        SKU: dev_type,
        SN: dev_sn,
        ...Object.fromEntries(
            payload.split(',').map(s => s.split('=', 2))
        )
    };

    const card = document.getElementById(dev_sn);
    if (!card) {
        console.log("card not found");
        return;
    }

    const table = card.getElementsByTagName("table")[0];
    if (!table) {
        console.log("table not found");
        return;
    }

    for (const key in data) {
        const valueCell = valueCells[dev_sn + key];
        if (valueCell) {
            valueCell.textContent = data[key];
        } else {
            console.log('No cell found for key: ' + key);
        }
    }
}

function createConnectedDevCard(dev_type, dev_sn, payload) {
    console.log('createConnectedDevCard() called with payload: ' + payload);

    const data = {
        SKU: dev_type,
        SN: dev_sn,
        ...Object.fromEntries(
            payload.split(',').map(s => s.split('=', 2))
        )
    };

    const card = document.createElement('div');
    card.id = dev_sn;
    card.className = 'card';
    card.style.width = '95%';
    card.style.animation = 'slide-up 0.5s ease-out';

    const cardBody = document.createElement('div');
    cardBody.className = 'card-body';
    card.appendChild(cardBody);

    const table = document.createElement('table');
    card.appendChild(table);

    const keyRow = document.createElement('tr');
    const valueRow = document.createElement('tr');
    table.append(keyRow, valueRow);

    for (const key in data) {
        const keyCell = document.createElement('td');
        keyCell.textContent = key;
        keyRow.appendChild(keyCell);

        const valueCell = document.createElement('td');
        valueCell.textContent = data[key];
        valueRow.appendChild(valueCell);

        valueCells[`${dev_sn}${key}`] = valueCell;
    }

    const container = document.getElementById('ConnDev');
    container.style.display = 'flex';
    container.style.flexDirection = 'column-reverse';
    container.appendChild(card);
}
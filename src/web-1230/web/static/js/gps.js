//  Variables
var SUB_GPS_TOPIC = "test/nmea";
var SUB_GPS_AREA = "txtAr_nmea";

let NMEAstatus = false; // initial status

function toggleStatus() {
    NMEAstatus = !NMEAstatus; // toggle status
    document.getElementById('statusButton').value = NMEAstatus ? 'Turn NMEA OFF' : 'Turn NMEA ON';
    console.log('NMEAstatus = ' + NMEAstatus);

    publishMessage(`config/gps/cmd/nmea`, NMEAstatus ? 'on' : 'off');
}

// Define a mapping of topics to handler functions
const topicHandlers_gps = {
    'test': {
        'nmea': handleGpsMessage
    }
};

// called when a message arrives
function onMessageArrived_gps(message) {
    if (document.readyState !== 'complete') {
        console.log('Document is not loaded yet, onMessageArrived_gps()');
        return;
    }
    console.log('onMessageArrived_gps() called!');

    const fullTopic = message.destinationName;
    const payload = message.payloadString;
    const topics = fullTopic.split("/");

    // Use the topics array to navigate the topicHandlers_gps object
    let handler = topicHandlers_gps;
    for (let i = 0; i < topics.length; i++) {
        handler = handler[topics[i]];
        if (typeof handler === 'undefined') {
            console.log(`No topic matched! Topic = ${topics[i]}`);
            return;
        }
        if (typeof handler === 'function') {
            handler(payload);
            return;
        }
    }
    console.log('No handler function found!');
}

function handleGpsMessage(payload) {
    console.log('handleGpsMessage() called!');
    document.getElementById(SUB_GPS_AREA).value = document.getElementById(SUB_GPS_AREA).value + payload + "\n";
    document.getElementById(SUB_GPS_AREA).scrollTop = document.getElementById(SUB_GPS_AREA).scrollHeight;
}

function clear_Nmea() {
    document.getElementById(SUB_GPS_AREA).value = "";
}

function copyToClipboard() {
    var txtArnmea = document.getElementById('txtAr_nmea').value;
    if (!txtArnmea) {
        console.error('No value to copy');
        return;
    }
    if (navigator.clipboard) {
        // Use Clipboard API if available
        navigator.clipboard.writeText(txtArnmea).then(function () {
            console.log('Copying to clipboard was successful!');
        }, function (err) {
            console.error('Could not copy text: ', err);
        });
    } else if (window.clipboardData) {
        // Use execCommand for Internet Explorer
        window.clipboardData.setData('Text', txtArnmea);
        console.log('Copying to clipboard was successful!');
    } else {
        // Fallback for other browsers
        var textArea = document.createElement('textarea');
        textArea.value = txtArnmea;
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
            var successful = document.execCommand('copy');
            var msg = successful ? 'successful' : 'unsuccessful';
            console.log('Copying text command was ' + msg);
        } catch (err) {
            console.error('Could not copy text: ', err);
        }
        document.body.removeChild(textArea);
    }
}
// Save NMEA textArea to local file with default filename (nmea_<timestamp>.txt)
async function saveNMEAFile() {
    if ('showOpenFilePicker' in window) {
        // Modern browsers (including Chrome, Edge, and Firefox)
        try {
            const now = new Date();
            const timestamp = `${now.getFullYear()}${(now.getMonth() + 1)
                .toString()
                .padStart(2, '0')}${now
                    .getDate()
                    .toString()
                    .padStart(2, '0')}${now
                        .getHours()
                        .toString()
                        .padStart(2, '0')}${now
                            .getMinutes()
                            .toString()
                            .padStart(2, '0')}${now.getSeconds().toString().padStart(2, '0')}`;

            const suggestedName = `nmea_${timestamp}.txt`;

            const fileHandle = await window.showSaveFilePicker({
                suggestedName: suggestedName,
            });
            const writable = await fileHandle.createWritable();
            const content = document.getElementById('txtAr_nmea').value;
            await writable.write(content);
            await writable.close();
            console.log('File saved successfully.');
        } catch (error) {
            console.error('Error saving the file:', error);
        }
    } else if ('showDirectoryPicker' in window) {
        // Fallback for older browsers (Safari, Internet Explorer, etc.)
        try {
            const now = new Date();
            const timestamp = `${now.getFullYear()}${(now.getMonth() + 1)
                .toString()
                .padStart(2, '0')}${now
                    .getDate()
                    .toString()
                    .padStart(2, '0')}${now
                        .getHours()
                        .toString()
                        .padStart(2, '0')}${now
                            .getMinutes()
                            .toString()
                            .padStart(2, '0')}${now.getSeconds().toString().padStart(2, '0')}`;

            const suggestedName = `nmea_${timestamp}.txt`;

            const directoryHandle = await window.showDirectoryPicker();
            const fileHandle = await directoryHandle.getFileHandle(suggestedName, {
                create: true,
            });
            const writable = await fileHandle.createWritable();
            const content = document.getElementById('txtAr_nmea').value;
            await writable.write(content);
            await writable.close();
            console.log('File saved successfully.');
        } catch (error) {
            console.error('Error saving the file:', error);
        }
    } else {
        console.error('File System Access API is not supported in this browser.');
    }
}


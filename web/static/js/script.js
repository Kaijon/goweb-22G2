// common projectCode 
var projectCode = "CA-NF22 G2";

// common variables
var iBytesUploaded = 0;
var iBytesTotal = 0;
var iPreviousBytesLoaded = 0;
var iMaxFilesize = 1048576; // 1MB
var oTimer = 0;
var sResultFileSize = '';
var cnt = 0;

var currentHtml = '';

function doesElementExist(id) {
    var element = document.getElementById(id);
    return element !== null;
}

function secondsToTime(secs) { // we will use this function to convert seconds in normal time format
    var hr = Math.floor(secs / 3600);
    var min = Math.floor((secs - (hr * 3600)) / 60);
    var sec = Math.floor(secs - (hr * 3600) - (min * 60));

    if (hr < 10) { hr = "0" + hr; }
    if (min < 10) { min = "0" + min; }
    if (sec < 10) { sec = "0" + sec; }
    if (hr) { hr = "00"; }
    return hr + ':' + min + ':' + sec;
};

function bytesToSize(bytes) {
    var sizes = ['Bytes', 'KB', 'MB'];
    if (bytes == 0) return 'n/a';
    var i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
    return (bytes / Math.pow(1024, i)).toFixed(1) + ' ' + sizes[i];
};


function startUploading() {
    document.getElementById('btnUpdate').disabled = true;
    // hide all links except FOTA page, refresh will show all links
    document.getElementById('home-link').style.display = 'none';
    //document.getElementById('connections-link').style.display = 'none';
    //document.getElementById('config-link').style.display = 'none';
    document.getElementById('factory-link').style.display = 'none';
    document.getElementById('gps-link').style.display = 'none';

    // cleanup all temp states
    iPreviousBytesLoaded = 0;
    document.getElementById('upload_response').style.display = 'none';
    document.getElementById('progress_percent').innerHTML = '';
    var oProgress = document.getElementById('progress');
    oProgress.style.display = 'block';
    oProgress.style.width = '0px';

    // get form data for POSTing
    var vFD = new FormData(document.getElementById('upload_form'));

    // create XMLHttpRequest object, adding few event listeners, and POSTing our data
    var oXHR = new XMLHttpRequest();
    oXHR.upload.addEventListener('progress', uploadProgress, false);
    oXHR.addEventListener('load', uploadFinish, false);
    oXHR.addEventListener('error', uploadError, false);
    oXHR.addEventListener('abort', uploadAbort, false);
    oXHR.open('POST', 'Upgrade');
    oXHR.send(vFD);

    // set inner timer
    oTimer = setInterval(doInnerUpdates, 300);
}

function doInnerUpdates() { // we will use this function to display upload speed
    var iCB = iBytesUploaded;
    var iDiff = iCB - iPreviousBytesLoaded;

    iPreviousBytesLoaded = iCB;

    var iBytesRem = iBytesTotal - iPreviousBytesLoaded;

    if (iBytesRem == 0) {
        var oUploadResponse = document.getElementById('upload_response');
        var maxWaitingDots = 5;
        oUploadResponse.innerHTML = 'Please wait';
        for (var i = 0; i < (cnt % maxWaitingDots); i++)
            oUploadResponse.innerHTML += '.';
        oUploadResponse.style.display = 'block';
    }

    cnt++;
}

function uploadProgress(e) { // upload process in progress
    console.log("uploadProgress\n");
    if (e.lengthComputable) {
        iBytesUploaded = e.loaded;
        iBytesTotal = e.total;
        var iPercentComplete = Math.round(e.loaded * 100 / e.total);
        var iBytesTransfered = bytesToSize(iBytesUploaded);

        document.getElementById('progress_percent').innerHTML = 'upload progress: ' + iPercentComplete.toString() + '%';
        document.getElementById('progress').style.width = (iPercentComplete * 4).toString() + 'px';
        document.getElementById('b_transfered').innerHTML = 'bytes transfered: ' + iBytesTransfered;

    } else {
        document.getElementById('progress').innerHTML = 'unable to compute';
    }
}

function uploadFinish(e) { // upload successfully finished
    console.log("uploadFinish\n");
    var oUploadResponse = document.getElementById('upload_response');
    oUploadResponse.innerHTML = e.target.responseText;
    oUploadResponse.style.display = 'block';

    document.getElementById('progress_percent').innerHTML = 'upload progress: 100%';
    document.getElementById('progress').style.width = '400px';

    clearInterval(oTimer);
}

function uploadError(e) { // upload error
    console.log("uploadError\n");
    clearInterval(oTimer);
}

function uploadAbort(e) { // upload abort
    console.log("uploadAbort\n");
    clearInterval(oTimer);
}


document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('fota-link').addEventListener('click', function (event) {
        event.preventDefault();
        var linkElement = document.getElementById('fota-link');
        indicateLED('fota-link');
        loadContent('/static/subpage/gupdate.html');
    });

    document.getElementById('home-link').addEventListener('click', function (event) {
        event.preventDefault();
        var linkElement = document.getElementById('home-link');
        indicateLED('home-link');
        loadContent('/static/subpage/info.html');
    });
    document.getElementById('factory-link').addEventListener('click', function (event) {
        event.preventDefault();
        var linkElement = document.getElementById('factory-link');
        indicateLED('factory-link');
        loadContent('/static/subpage/factory.html');
    });
    document.getElementById('gps-link').addEventListener('click', function (event) {
        event.preventDefault();
        var linkElement = document.getElementById('gps-link');
        indicateLED('gps-link');
        loadContent('/static/subpage/gps.html');
    });
    document.getElementById('download-link').addEventListener('click', function (event) {
        event.preventDefault();
        var linkElement = document.getElementById('download-link');
        indicateLED('download-link');
        loadContent('/static/subpage/download.html');
    });    
    //document.getElementById('config-link').addEventListener('click', function (event) {
    //    event.preventDefault();
    //    var linkElement = document.getElementById('config-link');
    //    indicateLED('config-link');
    //    loadContent('/static/subpage/config.html');
    //});
    //document.getElementById('connections-link').addEventListener('click', function (event) {
    //    event.preventDefault();
    //    indicateLED('connections-link');
    //    loadContent('/static/subpage/liveview.tmpl');
    //});

    function loadContent(url) {
        var noCacheUrl = addNoCacheQueryParam(url);
        currentHtml = url;
        fetch(noCacheUrl)
            .then(response => response.text())
            .then(content => {
                var newContent = document.createElement('div');
                newContent.innerHTML = content;
                document.getElementById("main-content").innerHTML = '';
                document.getElementById("main-content").appendChild(newContent);
                // Manually execute any inline scripts in the new content
                var scripts = newContent.querySelectorAll('script');
                for (var i = 0; i < scripts.length; i++) {
                    eval(scripts[i].innerText); // This approach is not recommended due to security risks.
                }
            })
            .catch(error => {
                console.error('Error loading content:', error);
            });
    }
    window.loadContent = loadContent;

    function addNoCacheQueryParam(url) {
        var timestamp = new Date().getTime();
        return url + '?timestamp=' + timestamp;
    }
    function indicateLED(linkElement) {
        var linkElement = document.getElementById(linkElement);
        var links = document.querySelectorAll('.side-bar-hover');
        for (var i = 0; i < links.length; i++) {
            links[i].classList.remove('active-link');
        }
        linkElement.classList.add('active-link');
    }

});

// Simulate clicking "HOME" link on page load
document.addEventListener('DOMContentLoaded', function () {
    // Default load page is info.html
    document.getElementById('home-link').click();

    // Test load page is connections.html
    // document.getElementById('connections-link').click();
});

//To dynamically show or hide the footer
function toggleFooter() {
    var footer = document.getElementById("footer_log");
    if (footer.style.display === "none") {
        footer.style.display = "block"; // Show the footer
    } else {
        footer.style.display = "none";  // Hide the footer
    }
}
// update TextArea with scrolling to bottom
function updateTextarea(textareaId, message) {
    if (doesElementExist(textareaId)) {
        // Replace newline characters with <br> tags for HTML display
        const formattedPayload = payload.replace(/\n/g, '<br>');

        const cardBody = document.getElementById(textareaId);
        cardBody.innerHTML = formattedPayload;
        cardBody.scrollTop = cardBody.scrollHeight;
    } else {
        console.log("updateTextarea: " + textareaId + " does not exist.");
    }
}

// execute SSH by remote
function executeSSHCommand() {
    var ipAddress = extractIPAddressFromURL(currentURL);
    var sshCommand = 'ssh root@' + ipAddress + ' "reboot"'; // 替换为实际的 SSH 命令

    // issue SSH command
    var xhr = new XMLHttpRequest();
    xhr.open('POST', '/execute-ssh-command', true); // 替换为服务器端接口 URL
    xhr.setRequestHeader('Content-Type', 'application/json');

    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4 && xhr.status === 200) {
            // process the result from server
            var response = JSON.parse(xhr.responseText);
            document.getElementById('output').textContent = response.result;
        }
    };

    xhr.send(JSON.stringify({ command: sshCommand }));
}
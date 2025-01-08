let downloadInProgress = false;  
async function downloadFile() {
    // Prevent multiple clicks
    if (downloadInProgress) {
        return;
    }    
    const button = document.getElementById('downloadBtn');
    const statusElement = document.getElementById('status');
    const headerInfo = document.getElementById('headerInfo');

    headerInfo.innerHTML = '';
    statusElement.textContent = '';
    statusElement.classList.remove('error');
    
    try {
        downloadInProgress = true;
        button.disabled = true;

        // Clear previous state
        clearDisplay();

        statusElement.style.display = 'block';
        statusElement.textContent = 'Creating archive...';
        statusElement.classList.remove('hidden');
        headerInfo.innerHTML = '';
        // Fetch the file from the server
        console.log('Starting download...');
        const response = await fetch('/page/download');
        if (!response.ok) throw new Error('Download failed');
        
        headerInfo.classList.remove('hidden');        
        // Get the filename from the Content-Disposition header if available        
        const contentDisposition = response.headers.get('Content-Disposition');
        headerInfo.innerHTML = `
        Content-Disposition: ${contentDisposition || 'Not found'}<br>
        Content-Type: ${response.headers.get('Content-Type') || 'Not found'}<br>
        Content-Length: ${response.headers.get('Content-Length') || 'Not found'}`;        
        let filename = 'log.tar.gz';
        if (contentDisposition) {
            const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
            const filenameStarRegex = /filename\*=UTF-8''([^;\n]*)/;
            
            const matches = filenameStarRegex.exec(contentDisposition) || filenameRegex.exec(contentDisposition);                    
            if (matches && matches[1]) {
                // Remove quotes if present and decode
                filename = decodeURIComponent(
                    matches[1].replace(/['"]/g, '')
                );
            }
        }
        
        // Convert the response to blob
        const blob = await response.blob();
        
        // Use FileSaver.js to save the file
        saveAs(blob, filename);
        
        statusElement.textContent = 'Download complete!';
        console.log('Download completed');

        
    } catch (error) {
        console.error('Download error:', error);
        statusElement.textContent = 'Download failed: ' + error.message;
        statusElement.classList.add('error');
        headerInfo.classList.remove('hidden');
        headerInfo.innerHTML += '\n\nError Details:\n' + error.message;
    } finally {
        // Re-enable button
        button.disabled = false;
        downloadInProgress = false;
        setTimeout(() => {
            if (!downloadInProgress) {
                clearDisplay();
            }
        }, 5000);
       //setTimeout(() => {
        //    statusElement.style.display = 'none';
        //}, 10000);        
    }
}

function clearDisplay() {
    const headerInfo = document.getElementById('headerInfo');
    const statusElement = document.getElementById('status');
    
    // Clear content
    headerInfo.textContent = '';
    //statusElement.textContent = '';
    
    // Hide elements
    headerInfo.classList.add('hidden');
    //statusElement.classList.add('hidden');
    
    // Remove error class if present
    statusElement.classList.remove('error');
    console.log('Display cleared');
}  
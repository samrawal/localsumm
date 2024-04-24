chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === "fetchText") {
        // Use chrome.tabs.query to get the active tab in the current window
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            // tabs[0] will be the active tab in the current window
            const currentTab = tabs[0];
            chrome.scripting.executeScript({
                target: { tabId: currentTab.id },
                function: getTextFromPage
            }, (injectionResults) => {
                for (const frameResult of injectionResults)
                    sendTextToApi(frameResult.result, sendResponse);
            });
        });
        return true; // Will respond asynchronously.
    }
});

function getTextFromPage() {
    return document.body.innerText;
}

function sendTextToApi(text, sendResponse) {
    fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
            { 
                model: "phi3", 
                prompt: text,
                system: "Given text from a webpage, generate a brief summary. Answer in only plaintext format.",
                stream: false,
            }
        )
    })
    .then(response => {
        // Log the text response for debugging purposes
        response.text().then(text => {
            console.log("Received text:", text);
            try {
                // Attempt to parse it as JSON
                const data = JSON.parse(text);
                if (data && data.response) {
                    sendResponse(data.response.replace(/\n/g, "\n")); // Send only the "response" key with newline replaced by <br>
                } else {
                    sendResponse("No response found."); // Fallback text
                }
            } catch (e) {
                // Log parsing errors
                // console.error("Error parsing JSON:", e);
                console.error("Error parsing JSON:", text);
                sendResponse("Error in parsing response.");
            }
        });
    })
    .catch(error => {
        console.error('Error:', error);
        sendResponse("Error in fetching response."); // Error handling
    });
    return true; // To allow asynchronous response
}
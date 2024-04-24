document.addEventListener('DOMContentLoaded', function() {
    chrome.runtime.sendMessage({ action: "fetchText" }, function(response) {
        document.getElementById('output').textContent = response;
    });
});

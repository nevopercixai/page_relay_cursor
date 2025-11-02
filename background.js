// Background service worker for PageRelay
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'pageData') {
    handlePageData(message.data, sender.tab.id);
    sendResponse({ success: true });
  }
  return true; // Keep channel open for async response
});

async function handlePageData(pageData, tabId) {
  try {
    // Read backend URL from storage
    const result = await chrome.storage.sync.get(['backendUrl']);
    
    if (!result.backendUrl) {
      console.warn("No backend URL set");
      return;
    }

    // POST pageData to backend
    const response = await fetch(result.backendUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(pageData)
    });

    if (!response.ok) {
      console.error("Backend request failed:", response.status, response.statusText);
      return;
    }

    // Parse response JSON
    const responseData = await response.json();
    
    // If response contains injectHtml, send it back to content script
    if (responseData.injectHtml) {
      chrome.tabs.sendMessage(tabId, {
        type: 'injectHtml',
        html: responseData.injectHtml
      }).catch(err => {
        console.error("Failed to send injectHtml message:", err);
      });
    }
  } catch (error) {
    console.error("Error handling page data:", error);
  }
}


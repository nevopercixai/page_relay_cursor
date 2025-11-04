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
    console.log('PageRelay [Background]: Received pageData:', pageData);
    console.log('PageRelay [Background]: Data structure:', Object.keys(pageData));
    
    // Read backend URL from storage
    const result = await chrome.storage.sync.get(['backendUrl']);
    
    if (!result.backendUrl) {
      console.warn("PageRelay [Background]: No backend URL set");
      return;
    }

    console.log('PageRelay [Background]: Sending POST to:', result.backendUrl);
    console.log('PageRelay [Background]: JSON payload:', JSON.stringify(pageData, null, 2));

    // POST pageData to backend
    const response = await fetch(result.backendUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(pageData)
    });

    if (!response.ok) {
      console.error("PageRelay [Background]: Backend request failed:", response.status, response.statusText);
      return;
    }

    console.log('PageRelay [Background]: Backend responded with status:', response.status);

    // Parse response JSON
    const responseData = await response.json();
    console.log('PageRelay [Background]: Backend response:', responseData);
    
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


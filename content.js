// Content script for PageRelay - collects page data and handles HTML injection

// Collect page data on load
function collectPageData() {
  const url = window.location.href;
  const title = document.title;
  
  // Get meta description
  const metaDesc = document.querySelector('meta[name="description"]');
  const metaDescription = metaDesc ? metaDesc.getAttribute('content') || '' : '';
  
  // Get selected text (captured once on load)
  const selectedText = window.getSelection().toString();
  
  // Get full HTML snapshot
  // Note: This can be truncated later if needed for performance
  const htmlSnapshot = document.documentElement.outerHTML;
  
  return {
    url,
    title,
    metaDescription,
    selectedText,
    htmlSnapshot
  };
}

// Send page data to background script
const pageData = collectPageData();
chrome.runtime.sendMessage({
  type: 'pageData',
  data: pageData
}, (response) => {
  if (chrome.runtime.lastError) {
    console.error("Error sending page data:", chrome.runtime.lastError);
  }
});

// Listen for injectHtml messages from background
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'injectHtml') {
    // Create div element and inject HTML at top of page
    const box = document.createElement("div");
    box.innerHTML = message.html;
    document.body.prepend(box);
    sendResponse({ success: true });
  }
  return true;
});


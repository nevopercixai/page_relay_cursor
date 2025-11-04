// Content script for PageRelay - collects page data and handles HTML injection

let config = null;
let configLoaded = false;

// Embedded default config (fallback if file can't be loaded)
const DEFAULT_CONFIG = {
  "websites": [
    {
      "urlPattern": "file:///*",
      "pages": [
        {
          "pathPattern": "*test.html",
          "fields": [
            {
              "name": "title",
              "selector": "title",
              "type": "text"
            },
            {
              "name": "metaDescription",
              "selector": "meta[name='description']",
              "type": "attribute",
              "attribute": "content",
              "default": ""
            },
            {
              "name": "selectedText",
              "selector": "special:getSelection",
              "type": "text",
              "default": ""
            },
            {
              "name": "htmlSnapshot",
              "selector": "html",
              "type": "html"
            }
          ]
        }
      ]
    }
  ]
};

// Load configuration from config.json
async function loadConfig() {
  if (configLoaded && config) return config;
  
  try {
    const configUrl = chrome.runtime.getURL('config.json');
    console.log('PageRelay: Attempting to load config from:', configUrl);
    
    const response = await fetch(configUrl);
    if (!response.ok) {
      console.warn('PageRelay: Could not load config.json, status:', response.status, 'Using default config');
      config = DEFAULT_CONFIG;
      configLoaded = true;
      return config;
    }
    
    config = await response.json();
    configLoaded = true;
    console.log('PageRelay: Config loaded successfully from file');
    return config;
  } catch (error) {
    console.warn('PageRelay: Error loading config.json, using default config:', error.message);
    // Use default config as fallback
    config = DEFAULT_CONFIG;
    configLoaded = true;
    return config;
  }
}

// Match URL pattern (supports wildcards like *://example.com/*)
function matchUrlPattern(url, pattern) {
  try {
    // Special handling for file:// URLs - simple check
    if (pattern.includes('file://')) {
      // file:///* should match any file:// URL
      return url.startsWith('file://');
    }
    
    // Convert wildcard pattern to regex
    let regexPattern = pattern
      .replace(/\./g, '\\.')  // Escape dots
      .replace(/\*/g, '.*');  // Convert * to .*
    
    // Handle protocol patterns like *://
    if (pattern.includes('://')) {
      const regex = new RegExp('^' + regexPattern + '$', 'i');
      return regex.test(url);
    } else {
      // Simple domain matching
      const regex = new RegExp(regexPattern, 'i');
      return regex.test(url);
    }
  } catch (error) {
    console.warn('PageRelay: Error matching URL pattern', pattern, error);
    return false;
  }
}

// Match path pattern (supports wildcards like /d/*/viewform)
function matchPathPattern(path, pattern) {
  try {
    // Convert wildcard pattern to regex
    const regexPattern = pattern
      .replace(/\//g, '\\/')  // Escape slashes
      .replace(/\*/g, '.*');  // Convert * to .*
    
    const regex = new RegExp('^' + regexPattern + '$', 'i');
    return regex.test(path);
  } catch (error) {
    console.warn('PageRelay: Error matching path pattern', pattern, error);
    return false;
  }
}

// Find matching configuration for current page
function findMatchingConfig(url) {
  if (!config || !config.websites) {
    console.log('PageRelay: No config or websites found');
    return null;
  }
  
  try {
    let path = '';
    // Handle file:// URLs specially
    if (url.startsWith('file://')) {
      // For file:// URLs, extract the path after file://
      path = url.replace(/^file:\/\/+/, ''); // Remove file:// or file:///
      // Normalize Windows paths (C:\ becomes /C:/)
      if (path.match(/^[A-Za-z]:/)) {
        path = '/' + path.replace(/\\/g, '/');
      }
      // Extract just the filename if pattern is looking for filename
      const filename = path.split('/').pop() || path.split('\\').pop();
      console.log('PageRelay: file:// URL detected, path:', path, 'filename:', filename);
    } else {
      const urlObj = new URL(url);
      path = urlObj.pathname;
    }
    
    console.log('PageRelay: Checking URL:', url, 'path:', path);
    
    for (const website of config.websites) {
      console.log('PageRelay: Checking website pattern:', website.urlPattern);
      if (!matchUrlPattern(url, website.urlPattern)) {
        console.log('PageRelay: URL pattern did not match');
        continue;
      }
      console.log('PageRelay: URL pattern matched!');
      
      if (!website.pages || website.pages.length === 0) {
        // No pages specified, match all pages for this website
        console.log('PageRelay: No pages specified, matching all');
        return { website, page: null };
      }
      
      // Check each page pattern
      for (const page of website.pages) {
        console.log('PageRelay: Checking path pattern:', page.pathPattern, 'against:', path);
        // For filename patterns like *test.html, check against filename
        if (page.pathPattern.includes('*') && !page.pathPattern.startsWith('/')) {
          const filename = path.split('/').pop() || path.split('\\').pop();
          const pattern = page.pathPattern.replace(/\*/g, '.*');
          const regex = new RegExp(pattern, 'i');
          if (regex.test(filename)) {
            console.log('PageRelay: Filename pattern matched!');
            return { website, page };
          }
        } else if (matchPathPattern(path, page.pathPattern)) {
          console.log('PageRelay: Path pattern matched!');
          return { website, page };
        }
      }
    }
    
    console.log('PageRelay: No matching configuration found');
    return null;
  } catch (error) {
    console.warn('PageRelay: Error finding matching config', error);
    return null;
  }
}

// Extract field value based on type
function extractFieldValue(element, field) {
  // Handle special cases that don't use DOM selectors
  if (field.selector === 'special:getSelection') {
    try {
      return window.getSelection().toString() || field.default || '';
    } catch (error) {
      console.warn('PageRelay: Error getting selection', error);
      return field.default !== undefined ? field.default : '';
    }
  }
  
  if (!element) return field.default !== undefined ? field.default : '';
  
  try {
    switch (field.type) {
      case 'text':
        return element.textContent?.trim() || field.default || '';
      
      case 'value':
        return element.value || element.getAttribute('value') || field.default || '';
      
      case 'html':
        // For html type, prefer outerHTML for full element, fallback to innerHTML
        if (field.selector === 'html') {
          return document.documentElement.outerHTML || field.default || '';
        }
        return element.outerHTML || element.innerHTML || field.default || '';
      
      case 'attribute':
        if (!field.attribute) {
          console.warn('PageRelay: attribute type requires attribute property');
          return field.default || '';
        }
        return element.getAttribute(field.attribute) || field.default || '';
      
      case 'href':
        return element.href || element.getAttribute('href') || field.default || '';
      
      default:
        console.warn('PageRelay: Unknown field type', field.type);
        return element.textContent?.trim() || field.default || '';
    }
  } catch (error) {
    console.warn('PageRelay: Error extracting field', field.name, error);
    return field.default !== undefined ? field.default : '';
  }
}

// Collect page data based on configuration
async function collectPageData() {
  const url = window.location.href;
  console.log('PageRelay: collectPageData called for URL:', url);
  
  // Load config if not already loaded
  const loadedConfig = await loadConfig();
  if (!loadedConfig) {
    console.warn('PageRelay: Config failed to load');
    return null;
  }
  console.log('PageRelay: Config loaded successfully');
  
  // Find matching configuration
  const match = findMatchingConfig(url);
  
  // If no match, skip data collection
  if (!match || !match.page || !match.page.fields) {
    console.log('PageRelay: No match found or no page/fields configured');
    return null;
  }
  console.log('PageRelay: Match found, extracting fields:', match.page.fields);
  
  // Build data object with url and timestamp
  const pageData = {
    url: url,
    timestamp: new Date().toISOString()
  };
  
  // Extract configured fields
  for (const field of match.page.fields) {
    try {
      let element = null;
      let elements = null;
      // For special selectors, don't query DOM
      if (field.selector !== 'special:getSelection') {
        // Always use querySelectorAll for fields with "all" in the name
        if (field.name.includes('all')) {
          elements = document.querySelectorAll(field.selector);
          console.log(`PageRelay: Found ${elements.length} elements for field "${field.name}" using selector "${field.selector}"`);
        } else if (field.selector.includes('tbody') || field.selector.includes('tr.')) {
          elements = document.querySelectorAll(field.selector);
          console.log(`PageRelay: Found ${elements.length} elements for field "${field.name}"`);
        } else {
          element = document.querySelector(field.selector);
        }
      }
      
      // If multiple elements found, extract as array
      if (elements && elements.length > 0) {
        console.log(`PageRelay: Extracting array for field "${field.name}" with ${elements.length} elements`);
        if (field.type === 'text') {
          pageData[field.name] = Array.from(elements).map(el => el.textContent?.trim() || '').filter(v => v);
        } else if (field.type === 'html') {
          pageData[field.name] = Array.from(elements).map(el => el.outerHTML || el.innerHTML || '').filter(v => v);
        } else if (field.type === 'href') {
          pageData[field.name] = Array.from(elements).map(el => {
            const href = el.href || el.getAttribute('href') || '';
            // Convert relative URLs to absolute if needed
            if (href && !href.startsWith('http')) {
              return new URL(href, window.location.origin).href;
            }
            return href;
          }).filter(v => v);
        } else if (field.type === 'attribute') {
          pageData[field.name] = Array.from(elements).map(el => {
            if (field.attribute) {
              return el.getAttribute(field.attribute) || '';
            }
            return el.textContent?.trim() || '';
          }).filter(v => v);
        } else {
          pageData[field.name] = Array.from(elements).map(el => extractFieldValue(el, field)).filter(v => v);
        }
        console.log(`PageRelay: Extracted array for "${field.name}":`, pageData[field.name]);
      } else if (element) {
        console.log(`PageRelay: Extracting single element for field "${field.name}"`);
        const value = extractFieldValue(element, field);
        pageData[field.name] = value;
      } else {
        console.log(`PageRelay: No elements found for field "${field.name}", using default`);
        pageData[field.name] = field.default !== undefined ? field.default : '';
      }
    } catch (error) {
      console.warn('PageRelay: Error extracting field', field.name, error);
      pageData[field.name] = field.default !== undefined ? field.default : '';
    }
  }
  
  return pageData;
}

// Send page data to background script
async function sendPageData() {
  const pageData = await collectPageData();
  
  // Only send if data was collected (page matched config)
  if (pageData) {
    console.log('PageRelay: Sending pageData to background:', pageData);
    chrome.runtime.sendMessage({
      type: 'pageData',
      data: pageData
    }, (response) => {
      if (chrome.runtime.lastError) {
        console.error("PageRelay: Error sending page data:", chrome.runtime.lastError);
      } else {
        console.log('PageRelay: Data sent successfully, response:', response);
      }
    });
  } else {
    console.log('PageRelay: No pageData to send (page did not match config)');
  }
}

// Run on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', sendPageData);
} else {
  sendPageData();
}

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

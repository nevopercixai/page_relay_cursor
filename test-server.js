// Simple test server to verify PageRelay extension backend communication
// Run with: node test-server.js
// Then set backend URL in extension popup to: http://localhost:3000/api

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
let requestCount = 0;

// Directory to save HTML snapshots
const htmlDir = path.join(__dirname, 'saved_html');

// Create directory if it doesn't exist
if (!fs.existsSync(htmlDir)) {
  fs.mkdirSync(htmlDir);
  console.log(`📁 Created directory: ${htmlDir}`);
}

const server = http.createServer((req, res) => {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.method === 'POST' && req.url === '/api') {
    let body = '';
    
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', () => {
      requestCount++;
      try {
        const pageData = JSON.parse(body);
        
        console.log(`\n[Request #${requestCount}]`);
        console.log('Full JSON received:');
        console.log(JSON.stringify(pageData, null, 2));
        console.log('\nField breakdown:');
        console.log('URL:', pageData.url);
        console.log('Timestamp:', pageData.timestamp);
        
        // Log all fields dynamically (since structure is now config-based)
        Object.keys(pageData).forEach(key => {
          if (key !== 'url' && key !== 'timestamp' && key !== 'htmlSnapshot') {
            console.log(`${key}:`, pageData[key] || '(empty)');
          }
        });
        
        console.log('HTML Snapshot Length:', pageData.htmlSnapshot?.length || 0, 'characters');
        
        // Save HTML snapshot to file
        if (pageData.htmlSnapshot) {
          try {
            // Create a safe filename from URL and timestamp
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
            
            // Handle different URL types (http, https, file://)
            let urlPath = 'localhost';
            try {
              if (pageData.url.startsWith('file://')) {
                // Extract filename from file:// URL
                const urlParts = pageData.url.replace('file://', '').split('/');
                urlPath = urlParts[urlParts.length - 1].replace(/\./g, '_') || 'file';
              } else {
                urlPath = new URL(pageData.url).hostname.replace(/\./g, '_');
              }
            } catch (urlError) {
              // If URL parsing fails, use a sanitized version of the URL
              urlPath = pageData.url.replace(/[^a-z0-9]/gi, '_').substring(0, 50);
            }
            
            const safeTitle = (pageData.title || 'untitled')
              .replace(/[<>:"/\\|?*]/g, '_')
              .substring(0, 50)
              .trim();
            
            const filename = `${requestCount.toString().padStart(4, '0')}_${timestamp}_${urlPath}_${safeTitle}.html`;
            const filepath = path.join(htmlDir, filename);
            
            fs.writeFileSync(filepath, pageData.htmlSnapshot, 'utf8');
            console.log(`💾 HTML saved to: ${filepath}`);
          } catch (saveError) {
            console.error('Error saving HTML file:', saveError.message);
          }
        }
        
        // Send response with injectHtml for testing
        const response = {
          success: true,
          receivedAt: new Date().toISOString(),
          injectHtml: `
            <div style="background: #28a745; color: white; padding: 15px; margin: 10px; border-radius: 5px; box-shadow: 0 2px 5px rgba(0,0,0,0.2);">
              <strong>✅ PageRelay Test</strong><br>
              <small>Backend received page data successfully! (Request #${requestCount})</small>
            </div>
          `
        };
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(response));
        
      } catch (error) {
        console.error('Error parsing request:', error);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    });
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

server.listen(PORT, () => {
  console.log(`\n🧪 PageRelay Test Server running on http://localhost:${PORT}`);
  console.log('Set backend URL in extension to: http://localhost:3000/api');
  console.log(`📁 HTML snapshots will be saved to: ${htmlDir}\n`);
  console.log('Waiting for requests...\n');
});


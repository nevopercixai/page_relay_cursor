# PageRelay Browser Extension

A minimal Chrome/Edge (Chromium) extension that automatically collects page data on load and enables dynamic HTML injection from a configurable backend.

## Features

- **Automatic Data Collection**: Captures URL, title, meta description, selected text, and full HTML snapshot
- **Backend Communication**: POSTs collected data to a user-configurable backend URL
- **Dynamic HTML Injection**: Allows backend to inject HTML content at the top of pages
- **Minimal & Lightweight**: Pure vanilla JavaScript, no dependencies

## Installation

1. Open Chrome/Edge and navigate to `chrome://extensions/` (or `edge://extensions/`)
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select this directory (`cursor`)

## Configuration

1. Click the PageRelay extension icon in your browser toolbar
2. Enter your backend URL (e.g., `http://localhost:3000/api`)
3. Click "Save"

## Testing

### Automated Tests
```bash
node test-automated.js
```
All 33 tests passed ✓

### Manual Testing

1. **Start Test Server**:
   ```bash
   node test-server.js
   ```

2. **Configure Extension**:
   - Set backend URL to `http://localhost:3000/api`

3. **Test Scenarios**:
   - Open `test.html` in browser
   - Check test server console for received data
   - Verify green success box appears at top of page
   - Test on different websites

See `test-manual.md` for detailed testing guide.

## Files

- `manifest.json` - Extension configuration (Manifest V3)
- `background.js` - Service worker for backend communication
- `content.js` - Content script for data collection and HTML injection
- `popup.html` - Settings UI
- `popup.js` - Popup script logic
- `test-server.js` - Test backend server
- `test.html` - Test webpage
- `test-automated.js` - Automated test suite

## How It Works

1. Content script runs on every page load
2. Collects page data (URL, title, meta, selection, HTML)
3. Sends data to background service worker
4. Background worker POSTs data to configured backend URL
5. If backend responds with `injectHtml`, content script injects it at top of page

## Backend API

Your backend should accept POST requests with JSON body:

```json
{
  "url": "https://example.com",
  "title": "Example Page",
  "metaDescription": "Page description",
  "selectedText": "",
  "htmlSnapshot": "<html>...</html>"
}
```

And respond with optional HTML injection:

```json
{
  "injectHtml": "<div>Your HTML here</div>"
}
```

## License

MIT


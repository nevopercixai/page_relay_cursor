# Manual Testing Guide for PageRelay Extension

## Prerequisites
1. Node.js installed (for test server)
2. Chrome or Edge browser

## Test Setup

### 1. Load Extension
1. Open Chrome/Edge
2. Go to `chrome://extensions/` (or `edge://extensions/`)
3. Enable "Developer mode" (toggle in top right)
4. Click "Load unpacked"
5. Select the `cursor` directory

### 2. Start Test Server
```bash
cd cursor
node test-server.js
```
The server will run on `http://localhost:3000`

### 3. Configure Extension
1. Click the PageRelay extension icon
2. Enter backend URL: `http://localhost:3000/api`
3. Click "Save"

## Test Cases

### Test 1: Basic Data Collection
1. Open `test.html` in browser
2. Open browser console (F12)
3. Check for any errors
4. Check test server console - should see:
   - URL
   - Title: "PageRelay Test Page"
   - Meta Description
   - HTML Snapshot length

**Expected**: No errors, data appears in server console

### Test 2: HTML Injection
1. After Test 1, check top of `test.html` page
2. Should see green success box injected at top

**Expected**: Green box with "PageRelay Test" message appears at top of page

### Test 3: No Backend URL
1. Open extension popup
2. Clear backend URL field
3. Save (leave empty)
4. Reload `test.html`
5. Check browser console (Service Worker)

**Expected**: Console warning "No backend URL set"

### Test 4: Selected Text Collection
1. Select some text on `test.html` (e.g., "Test Instructions")
2. Keep selection and reload page
3. Check server console

**Expected**: selectedText should show the selected text (note: may be empty if selection is lost on reload)

### Test 5: Multiple Pages
1. Navigate to different websites
2. Check server console for each page load

**Expected**: Each page sends data with correct URL and title

### Test 6: Error Handling
1. Set backend URL to invalid URL: `http://invalid-url-test-12345.com`
2. Reload page
3. Check browser console

**Expected**: Error logged in console, no crash

## Checklist
- [ ] Extension loads without errors
- [ ] Popup UI displays correctly
- [ ] Backend URL can be saved and retrieved
- [ ] Page data is collected on page load
- [ ] Data is sent to backend server
- [ ] HTML injection works when injectHtml is in response
- [ ] Warning appears when no backend URL is set
- [ ] Error handling works for network failures


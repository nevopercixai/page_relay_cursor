// Automated test script for PageRelay extension logic
// Run with: node test-automated.js

const fs = require('fs');
const path = require('path');

console.log('🧪 PageRelay Extension - Automated Tests\n');

let testsPassed = 0;
let testsFailed = 0;

function test(name, condition) {
  if (condition) {
    console.log(`✓ ${name}`);
    testsPassed++;
  } else {
    console.log(`✗ ${name}`);
    testsFailed++;
  }
}

// Test 1: Check all required files exist
console.log('📁 File Existence Tests:');
const requiredFiles = ['manifest.json', 'background.js', 'content.js', 'popup.html', 'popup.js'];
requiredFiles.forEach(file => {
  test(`File exists: ${file}`, fs.existsSync(path.join(__dirname, file)));
});

// Test 2: Validate manifest.json structure
console.log('\n📋 Manifest Validation:');
try {
  const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, 'manifest.json'), 'utf8'));
  test('Manifest version is 3', manifest.manifest_version === 3);
  test('Has background service_worker', manifest.background && manifest.background.service_worker === 'background.js');
  test('Has content_scripts', manifest.content_scripts && manifest.content_scripts.length > 0);
  test('Content script matches all URLs', manifest.content_scripts[0].matches.includes('<all_urls>'));
  test('Has storage permission', manifest.permissions && manifest.permissions.includes('storage'));
  test('Has tabs permission', manifest.permissions && manifest.permissions.includes('tabs'));
  test('Has host_permissions', manifest.host_permissions && manifest.host_permissions.includes('<all_urls>'));
  test('Has action popup', manifest.action && manifest.action.default_popup === 'popup.html');
} catch (e) {
  test('Manifest is valid JSON', false);
}

// Test 3: Check for required Chrome API usage
console.log('\n🔌 Chrome API Usage:');
const backgroundJs = fs.readFileSync(path.join(__dirname, 'background.js'), 'utf8');
const contentJs = fs.readFileSync(path.join(__dirname, 'content.js'), 'utf8');
const popupJs = fs.readFileSync(path.join(__dirname, 'popup.js'), 'utf8');

test('Background uses chrome.runtime.onMessage', backgroundJs.includes('chrome.runtime.onMessage'));
test('Background uses chrome.storage.sync', backgroundJs.includes('chrome.storage.sync'));
test('Background uses chrome.tabs.sendMessage', backgroundJs.includes('chrome.tabs.sendMessage'));
test('Background uses fetch for POST', backgroundJs.includes('fetch(') && backgroundJs.includes('POST'));
test('Content script uses chrome.runtime.sendMessage', contentJs.includes('chrome.runtime.sendMessage'));
test('Content script uses document.body.prepend', contentJs.includes('document.body.prepend'));
test('Content script collects htmlSnapshot', contentJs.includes('htmlSnapshot'));
test('Popup uses chrome.storage.sync', popupJs.includes('chrome.storage.sync'));

// Test 4: Check for error handling
console.log('\n🛡️ Error Handling:');
test('Background has try/catch', backgroundJs.includes('try') && backgroundJs.includes('catch'));
test('Background checks for missing URL', backgroundJs.includes('No backend URL set'));
test('Content script checks for runtime errors', contentJs.includes('chrome.runtime.lastError'));

// Test 5: Check for injectHtml functionality
console.log('\n💉 HTML Injection:');
test('Background checks for injectHtml', backgroundJs.includes('injectHtml'));
test('Content script handles injectHtml message', contentJs.includes('injectHtml'));
test('Content script creates div element', contentJs.includes('createElement("div")'));
test('Content script uses innerHTML', contentJs.includes('innerHTML'));

// Test 6: Check data collection
console.log('\n📊 Data Collection:');
test('Content script collects URL', contentJs.includes('window.location.href') || contentJs.includes('url'));
test('Content script collects title', contentJs.includes('document.title') || contentJs.includes('title'));
test('Content script collects meta description', contentJs.includes('meta[name="description"]'));
test('Content script collects selected text', contentJs.includes('getSelection()'));
test('Content script collects HTML snapshot', contentJs.includes('documentElement.outerHTML'));

// Summary
console.log('\n' + '='.repeat(50));
console.log(`Results: ${testsPassed} passed, ${testsFailed} failed`);
console.log('='.repeat(50) + '\n');

if (testsFailed === 0) {
  console.log('✅ All tests passed! Extension is ready for runtime testing.');
  process.exit(0);
} else {
  console.log('⚠️  Some tests failed. Review the issues above.');
  process.exit(1);
}


// Popup script for PageRelay settings

// Load current backend URL when popup opens
document.addEventListener('DOMContentLoaded', () => {
  chrome.storage.sync.get(['backendUrl'], (result) => {
    if (result.backendUrl) {
      document.getElementById('backendUrl').value = result.backendUrl;
    }
  });
});

// Save backend URL on form submit
document.getElementById('settingsForm').addEventListener('submit', (e) => {
  e.preventDefault();
  
  const backendUrl = document.getElementById('backendUrl').value;
  
  chrome.storage.sync.set({ backendUrl }, () => {
    // Show success message
    const status = document.getElementById('status');
    status.style.display = 'block';
    status.textContent = 'Settings saved!';
    
    // Hide status message after 2 seconds
    setTimeout(() => {
      status.style.display = 'none';
    }, 2000);
  });
});


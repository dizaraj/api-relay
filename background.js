// background.js

// This script runs in the background and handles the extension's service worker.

// Add a listener for when the extension's icon is clicked.
chrome.action.onClicked.addListener((tab) => {
  // When the icon is clicked, open the side panel.
  chrome.sidePanel.open({ windowId: tab.windowId });
});

// A simple listener to ensure the side panel is available on all tabs.
// This can be more sophisticated based on specific needs.
chrome.tabs.onUpdated.addListener(async (tabId, info, tab) => {
  if (!tab.url) return;
  const url = new URL(tab.url);
  // Enables the side panel on any page.
  await chrome.sidePanel.setOptions({
    tabId,
    path: "sidebar/sidebar.html",
    enabled: true,
  });
});

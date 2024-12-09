try{

// Function to reopen tabs and clean up expired entries
async function checkForSnoozedTabs() {
    const now = Date.now();
    const items = await chrome.storage.local.get(null); // Get all stored items
  
    for (const [key, value] of Object.entries(items)) {
      if (value.snoozeTime && value.snoozeTime <= now) {
        // Reopen the tab
        chrome.tabs.create({ url: value.url });
  
        // Remove the item from storage
        await chrome.storage.local.remove(key);
        console.log(`Reopened tab and cleared snooze: ${key}`);
      }
    }
  }
  
  // Listener for alarms
  chrome.alarms.onAlarm.addListener(async (alarm) => {
    console.log(`Alarm triggered: ${alarm.name}`);
    await checkForSnoozedTabs();
  });
  
  // Periodic fallback (heartbeat)
  const HEARTBEAT_INTERVAL = 5 * 60 * 1000; // 5 minutes
  setInterval(() => {
    console.log("Running fallback heartbeat to check snoozed tabs...");
    checkForSnoozedTabs();
  }, HEARTBEAT_INTERVAL);
  
  // Debugging: Log when service worker starts
  chrome.runtime.onInstalled.addListener(() => {
    console.log("Tab Snoozer installed");
  });
  
  chrome.runtime.onStartup.addListener(() => {
    console.log("Tab Snoozer service worker started");
  });
  

}catch(e){
    console.log(e);
}
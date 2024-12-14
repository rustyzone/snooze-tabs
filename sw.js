try{

// Function to reopen tabs and clean up expired entries
// Lock to prevent concurrent execution
let isCheckingTabs = false;

async function checkForSnoozedTabs() {
  if (isCheckingTabs) {
    console.log("checkForSnoozedTabs is already running. Skipping execution.");
    return;
  }

  isCheckingTabs = true; // Set the lock

  try {
    const now = Date.now();
    const items = await chrome.storage.local.get(null); // Get all stored items

    for (const [key, value] of Object.entries(items)) {
      if (value.snoozeTime && value.snoozeTime <= now) {
        if (value.processing) {
          // Skip entries already being processed
          console.log(`Skipping ${key}, already processing.`);
          continue;
        }

        // Mark as processing to avoid duplicates
        value.processing = true;
        await chrome.storage.local.set({ [key]: value });

        // Reopen the tab
        try {
          await chrome.tabs.create({ url: value.url });
          console.log(`Reopened tab: ${value.url}`);

          // Remove the entry from storage
          await chrome.storage.local.remove(key);
          console.log(`Cleared snooze entry: ${key}`);
        } catch (error) {
          console.error(`Failed to reopen tab for ${key}:`, error);

          // Cleanup processing flag in case of failure
          value.processing = false;
          await chrome.storage.local.set({ [key]: value });
        }
      }
    }
  } catch (error) {
    console.error("Error in checkForSnoozedTabs:", error);
  } finally {
    isCheckingTabs = false; // Release the lock
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

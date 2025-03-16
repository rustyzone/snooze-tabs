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

          // Handle recurring snoozes
          if (value.recurringId) {
            const recurringConfig = items[value.recurringId];
            if (recurringConfig) {
              // Calculate next occurrence
              const [hours, minutes] = recurringConfig.time.split(":").map(Number);
              const nextTime = getNextOccurrence(hours, minutes, recurringConfig.days);
              const newAlarmName = `snooze-${Date.now()}-${nextTime.getTime()}`;

              // Create next occurrence
              await chrome.storage.local.set({
                [newAlarmName]: {
                  url: value.url,
                  title: value.title,
                  snoozeTime: nextTime.getTime(),
                  recurringId: value.recurringId
                }
              });

              chrome.alarms.create(newAlarmName, { when: nextTime.getTime() });
              console.log(`Created next recurring snooze for: ${value.url}`);
            }
          }

          // Remove the current entry from storage
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

// Helper function to get next occurrence for recurring snooze
function getNextOccurrence(hours, minutes, selectedDays) {
  const now = new Date();
  const result = new Date();
  result.setHours(hours, minutes, 0, 0);

  if (result <= now) {
    result.setDate(result.getDate() + 1);
  }

  while (!selectedDays.includes(result.getDay())) {
    result.setDate(result.getDate() + 1);
  }

  return result;
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

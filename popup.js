document.getElementById("snooze1hour").addEventListener("click", () => snoozeTab(1));
document.getElementById("snooze1day").addEventListener("click", () => snoozeTab(24));
document.getElementById("snooze1week").addEventListener("click", () => snoozeTab(24 * 7));
document.getElementById("snooze2min").addEventListener("click", () => snoozeTab(0.0333));
async function snoozeTab(hours) {
  const [currentTab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!currentTab || !currentTab.url) {
    alert("No active tab found to snooze.");
    return;
  }

  const snoozeTime = Date.now() + hours * 60 * 60 * 1000; // Calculate snooze time in milliseconds
  const alarmName = `snooze-${currentTab.id}-${snoozeTime}`;

  // Save tab details in local storage
  await chrome.storage.local.set({
    [alarmName]: { url: currentTab.url, snoozeTime }
  });

  // Create an alarm
  chrome.alarms.create(alarmName, { when: snoozeTime });

  // Close the current tab
  chrome.tabs.remove(currentTab.id);

  alert(`Tab snoozed for ${hours} hours.`);
}

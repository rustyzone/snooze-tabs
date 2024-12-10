document.getElementById("snooze1hour").addEventListener("click", () => snoozeTab(1));
document.getElementById("snooze1day").addEventListener("click", () => snoozeTab(24));
document.getElementById("snooze1week").addEventListener("click", () => snoozeTab(24 * 7));
document.getElementById("snooze2min").addEventListener("click", () => snoozeTab(0.0333));

const snoozeListDiv = document.getElementById("snooze-list");
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

function removeSnooze(alarmName) {
  chrome.alarms.clear(alarmName);
  chrome.storage.local.remove(alarmName);
  alert("Tab unsnoozed.");

  // Refresh the list
  listSnoozed();
}

function listSnoozed() {

  // first clear the list
  snoozeListDiv.innerHTML = "";

  chrome.storage.local.get(null, (items) => {

    // if length add header
    if (Object.keys(items).length) {
      const header = document.createElement("h2");
      header.style.marginTop = "10px";
      header.style.marginBottom = "10px";
      header.textContent = "Snoozed tabs";
      snoozeListDiv.appendChild(header);
    }

    for (const key in items) {
      if (key.startsWith("snooze-")) {
        const { url, snoozeTime } = items[key];
        const snoozeTimeStr = new Date(snoozeTime).toLocaleString();
        const listItem = document.createElement("li");
        listItem.style.display = "flex";
        listItem.style.alignItems = "center";
        listItem.style.flexDirection = "row";
        listItem.style.justifyContent = "space-between";
        listItem.textContent = `${url} - ${snoozeTimeStr}`;
        snoozeListDiv.appendChild(listItem);

        // Add a button to remove snooze
        const removeButton = document.createElement("button");
        removeButton.textContent = "Remove";
        removeButton.style.width = 'auto'
        removeButton.addEventListener("click", () => removeSnooze(key));
        listItem.appendChild(removeButton);
      }
    }
  });
}



listSnoozed();

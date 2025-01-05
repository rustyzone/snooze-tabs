document.getElementById("snooze1hour").addEventListener("click", () => snoozeTab(1));
document.getElementById("snooze1day").addEventListener("click", () => snoozeTab(24));
document.getElementById("snooze1week").addEventListener("click", () => snoozeTab(24 * 7));
document.getElementById("snooze10min").addEventListener("click", () => snoozeTab(0.17));

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
    [alarmName]: { url: currentTab.url, snoozeTime, title: currentTab.title },
  });

  // Create an alarm
  chrome.alarms.create(alarmName, { when: snoozeTime });

  // Close the current tab
  chrome.tabs.remove(currentTab.id);

  alert(`Tab snoozed for ${hours} hours.`);
}

function removeSnooze(alarmName) {
  const confirmMessage = "Do you want to remove the snooze and open the tab?";
  if (confirm(confirmMessage)) {
    chrome.storage.local.get(alarmName, (item) => {
      if (item[alarmName]) {
        const { url } = item[alarmName];
        chrome.tabs.create({ url }); // Open the tab
      }
    });
  }
  
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
      header.style.marginBottom = "5px";
      header.textContent = "Snoozed tabs";
      snoozeListDiv.appendChild(header);
    }

    // order items by snooze time - ascending
    const orderedItems = Object.keys(items).sort((a, b) => items[a].snoozeTime - items[b].snoozeTime);
    const newObj = {};
    orderedItems.forEach(key => newObj[key] = items[key]); // Keep the data intact

    items = newObj; // Now items is the sorted object

    for (const key in items) {
      if (key.startsWith("snooze-")) {
        const { url, snoozeTime, title } = items[key];
        const snoozeTimeStr = new Date(snoozeTime).toLocaleString();
        const listItem = document.createElement("li");
        listItem.style.display = "flex";
        listItem.style.marginTop = "5px";
        listItem.style.alignItems = "center";
        listItem.style.flexDirection = "row";
        listItem.style.justifyContent = "space-between";
        listItem.style.overflow = "hidden";
        listItem.style.whiteSpace = "nowrap";
        listItem.style.textOverflow = "ellipsis";

        const data = title || url;
        listItem.innerHTML = `<span title="${data}" style="flex: 1; overflow: hidden; white-space: nowrap; text-overflow: ellipsis;">${data}</span> <span style="font-weight: bold;margin-right:10px;">${snoozeTimeStr}</span>`;
        snoozeListDiv.appendChild(listItem);

        // Add a button to remove snooze
        const removeButton = document.createElement("button");
        removeButton.textContent = "Remove";
        removeButton.style.width = 'auto'
        removeButton.style.margin = '0';
        removeButton.addEventListener("click", () => removeSnooze(key));
        listItem.appendChild(removeButton);
      }
    }
  });
}

listSnoozed();

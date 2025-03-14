const snoozeListDiv = document.getElementById("snooze-list");
const customModal = document.getElementById("customModal");
const recurringModal = document.getElementById("recurringModal");

function getSmartSnoozeOptions() {
  const now = new Date();
  const hour = now.getHours();
  const day = now.getDay(); // 0 is Sunday, 6 is Saturday
  const options = [];

  // Always show quick options
  options.push({
    id: 'snooze10min',
    text: 'Snooze for 10 minutes',
    hours: 0.17
  });

  options.push({
    id: 'snooze1hour',
    text: 'Snooze for 1 hour',
    hours: 1
  });

  // Context-aware options
  if (hour < 12) {
    // Morning
    options.push({
      id: 'snoozeAfternoon',
      text: 'Snooze until 2 PM',
      hours: getHoursUntil(14, 0)
    });
  } else if (hour < 17) {
    // Afternoon
    options.push({
      id: 'snoozeEvening',
      text: 'Snooze until this evening (6 PM)',
      hours: getHoursUntil(18, 0)
    });
  } else {
    // Evening/Night
    options.push({
      id: 'snoozeNextMorning',
      text: 'Snooze until tomorrow morning (9 AM)',
      hours: getHoursUntil(9, 0, 1)
    });
  }

  // Weekend options
  if (day < 5) { // Monday-Friday
    options.push({
      id: 'snoozeWeekend',
      text: 'Snooze until Saturday morning',
      hours: getHoursUntilNextDay(6, 10, 0) // Saturday at 10 AM
    });
  } else {
    options.push({
      id: 'snoozeNextWeek',
      text: 'Snooze until Monday morning',
      hours: getHoursUntilNextDay(1, 9, 0) // Monday at 9 AM
    });
  }

  return options;
}

function getHoursUntil(targetHour, targetMinute, addDays = 0) {
  const now = new Date();
  const target = new Date(now);
  target.setHours(targetHour, targetMinute, 0, 0);
  
  if (addDays > 0 || target <= now) {
    target.setDate(target.getDate() + (addDays || 1));
  }
  
  return (target - now) / (1000 * 60 * 60);
}

function getHoursUntilNextDay(targetDay, targetHour, targetMinute) {
  const now = new Date();
  const target = new Date(now);
  target.setHours(targetHour, targetMinute, 0, 0);
  
  while (target.getDay() !== targetDay || target <= now) {
    target.setDate(target.getDate() + 1);
  }
  
  return (target - now) / (1000 * 60 * 60);
}

function setupModalHandlers() {
  // Custom datetime picker handlers
  document.getElementById("snoozeCustom").addEventListener("click", () => {
    const dateTimeInput = document.getElementById("customDateTime");
    // Set min datetime to now
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    dateTimeInput.min = now.toISOString().slice(0, 16);
    
    // Set default value to tomorrow same time
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setMinutes(tomorrow.getMinutes() - tomorrow.getTimezoneOffset());
    dateTimeInput.value = tomorrow.toISOString().slice(0, 16);
    
    customModal.style.display = "block";
  });

  // Recurring snooze handlers
  document.getElementById("snoozeRecurring").addEventListener("click", () => {
    const timeInput = document.getElementById("recurringTime");
    timeInput.value = "09:00";
    recurringModal.style.display = "block";
  });

  // Handle modal buttons
  document.querySelectorAll(".modal-cancel").forEach(button => {
    button.addEventListener("click", () => {
      customModal.style.display = "none";
      recurringModal.style.display = "none";
    });
  });

  // Handle custom datetime confirmation
  document.querySelector("#customModal .modal-confirm").addEventListener("click", async () => {
    const dateTimeInput = document.getElementById("customDateTime");
    const selectedTime = new Date(dateTimeInput.value).getTime();
    
    if (selectedTime <= Date.now()) {
      alert("Please select a future date and time.");
      return;
    }

    const hoursFromNow = (selectedTime - Date.now()) / (1000 * 60 * 60);
    await snoozeTab(hoursFromNow);
    customModal.style.display = "none";
  });

  // Handle recurring snooze confirmation
  document.querySelector("#recurringModal .modal-confirm").addEventListener("click", handleRecurringSnooze);
}

async function handleRecurringSnooze() {
  const timeInput = document.getElementById("recurringTime");
  const selectedDays = Array.from(document.querySelectorAll(".days-selector input:checked"))
    .map(checkbox => parseInt(checkbox.value));

  if (selectedDays.length === 0) {
    alert("Please select at least one day for recurring snooze.");
    return;
  }

  const [hours, minutes] = timeInput.value.split(":").map(Number);
  const [currentTab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  if (!currentTab || !currentTab.url) {
    alert("No active tab found to snooze.");
    return;
  }

  const recurringConfig = {
    url: currentTab.url,
    title: currentTab.title,
    time: timeInput.value,
    days: selectedDays,
    type: "recurring"
  };

  const configId = `recurring-${Date.now()}`;
  await chrome.storage.local.set({
    [configId]: recurringConfig
  });

  const nextTime = getNextOccurrence(hours, minutes, selectedDays);
  const alarmName = `snooze-${currentTab.id}-${nextTime.getTime()}`;
  
  await chrome.storage.local.set({
    [alarmName]: {
      url: currentTab.url,
      snoozeTime: nextTime.getTime(),
      title: currentTab.title,
      recurringId: configId
    }
  });

  chrome.alarms.create(alarmName, { when: nextTime.getTime() });
  chrome.tabs.remove(currentTab.id);

  recurringModal.style.display = "none";
  alert("Recurring snooze set successfully!");
}

function updateSnoozeGrid() {
  const snoozeGrid = document.querySelector('.snooze-grid');
  snoozeGrid.innerHTML = ''; // Clear existing buttons
  
  const options = getSmartSnoozeOptions();
  
  options.forEach(option => {
    const button = document.createElement('button');
    button.id = option.id;
    button.textContent = option.text;
    button.addEventListener('click', () => snoozeTab(option.hours));
    snoozeGrid.appendChild(button);
  });

  // Add custom and recurring options
  const customButton = document.createElement('button');
  customButton.id = 'snoozeCustom';
  customButton.className = 'custom-snooze';
  customButton.textContent = 'Pick Date & Time';
  snoozeGrid.appendChild(customButton);

  const recurringButton = document.createElement('button');
  recurringButton.id = 'snoozeRecurring';
  recurringButton.className = 'custom-snooze';
  recurringButton.textContent = 'Set Recurring Snooze';
  snoozeGrid.appendChild(recurringButton);

  // Reattach event listeners for custom and recurring buttons
  setupModalHandlers();
}

// Initialize when the popup opens
document.addEventListener('DOMContentLoaded', () => {
  updateSnoozeGrid();
  listSnoozed();
});

// Update the snooze grid every minute to keep times current
setInterval(updateSnoozeGrid, 60000);

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

async function removeSnooze(alarmName) {
  const item = await chrome.storage.local.get(alarmName);
  const removeModal = document.getElementById("removeModal");
  const removeRecurringModal = document.getElementById("removeRecurringModal");
  
  if (item[alarmName]?.recurringId) {
    // Handle recurring snooze removal
    const modal = removeRecurringModal;
    modal.style.display = "block";
    
    return new Promise((resolve) => {
      const handleClick = async (action) => {
        modal.style.display = "none";
        
        if (action === 'cancel') {
          resolve();
          return;
        }

        // First clear the alarm and remove storage entries
        await chrome.alarms.clear(alarmName);
        await chrome.storage.local.remove(alarmName);

        if (action === 'removeAll' || action === 'removeAllAndOpen') {
          await chrome.storage.local.remove(item[alarmName].recurringId);
        }

        // Then open the tab if requested
        if (action === 'removeAllAndOpen' || action === 'removeSingleAndOpen') {
          await chrome.tabs.create({ url: item[alarmName].url });
        }
        
        listSnoozed();
        resolve();
      };

      modal.querySelector('.modal-confirm').onclick = () => handleClick('removeAllAndOpen');
      modal.querySelector('.modal-remove-only').onclick = () => handleClick('removeAll');
      modal.querySelector('.modal-remove-single').onclick = () => handleClick('removeSingleAndOpen');
      modal.querySelector('.modal-cancel').onclick = () => handleClick('cancel');
    });
  } else {
    // Handle regular snooze removal
    const modal = removeModal;
    modal.style.display = "block";
    
    return new Promise((resolve) => {
      const handleClick = async (action) => {
        modal.style.display = "none";
        
        if (action === 'cancel') {
          resolve();
          return;
        }

        // First clear the alarm and remove storage entry
        await chrome.alarms.clear(alarmName);
        await chrome.storage.local.remove(alarmName);

        // Then open the tab if requested
        if (action === 'removeAndOpen') {
          await chrome.tabs.create({ url: item[alarmName].url });
        }
        
        listSnoozed();
        resolve();
      };

      modal.querySelector('.modal-confirm').onclick = () => handleClick('removeAndOpen');
      modal.querySelector('.modal-remove-only').onclick = () => handleClick('removeOnly');
      modal.querySelector('.modal-cancel').onclick = () => handleClick('cancel');
    });
  }
}

function listSnoozed() {
  // first clear the list
  snoozeListDiv.innerHTML = "";

  chrome.storage.local.get(null, (items) => {
    // Create tabs container
    const tabsContainer = document.createElement("div");
    tabsContainer.className = "tabs-container";
    snoozeListDiv.appendChild(tabsContainer);

    // Count regular and recurring snoozes
    const regularSnoozes = Object.entries(items).filter(([key, value]) => 
      key.startsWith("snooze-") && !value.recurringId
    );
    const recurringSnoozes = Object.entries(items).filter(([key, value]) => 
      key.startsWith("snooze-") && value.recurringId
    );

    // Create tab buttons
    const tabButtons = document.createElement("div");
    tabButtons.className = "tab-buttons";
    tabButtons.innerHTML = `
      <button class="tab-button active" data-tab="regular">
        One-time
        <span class="count">${regularSnoozes.length}</span>
      </button>
      <button class="tab-button" data-tab="recurring">
        Recurring
        <span class="count">${recurringSnoozes.length}</span>
      </button>
    `;
    tabsContainer.appendChild(tabButtons);

    // Create tab content containers
    const regularTabContent = document.createElement("div");
    regularTabContent.className = "tab-content active";
    regularTabContent.id = "regular-tab";

    const recurringTabContent = document.createElement("div");
    recurringTabContent.className = "tab-content";
    recurringTabContent.id = "recurring-tab";

    // Add empty states
    if (regularSnoozes.length === 0) {
      regularTabContent.innerHTML = `
        <div class="empty-state">
          <p>No snoozed tabs</p>
          <p class="empty-subtitle">Choose a time above to snooze your current tab</p>
        </div>
      `;
    }

    if (recurringSnoozes.length === 0) {
      recurringTabContent.innerHTML = `
        <div class="empty-state">
          <p>No recurring tabs</p>
          <p class="empty-subtitle">Set up recurring snoozes for tabs you need regularly</p>
        </div>
      `;
    }

    // Add tab content
    tabsContainer.appendChild(regularTabContent);
    tabsContainer.appendChild(recurringTabContent);

    // Add click handlers for tabs
    tabButtons.querySelectorAll('.tab-button').forEach(button => {
      button.addEventListener('click', () => {
        tabButtons.querySelector('.active').classList.remove('active');
        button.classList.add('active');
        
        const tabId = button.dataset.tab;
        tabsContainer.querySelectorAll('.tab-content').forEach(content => {
          content.classList.remove('active');
        });
        tabsContainer.querySelector(`#${tabId}-tab`).classList.add('active');
      });
    });

    // Populate tabs with items
    const addItemToTab = (key, value, container) => {
      const { url, snoozeTime, title, recurringId } = value;
      const snoozeTimeStr = new Date(snoozeTime).toLocaleString();
      const listItem = document.createElement("div");
      listItem.className = "snoozed-tab";

      const recurringIndicator = recurringId ? "🔄 " : "";
      const data = title || url;
      
      listItem.innerHTML = `
        <span title="${data}" class="tab-info">
          <div class="tab-title">${recurringIndicator}${data}</div>
          <div class="tab-time">${snoozeTimeStr}</div>
        </span>
      `;

      const removeButton = document.createElement("button");
      removeButton.className = "remove-btn";
      removeButton.innerHTML = '<span class="close-icon"></span>';
      removeButton.title = "Remove snooze"; // Add tooltip
      removeButton.addEventListener("click", () => removeSnooze(key));
      listItem.appendChild(removeButton);

      container.appendChild(listItem);
    };

    // Sort and add items to appropriate tabs
    regularSnoozes
      .sort(([,a], [,b]) => a.snoozeTime - b.snoozeTime)
      .forEach(([key, value]) => addItemToTab(key, value, regularTabContent));

    recurringSnoozes
      .sort(([,a], [,b]) => a.snoozeTime - b.snoozeTime)
      .forEach(([key, value]) => addItemToTab(key, value, recurringTabContent));
  });
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

# Tab Snoozer

Tab Snoozer is a Chrome extension that helps you manage your browser tabs by allowing you to "snooze" them for a set period. Once snoozed, the tab will close and reopen automatically at the specified time.

## Features
- Snooze the current tab for:
  - 2 Minutes 
  - 1 Hour
  - 1 Day
  - 1 Week
- Automatically reopens snoozed tabs at the selected time.
- Provides a fallback mechanism (heartbeat) to ensure tabs reopen even if alarms fail.

## How It Works
1. Open the extension popup by clicking the extension icon.
2. Select the snooze duration (1 Hour, 1 Day, or 1 Week).
3. The current tab's URL is saved to Chrome storage and scheduled for reopening using Chrome alarms.
4. At the scheduled time:
   - The tab is reopened automatically.
   - The URL is removed from Chrome storage to maintain a clean state.
5. A fallback mechanism runs every 5 minutes to check for missed or overdue tabs.

## Permissions Used
### 1. `activeTab`
- Allows the extension to access the URL of the active tab.
- Ensures that the extension only interacts with the tab you choose to snooze.

### 2. `storage`
- Used to store the snoozed tabs' URLs and their snooze schedules.
- Data is stored locally in the browser and is not shared or synced externally.

### 3. `alarms`
- Used to schedule the reopening of snoozed tabs at the selected time.

## Privacy Policy
Your privacy is our priority. This extension:
- **Does not collect or transmit any data**: All information about snoozed tabs is stored locally in your browser.
- **Does not track your browsing activity**: The `activeTab` permission is only used temporarily when you snooze a tab.
- **Does not use external servers**: All operations are performed locally on your device.

## Installation
1. Download or clone the repository.
2. Open Chrome and go to `chrome://extensions/`.
3. Enable **Developer Mode** (toggle in the top-right corner).
4. Click **Load unpacked** and select the folder containing the extension files.

## Usage
1. Click the Tab Snoozer icon in the Chrome toolbar.
2. Select a snooze duration.
3. Let Tab Snoozer handle the rest!

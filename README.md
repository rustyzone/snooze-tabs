# Tab Snoozer

Tab Snoozer is a Chrome extension that helps you manage your browser tabs by allowing you to "snooze" them for a set period. Once snoozed, the tab will close and reopen automatically at the specified time.

## Features
- Snooze the current tab for:
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

### Smart Timing Options

The extension provides context-aware snooze options that change based on the time of day:

- **Quick Options** (Always available)
  - Snooze for 10 minutes
  - Snooze for 1 hour

- **Context-Aware Options**
  - Morning (before 12 PM)
    - "Snooze until 2 PM"
  - Afternoon (12 PM - 5 PM)
    - "Snooze until this evening (6 PM)"
  - Evening/Night (after 5 PM)
    - "Snooze until tomorrow morning (9 AM)"

- **Weekend Planning**
  - Weekdays (Monday-Friday)
    - "Snooze until Saturday morning (10 AM)"
  - Weekends (Saturday-Sunday)
    - "Snooze until Monday morning (9 AM)"

### Custom Date & Time

Click "Pick Date & Time" to choose any specific date and time to snooze your tab until.

### Recurring Snooze

The recurring snooze feature lets you automatically reopen tabs on specific days at a set time.

#### Setting up a Recurring Snooze:
1. Click "Set Recurring Snooze"
2. Choose the time you want the tab to reopen
3. Select which days of the week you want it to recur
4. Click "Set Recurring"

#### Managing Recurring Snoozes:
- Recurring tabs are marked with a 🔄 symbol in the snoozed tabs list
- To stop a recurring snooze:
  1. Find the tab in the snoozed list
  2. Click "Remove"
  3. When prompted, choose "Remove all future occurrences" to stop the recurring schedule
  4. Choose "Cancel" to keep the recurring schedule but remove just this instance

## Tips
- The snooze options update every minute to stay context-aware
- You can see all your snoozed tabs in the list below the snooze options
- Hover over a tab title to see the full URL if it's too long to display
- Times are shown in your local timezone

## Technical Details
- Recurring snoozes are stored separately from regular snoozes to maintain the schedule
- The extension uses Chrome's alarm API to ensure reliable tab reopening
- All snoozed tabs and their schedules persist even if you close Chrome

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

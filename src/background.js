import browser from 'webextension-polyfill';
import TabRegistry from './utils/TabRegistry';
import * as settings from './utils/settings';
import { messages, ports } from './utils/constants';
import handleMessage from './utils/handleMessage';
import isSpecialTab from './utils/isSpecialTab';

settings.initialize();
const registry = new TabRegistry({ numberOfTabsToShow: settings.get().maxNumberOfTabs });

async function addCurrentTabToRegistry() {
  const [currentTab] = await browser.tabs.query({
    active: true,
    currentWindow: true,
  });
  // the tab can be instantly closed and therefore currentTab can be null
  if (currentTab) {
    registry.push(currentTab);
  }
}

// initialize registry with currently active tab
addCurrentTabToRegistry();

async function initializeContentScript(tab) {
  if (!registry.isInitialized(tab)) {
    const settingsString = settings.getString();
    await browser.tabs.executeScript(tab.id, { code: `window.settings = ${settingsString};` });
    await browser.tabs.executeScript(tab.id, { file: 'content.js' });
    registry.addToInitialized(tab);
  }
}

async function handleCommand(command) {
  const [currentTab] = await browser.tabs.query({
    active: true,
    currentWindow: true,
  });

  if (!currentTab) return;

  // handle special chrome tabs separately because they do not allow script executions
  if (isSpecialTab(currentTab)) {
    const previousTab = registry.getPreviouslyActive();
    if (previousTab) {
      await browser.tabs.update(previousTab.id, { active: true });
    }
    return;
  }

  await initializeContentScript(currentTab);

  // send the command to the content script
  await browser.tabs.sendMessage(currentTab.id, {
    type: messages.SELECT_TAB,
    tabsData: registry.getTabsToShow(),
    increment: command === 'next' ? 1 : -1,
  });
}

browser.commands.onCommand.addListener(handleCommand);

browser.tabs.onActivated.addListener(addCurrentTabToRegistry);
browser.windows.onFocusChanged.addListener(addCurrentTabToRegistry);

browser.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    registry.removeFromInitialized(tabId);
    registry.update(tab);
  }
});

browser.tabs.onRemoved.addListener(async (tabId) => {
  registry.remove(tabId);
  const currentTab = registry.getActive();
  if (currentTab) {
    await browser.tabs.update(currentTab.id, { active: true });
  }
});

function isAllowedUrl(url) {
  return url !== 'about:blank' && !url.startsWith('chrome:');
}

browser.runtime.onConnect.addListener((port) => {
  if (ports.CONTENT_SCRIPT === port.name) {
    port.onMessage.addListener(handleMessage({
      [messages.SWITCH_TAB]: async ({ selectedTab }) => {
        await browser.windows.update(selectedTab.windowId, { focused: true });
        await browser.tabs.update(selectedTab.id, { active: true });
      },
    }));
  } else if (ports.POPUP_SCRIPT === port.name) {
    port.onMessage.addListener(handleMessage({
      [messages.UPDATE_SETTINGS]: async ({ newSettings }) => {
        settings.update(newSettings);
        registry.numberOfTabsToShow = newSettings.numberOfTabsToShow;

        await Promise.all(Object.values(registry.initializedTabs)
          .map(({ id }) => browser.tabs.sendMessage(id, {
            type: messages.UPDATE_SETTINGS_SILENTLY,
            newSettings,
          })));

        const [currentTab] = await browser.tabs.query({
          active: true,
          currentWindow: true,
        });

        if (!currentTab) return;

        // handle special chrome tabs separately because they do not allow script executions
        if (isSpecialTab(currentTab)) {
          const previousNormalTab = registry.findBackward(tab => !isSpecialTab(tab));
          if (previousNormalTab) {
            await browser.tabs.update(previousNormalTab.id, { active: true });
          }
          return;
        }

        await initializeContentScript(currentTab);

        // send the command to the content script
        await browser.tabs.sendMessage(currentTab.id, {
          type: messages.UPDATE_SETTINGS,
          newSettings,
          tabsData: registry.getTabsToShow(),
        });
      },
    }));

    // notify the tab when the settings popup closes
    port.onDisconnect.addListener(async () => {
      const [currentTab] = await browser.tabs.query({
        active: true,
        currentWindow: true,
      });

      await browser.tabs.sendMessage(currentTab.id, {
        type: messages.CLOSE_SETTINGS,
      });
    });
  }
});

// code that runs only in end-to-end tests
if (E2E) {
  browser.runtime.onConnect.addListener((port) => {
    if (port.name === ports.COMMANDS_BRIDGE) {
      port.onMessage.addListener(async ({ command }) => {
        await handleCommand(command);
      });
    }
  });

  browser.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && isAllowedUrl(tab.url)) {
      await browser.tabs.executeScript(tabId, { file: 'e2eTestCommandsBridge.js' });
    }
  });
}

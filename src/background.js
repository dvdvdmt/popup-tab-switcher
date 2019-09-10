import browser from 'webextension-polyfill';
import TabRegistry from './utils/tab-registry';
import Settings from './utils/settings';
import {
  commands,
  messages,
  ports,
  uninstallURL,
} from './utils/constants';
import handleMessage from './utils/handle-message';
import isSpecialTab from './utils/is-special-tab';
import isBrowserFocused from './utils/is-browser-focused';

const settings = new Settings();
const registry = new TabRegistry({ numberOfTabsToShow: settings.get('numberOfTabsToShow') });
init();

function init() {
  initRegistry();
  browser.commands.onCommand.addListener(handleCommand);
  browser.tabs.onActivated.addListener(handleTabActivation);
  browser.windows.onFocusChanged.addListener(handleTabActivation);
  browser.tabs.onUpdated.addListener(handleTabUpdate);
  browser.tabs.onRemoved.addListener(handleTabRemove);
  browser.runtime.onConnect.addListener(handleCommunications);
  if (PRODUCTION) {
    initForProduction();
  }
  if (E2E) {
    initForE2ETests();
  }
}

function initRegistry() {
  handleTabActivation();
}

function initForProduction() {
  browser.runtime.setUninstallURL(uninstallURL);
}

function initForE2ETests() {
  const isAllowedUrl = url => url !== 'about:blank' && !url.startsWith('chrome:');
  browser.runtime.onConnect.addListener((port) => {
    if (port.name === ports.COMMANDS_BRIDGE) {
      port.onMessage.addListener(async ({ command }) => {
        await handleCommand(command);
      });
    }
  });
  browser.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && isAllowedUrl(tab.url)) {
      await browser.tabs.executeScript(tabId, { file: 'e2e-test-commands-bridge.js' });
    }
  });
}

async function handleCommand(command) {
  const currentTab = await getActiveTab();
  if (!currentTab) {
    return;
  }
  // handle special chrome tabs separately because they do not allow script executions
  if (isSpecialTab(currentTab)) {
    const previousTab = registry.getPreviouslyActive();
    if (previousTab) {
      await activateTab(previousTab);
    }
    return;
  }
  await initializeContentScript(currentTab);
  // send the command to the content script
  await browser.tabs.sendMessage(currentTab.id, {
    type: messages.SELECT_TAB,
    tabsData: registry.getTabsToShow(),
    increment: command === commands.NEXT ? 1 : -1,
  });
}

async function handleTabActivation() {
  const currentTab = await getActiveTab();
  // the tab can be instantly closed and therefore currentTab can be null
  if (currentTab) {
    registry.push(currentTab);
  }
}

async function handleTabUpdate(tabId, changeInfo, tab) {
  if (changeInfo.status === 'complete') {
    registry.removeFromInitialized(tabId);
    registry.update(tab);
  }
}

async function handleTabRemove(tabId) {
  registry.remove(tabId);
  const isSwitchingNeeded = settings.get('isSwitchingToPreviouslyUsedTab');
  if (isSwitchingNeeded) {
    const currentTab = registry.getActive();
    if (currentTab) {
      await activateTab(currentTab);
    }
  }
}

function handleCommunications(port) {
  if (ports.CONTENT_SCRIPT === port.name) {
    port.onMessage.addListener(handleContentScriptMessages());
  } else if (ports.POPUP_SCRIPT === port.name) {
    port.onMessage.addListener(handlePopupMessages());
    // notify a tab when the settings popup closes
    port.onDisconnect.addListener(handlePopupScriptDisconnection);
  }
}

async function initializeContentScript(tab) {
  if (!registry.isInitialized(tab)) {
    const settingsString = settings.getString();
    await browser.tabs.executeScript(tab.id, { code: `window.settings = ${settingsString};` });
    await browser.tabs.executeScript(tab.id, { file: 'content.js' });
    registry.addToInitialized(tab);
  }
}

async function getActiveTab() {
  const [activeTab] = await browser.tabs.query({
    active: true,
    currentWindow: true,
  });
  return activeTab;
}

async function activateTab({ id, windowId }) {
  if (isBrowserFocused()) {
    await browser.windows.update(windowId, { focused: true });
  }
  await browser.tabs.update(id, { active: true });
}

function handlePopupMessages() {
  return handleMessage({
    [messages.UPDATE_SETTINGS]: async ({ newSettings }) => {
      settings.update(newSettings);
      registry.numberOfTabsToShow = newSettings.numberOfTabsToShow;
      await Promise.all(Object.values(registry.initializedTabs)
        .map(({ id }) => browser.tabs.sendMessage(id, {
          type: messages.UPDATE_SETTINGS_SILENTLY,
          newSettings,
        })));
      const activeTab = await getActiveTab();
      if (!activeTab) {
        return;
      }
      // handle special chrome tabs separately because they do not allow script executions
      if (isSpecialTab(activeTab)) {
        const previousNormalTab = registry.findBackward(tab => !isSpecialTab(tab));
        if (previousNormalTab) {
          await activateTab(previousNormalTab);
        }
        return;
      }
      await initializeContentScript(activeTab);
      // send the command to the content script
      await browser.tabs.sendMessage(activeTab.id, {
        type: messages.UPDATE_SETTINGS,
        newSettings,
        tabsData: registry.getTabsToShow(),
      });
    },
  });
}

async function handlePopupScriptDisconnection() {
  const currentTab = await getActiveTab();
  await browser.tabs.sendMessage(currentTab.id, {
    type: messages.CLOSE_POPUP,
  });
}

function handleContentScriptMessages() {
  return handleMessage({
    [messages.SWITCH_TAB]: async ({ selectedTab }) => {
      await activateTab(selectedTab);
    },
  });
}

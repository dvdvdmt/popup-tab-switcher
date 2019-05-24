import browser from 'webextension-polyfill';
import * as tabRegistryBase from './tabRegistry';
import tabRegistryDataUrlIconHandler from './utils/tabRegistryDataUrlIconHandler';

const tabRegistry = new Proxy(tabRegistryBase, tabRegistryDataUrlIconHandler);

async function addCurrentTabToRegistry() {
  const [currentTab] = await browser.tabs.query({
    active: true,
    currentWindow: true,
  });
  // the tab can be instantly closed and therefore currentTab can be null
  if (currentTab) {
    tabRegistry.push(currentTab);
  }
}

// initialize registry with currently active tab
addCurrentTabToRegistry();

async function handleCommand(command) {
  const [currentTab] = await browser.tabs.query({
    active: true,
    currentWindow: true,
  });

  if (!currentTab) return;

  // handle special chrome tabs separately
  if (currentTab.url.startsWith('chrome://')) {
    const previousTab = tabRegistry.getTabs()[1];
    if (previousTab) {
      await browser.tabs.update(previousTab.id, { active: true });
    }
    return;
  }

  // initialize content script
  if (!tabRegistry.isInitialized(currentTab)) {
    await browser.tabs.executeScript(currentTab.id, { file: 'content.js' });
    tabRegistry.addToInitialized(currentTab);
  }

  // send the command to the content script
  await browser.tabs.sendMessage(currentTab.id, {
    type: command,
    tabsData: tabRegistry.getTabsData(),
  });
}

browser.commands.onCommand.addListener(handleCommand);

browser.tabs.onActivated.addListener(addCurrentTabToRegistry);

browser.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    tabRegistry.removeFromInitialized(tabId);
    tabRegistry.update(tab);
  }
});

browser.tabs.onRemoved.addListener(async (tabId) => {
  tabRegistry.remove(tabId);
  const currentTab = tabRegistry.getTabs()[0];
  if (currentTab) {
    await browser.tabs.update(currentTab.id, { active: true });
  }
});

function isAllowedUrl(url) {
  return url !== 'about:blank' && !url.startsWith('chrome:');
}

browser.runtime.onConnect.addListener((port) => {
  if (port.name === 'content script') {
    port.onMessage.addListener(async ({ selectedTab }) => {
      await browser.tabs.update(selectedTab.id, { active: true });
    });
  }
});

// code that runs only in end-to-end tests
if (E2E) {
  browser.runtime.onConnect.addListener((port) => {
    if (port.name === 'commands bridge') {
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

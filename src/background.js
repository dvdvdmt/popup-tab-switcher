import browser from 'webextension-polyfill';
import * as tabRegistry from './tabRegistry';

async function updateTabsData(tabId, tabsData) {
  await browser.tabs.sendMessage(tabId, {
    type: 'update',
    tabsData,
  });
}

browser.commands.onCommand.addListener(async (command) => {
  const [currentTab] = await browser.tabs.query({
    active: true,
    currentWindow: true,
  });

  if (!tabRegistry.isInitialized(currentTab)) {
    await browser.tabs.insertCSS({ file: 'content.css' });
    await browser.tabs.executeScript({ file: 'content.js' });

    tabRegistry.push(currentTab);
    await updateTabsData(currentTab.id, tabRegistry.getTabsData());
    tabRegistry.markAsInitialized(currentTab);
  }

  // Send separate message instead of listening 'keydown' event
  // in content script because Chrome doesn't allow listening
  // for extension shortcuts in content scripts
  browser.tabs.sendMessage(currentTab.id, {
    type: command,
  });
});

browser.tabs.onActivated.addListener(async () => {
  const [currentTab] = await browser.tabs.query({
    active: true,
    currentWindow: true,
  });
  tabRegistry.push(currentTab);
  if (tabRegistry.isInitialized(currentTab)) {
    await updateTabsData(currentTab.id, tabRegistry.getTabsData());
  }
});

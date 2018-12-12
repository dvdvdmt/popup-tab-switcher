import browser from 'webextension-polyfill';
import * as tabs from './tabs';

browser.commands.onCommand.addListener(async (command) => {
  const [currentTab] = await browser.tabs.query({
    active: true,
    currentWindow: true,
  });

  if (!tabs.isInitialized(currentTab)) {
    await browser.tabs.insertCSS({ file: 'content.css' });
    await browser.tabs.executeScript({ file: 'content.js' });

    tabs.pushToRegistry(currentTab);
    await browser.tabs.sendMessage(currentTab.id, {
      type: 'initialize',
      tabs: tabs.getForRender(),
    });

    tabs.markAsInitialized(currentTab);
  }

  // Send separate message instead of listening 'keydown' event
  // in content script because Chrome doesn't allow listening
  // for extension shortcuts in content scripts
  browser.tabs.sendMessage(currentTab.id, {
    type: command,
  });
});

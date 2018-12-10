import browser from 'webextension-polyfill';

const maxTabsNumber = 10;
const initializedTabs = {};

browser.commands.onCommand.addListener(async (command) => {
  const [currentTab] = await browser.tabs.query({
    active: true,
    currentWindow: true,
  });

  if (!initializedTabs[currentTab.id]) {
    await browser.tabs.insertCSS({ file: 'content.css' });
    await browser.tabs.executeScript({ file: 'content.js' });
    const otherTabs = (await browser.tabs.query({}))
      .slice(0, maxTabsNumber)
      .filter(({ windowId, index }) => windowId !== currentTab.windowId
                                       && index !== currentTab.index);
    await browser.tabs.sendMessage(currentTab.id, {
      type: 'initialize',
      tabs: [currentTab, ...otherTabs]
        .map(({ url, title, favIconUrl }) => ({
          url,
          title,
          favIconUrl,
        })),
    });

    initializedTabs[currentTab.id] = currentTab;
  }

  // Send separate message instead of listening 'keydown' event
  // in content script because Chrome doesn't allow listening
  // for extension shortcuts in content scripts
  browser.tabs.sendMessage(currentTab.id, {
    type: command,
  });
});

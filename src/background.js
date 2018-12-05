import browser from 'webextension-polyfill';

const initializedTabs = {};

browser.commands.onCommand.addListener(async (command) => {
  const [currentTab] = await browser.tabs.query({
    active: true,
    currentWindow: true,
  });

  if (!initializedTabs[currentTab.id]) {
    await browser.tabs.insertCSS({ file: 'content.css' });
    await browser.tabs.executeScript({ file: 'content.js' });
    initializedTabs[currentTab.id] = currentTab;
  }

  const allTabs = await browser.tabs.query({});
  const message = {
    tabs: allTabs.map(({ url, title, favIconUrl }) => ({
      url,
      title,
      favIconUrl,
    })),
  };
  browser.tabs.sendMessage(currentTab.id, message);
});

import browser from 'webextension-polyfill';

browser.commands.onCommand.addListener(async (command) => {
  await browser.tabs.insertCSS({ file: 'content.css' });
  await browser.tabs.executeScript({ file: 'content.js' });
  const [currentTab] = await browser.tabs.query({
    active: true,
    currentWindow: true,
  });
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

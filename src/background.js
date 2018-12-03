import browser from 'webextension-polyfill';

browser.commands.onCommand.addListener(async (command) => {
  await browser.tabs.insertCSS({ file: 'content.css' });
  console.log('content.css was injected');
  await browser.tabs.executeScript({ file: 'content.js' });
  console.log('content.js was injected');
});

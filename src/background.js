import browser from 'webextension-polyfill';

browser.browserAction.onClicked.addListener(() => {
  console.log('It works!');
});

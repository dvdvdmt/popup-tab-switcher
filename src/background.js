import browser from 'webextension-polyfill';

browser.browserAction.onClicked.addListener(() => {
  console.log('It works?');
});

console.log('It loads! And works? Now?');

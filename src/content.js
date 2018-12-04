import browser from 'webextension-polyfill';

/* eslint-disable no-undef */
const overlay = document.createElement('div');
overlay.className = 'popup-tab-switcher';
overlay.addEventListener('click', () => { overlay.style.display = 'none'; });

const card = document.createElement('pre');
card.className = 'popup-tab-switcher__card';
card.textContent = 'Hello!';

overlay.append(card);
document.body.append(overlay);

browser.runtime.onMessage.addListener((message) => {
  if (message.tabs) {
    card.textContent = JSON.stringify(message.tabs, null, 2);
  }
});

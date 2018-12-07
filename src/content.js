/* eslint-disable no-undef */
import browser from 'webextension-polyfill';

const overlay = document.createElement('div');
overlay.className = 'popup-tab-switcher';

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

function hideOverlay() {
  overlay.style.display = 'none';
}

overlay.addEventListener('click', hideOverlay);

document.addEventListener('keyup', ({ key }) => {
  if (key === 'Alt') {
    hideOverlay();
  }
});

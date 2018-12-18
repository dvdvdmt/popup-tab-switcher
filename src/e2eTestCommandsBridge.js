import browser from 'webextension-polyfill';

const port = browser.runtime.connect({ name: 'commands bridge' });

window.addEventListener('keydown', ({ key, altKey }) => {
  if (altKey && key === 'y') {
    port.postMessage({ command: 'next' });
  }
});

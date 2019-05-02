import browser from 'webextension-polyfill';

const port = browser.runtime.connect({ name: 'commands bridge' });

window.addEventListener('keydown', ({ key, altKey, shiftKey }) => {
  const keyLower = key.toLowerCase();
  if (shiftKey && altKey && keyLower === 'y') {
    port.postMessage({ command: 'previous' });
  } else if (altKey && keyLower === 'y') {
    port.postMessage({ command: 'next' });
  }
});

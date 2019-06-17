import browser from 'webextension-polyfill';
import { ports } from './utils/constants';

const port = browser.runtime.connect({ name: ports.COMMANDS_BRIDGE });

window.addEventListener('keydown', ({ key, altKey, shiftKey }) => {
  const keyLower = key.toLowerCase();
  if (shiftKey && altKey && keyLower === 'y') {
    port.postMessage({ command: 'previous' });
  } else if (altKey && keyLower === 'y') {
    port.postMessage({ command: 'next' });
  }
});

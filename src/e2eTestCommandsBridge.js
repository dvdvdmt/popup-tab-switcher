import browser from 'webextension-polyfill';
import { COMMANDS_BRIDGE_PORT } from './utils/constants';

const port = browser.runtime.connect({ name: COMMANDS_BRIDGE_PORT });

window.addEventListener('keydown', ({ key, altKey, shiftKey }) => {
  const keyLower = key.toLowerCase();
  if (shiftKey && altKey && keyLower === 'y') {
    port.postMessage({ command: 'previous' });
  } else if (altKey && keyLower === 'y') {
    port.postMessage({ command: 'next' });
  }
});

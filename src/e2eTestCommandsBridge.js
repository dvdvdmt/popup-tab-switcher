/* eslint-env browser */
import browser from 'webextension-polyfill';
import { ports } from './utils/constants';

const port = browser.runtime.connect({ name: ports.COMMANDS_BRIDGE });

window.addEventListener('keydown', ({
  key,
  altKey,
  ctrlKey,
  metaKey,
  shiftKey,
}) => {
  const keyLower = key.toLowerCase();
  const isModifier = altKey || ctrlKey || metaKey;
  if (shiftKey && isModifier && keyLower === 'y') {
    port.postMessage({ command: 'previous' });
  } else if (isModifier && keyLower === 'y') {
    port.postMessage({ command: 'next' });
  }
});

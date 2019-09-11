/* eslint-env browser */
import browser from 'webextension-polyfill';
import {commands, ports} from './utils/constants';

const port = browser.runtime.connect({name: ports.COMMANDS_BRIDGE});

function handleKeydown({
  key,
  altKey,
  ctrlKey,
  metaKey,
  shiftKey,
}) {
  const keyLower = key.toLowerCase();
  const isModifier = altKey || ctrlKey || metaKey;
  if (shiftKey && isModifier && keyLower === 'y') {
    port.postMessage({command: commands.PREVIOUS});
  } else if (isModifier && keyLower === 'y') {
    port.postMessage({command: commands.NEXT});
  }
}

window.addEventListener('keydown', handleKeydown);
// Because focused element can be in an iframe and keyboard events don't
// bubble up from iframes. Therefore we need to set separate keyboard listeners
// to each iframe on the page
const frames = document.querySelectorAll('iframe');
for (const frame of frames) {
  frame.contentWindow.addEventListener('keydown', handleKeydown);
}

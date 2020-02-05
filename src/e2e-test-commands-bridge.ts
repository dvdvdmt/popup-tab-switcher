import {browser} from 'webextension-polyfill-ts';
import {Command, Port} from './utils/constants';

const port = browser.runtime.connect(undefined, {name: Port.COMMANDS_BRIDGE});

function handleKeydown({key, altKey, ctrlKey, metaKey, shiftKey}: KeyboardEvent) {
  const keyLower = key.toLowerCase();
  const isModifier = altKey || ctrlKey || metaKey;
  if (shiftKey && isModifier && keyLower === 'y') {
    port.postMessage({command: Command.PREVIOUS});
  } else if (isModifier && keyLower === 'y') {
    port.postMessage({command: Command.NEXT});
  }
}

window.addEventListener('keydown', handleKeydown);

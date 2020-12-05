import {browser} from 'webextension-polyfill-ts';
import {Command, Port} from './utils/constants';
import * as Messages from './utils/messages';

const port = browser.runtime.connect(undefined, {name: Port.COMMANDS_BRIDGE});

function handleKeydown({key, altKey, ctrlKey, metaKey, shiftKey}: KeyboardEvent) {
  const keyLower = key.toLowerCase();
  const isModifier = altKey || ctrlKey || metaKey;
  if (shiftKey && isModifier && keyLower === 'y') {
    port.postMessage(Messages.command(Command.PREVIOUS));
  } else if (isModifier && keyLower === 'y') {
    port.postMessage(Messages.command(Command.NEXT));
  }
}

window.addEventListener('keydown', handleKeydown);

// * Register listener for custom event 'update-settings'. Which updates Settings of the extension.
// * In Puppeteer add helper to update settings.
// window.addEventListener('update-settings');

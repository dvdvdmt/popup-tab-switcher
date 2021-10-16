import browser from 'webextension-polyfill';
import {Command, Port} from './utils/constants';
import * as Messages from './utils/messages';

const port = browser.runtime.connect(undefined, {name: Port.COMMANDS_BRIDGE});

/*
 * Chromium in e2e tests doesn't receive OS keyboard events and extension shortcuts don't work.
 * Therefore we need to listen to keyboard events on a page and send them to background script
 * to simulate the work of extension's shortcuts that are defined in chrome://extensions/shortcuts.
 */
function sendCommandIfShortcutWasPressed({key, altKey, ctrlKey, metaKey, shiftKey}: KeyboardEvent) {
  const keyLower = key.toLowerCase();
  const isModifier = altKey || ctrlKey || metaKey;
  if (shiftKey && isModifier && keyLower === 'y') {
    port.postMessage(Messages.command(Command.PREVIOUS));
  } else if (isModifier && keyLower === 'y') {
    port.postMessage(Messages.command(Command.NEXT));
  }
}

window.addEventListener('keydown', sendCommandIfShortcutWasPressed);

function sendCommandToBackground(e: CustomEvent<unknown>) {
  port.postMessage(e.detail);
}

// @ts-expect-error We can extend WindowEventMap with this and other custom events if necessary (https://github.com/microsoft/TypeScript/issues/28357#issuecomment-711415095)
window.addEventListener('e2e-command-to-background', sendCommandToBackground);

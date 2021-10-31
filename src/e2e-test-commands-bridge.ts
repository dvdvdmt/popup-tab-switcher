import browser from 'webextension-polyfill'
import {Command, Port} from './utils/constants'
import * as Messages from './utils/messages'

declare global {
  interface Window {
    isCommandBridgeRegistered: boolean
  }
}

let port: browser.Runtime.Port
if (!window.isCommandBridgeRegistered) {
  port = browser.runtime.connect(undefined, {name: Port.COMMANDS_BRIDGE})
  window.addEventListener('keydown', sendCommandIfShortcutWasPressed)
  // @ts-expect-error We can extend WindowEventMap with this and other custom events if necessary (https://github.com/microsoft/TypeScript/issues/28357#issuecomment-711415095)
  window.addEventListener('e2e-command-to-background', sendCommandToBackground)
  window.isCommandBridgeRegistered = true
}

/*
 * Chromium in e2e tests doesn't receive OS keyboard events and extension shortcuts don't work (more info https://github.com/puppeteer/puppeteer/issues/2210#issuecomment-384778255).
 * Therefore we need to listen to keyboard events on a page and send them to background script
 * to simulate the work of extension's shortcuts that are defined in chrome://extensions/shortcuts.
 */
function sendCommandIfShortcutWasPressed({key, altKey, ctrlKey, metaKey, shiftKey}: KeyboardEvent) {
  const keyLower = key.toLowerCase()
  const isModifier = altKey || ctrlKey || metaKey
  if (shiftKey && isModifier && keyLower === 'y') {
    port.postMessage(Messages.command(Command.PREVIOUS))
  } else if (isModifier && keyLower === 'y') {
    port.postMessage(Messages.command(Command.NEXT))
  }
}

function sendCommandToBackground(e: CustomEvent<unknown>) {
  port.postMessage(e.detail)
}

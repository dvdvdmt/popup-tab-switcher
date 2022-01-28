import {command} from '../../../src/utils/messages'
import {Command} from '../../../src/utils/constants'
import {sendMessage} from './send-message'

let lastCommandPromise: Promise<void> = Promise.resolve()

/*
 * Chromium in e2e tests doesn't receive OS keyboard events and extension shortcuts don't work (more info https://github.com/puppeteer/puppeteer/issues/2210#issuecomment-384778255).
 * Therefore we need to listen to keyboard events on a page and send them to background script
 * to simulate the work of extension's shortcuts that are defined in chrome://extensions/shortcuts.
 */
export function sendCommandOnShortcut({key, altKey, ctrlKey, metaKey, shiftKey}: KeyboardEvent) {
  const keyLower = key.toLowerCase()
  const isModifier = altKey || ctrlKey || metaKey
  if (shiftKey && isModifier && keyLower === 'y') {
    lastCommandPromise = sendMessage(command(Command.PREVIOUS))
  } else if (isModifier && keyLower === 'y') {
    lastCommandPromise = sendMessage(command(Command.NEXT))
  }
}

export function waitUntilCommandReachesTheBackgroundScript(): Promise<void> {
  return lastCommandPromise
}

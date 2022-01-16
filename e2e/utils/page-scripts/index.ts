import {isVisible} from './is-visible'
import {sendCommandOnShortcut} from './send-command-on-shortcut'
import {queryPopup} from './query-popup'
import {initMessageListener, sendMessage} from './send-message'

declare global {
  interface Window {
    e2e: {
      queryPopup(selector: string): Element[]
      sendMessage(message: unknown): void
      isVisible(el: Element): boolean
    }
  }
}

if (!window.e2e) {
  console.log(`[PageScripts registered]`)
  window.addEventListener('keydown', sendCommandOnShortcut)
  initMessageListener()
  window.e2e = {isVisible, queryPopup, sendMessage}
}

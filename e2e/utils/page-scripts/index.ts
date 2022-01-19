import {isVisible} from './is-visible'
import {sendCommandOnShortcut} from './send-command-on-shortcut'
import {queryPopup} from './query-popup'
import {initMessageListener, sendMessage} from './send-message'
import {getSettings} from './get-settings'

declare global {
  interface Window {
    e2e: {
      queryPopup: typeof queryPopup
      sendMessage: typeof sendMessage
      isVisible: typeof isVisible
      getSettings: typeof getSettings
    }
  }
}

if (!window.e2e) {
  window.addEventListener('keydown', sendCommandOnShortcut)
  initMessageListener()
  window.e2e = {isVisible, queryPopup, sendMessage, getSettings}
  console.log(`[PageScripts registered]`)
}

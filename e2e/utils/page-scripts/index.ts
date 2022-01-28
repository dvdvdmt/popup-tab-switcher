import {isVisible} from './is-visible'
import {
  sendCommandOnShortcut,
  waitUntilCommandReachesTheBackgroundScript,
} from './send-command-on-shortcut'
import {queryPopup} from './query-popup'
import {initMessageListener, sendMessage} from './send-message'
import {getSettings} from './get-settings'
import {resolveWhenPageBecomesVisible} from './resolve-when-page-becomes-visible'

declare global {
  interface Window {
    e2e: {
      queryPopup: typeof queryPopup
      sendMessage: typeof sendMessage
      isVisible: typeof isVisible
      getSettings: typeof getSettings
      resolveWhenPageBecomesVisible: typeof resolveWhenPageBecomesVisible
      waitUntilCommandReachesTheBackgroundScript: typeof waitUntilCommandReachesTheBackgroundScript
    }
  }
}

if (!window.e2e) {
  window.addEventListener('keydown', sendCommandOnShortcut)
  initMessageListener()
  window.e2e = {
    isVisible,
    queryPopup,
    sendMessage,
    getSettings,
    resolveWhenPageBecomesVisible,
    waitUntilCommandReachesTheBackgroundScript,
  }
  console.log(`[PageScripts registered]`)
}

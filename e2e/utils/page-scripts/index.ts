import {isVisible} from './is-visible'
import {
  sendCommandOnShortcut,
  waitUntilCommandReachesTheBackgroundScript,
} from './send-command-on-shortcut'
import {queryPopup} from './query-popup'
import {initMessageListener, sendMessage} from './send-message'
import {getSettings} from './get-settings'
import {resolveWhenPageBecomesVisible} from './resolve-when-page-becomes-visible'
import {isPageFocused} from './is-page-focused'

declare global {
  interface Window {
    e2e: {
      getSettings: typeof getSettings
      isPageFocused: typeof isPageFocused
      isVisible: typeof isVisible
      queryPopup: typeof queryPopup
      resolveWhenPageBecomesVisible: typeof resolveWhenPageBecomesVisible
      sendMessage: typeof sendMessage
      waitUntilCommandReachesTheBackgroundScript: typeof waitUntilCommandReachesTheBackgroundScript
    }
  }
}

if (!window.e2e) {
  window.addEventListener('keydown', sendCommandOnShortcut)
  initMessageListener()
  window.e2e = {
    getSettings,
    isPageFocused,
    isVisible,
    queryPopup,
    resolveWhenPageBecomesVisible,
    sendMessage,
    waitUntilCommandReachesTheBackgroundScript,
  }
  console.log(`[PageScripts registered]`)
}

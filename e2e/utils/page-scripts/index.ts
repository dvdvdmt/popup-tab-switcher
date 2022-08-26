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
import {log} from '../../../src/utils/logger'
import {isTabActive} from './is-tab-active'

declare global {
  interface Window {
    e2e: {
      getSettings: typeof getSettings
      isPageFocused: typeof isPageFocused
      isVisible: typeof isVisible
      isTabActive: typeof isTabActive
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
    isTabActive,
    isVisible,
    queryPopup,
    resolveWhenPageBecomesVisible,
    sendMessage,
    waitUntilCommandReachesTheBackgroundScript,
  }
  log(`[PageScripts registered]`)
}

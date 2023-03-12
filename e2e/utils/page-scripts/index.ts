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
import {waitUntilMessagingIsReady} from './is-messaging-ready'
import {setSettings} from './set-settings'

declare global {
  interface Window {
    e2e: {
      getSettings: typeof getSettings
      setSettings: typeof setSettings
      isPageFocused: typeof isPageFocused
      isVisible: typeof isVisible
      waitUntilMessagingIsReady: typeof waitUntilMessagingIsReady
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
    setSettings,
    isPageFocused,
    isTabActive,
    waitUntilMessagingIsReady,
    isVisible,
    queryPopup,
    resolveWhenPageBecomesVisible,
    sendMessage,
    waitUntilCommandReachesTheBackgroundScript,
  }
  log(`[PageScripts registered]`)
}

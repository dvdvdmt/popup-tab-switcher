import {checkTab, ITab} from '../utils/check-tab'
import {getActiveTab} from './get-active-tab'
import {IHandlers, Message} from '../utils/messages'
import {getLogs, log} from '../utils/logger'
import {handleCommand} from '../background'

/**
 * Contains different methods to help with E2E tests.
 */
export class BackgroundTestHelper {
  private startRenderingTime: number

  private endRenderingTime: number

  async initContentScript(tab?: ITab): Promise<void> {
    const active = tab ?? (await getActiveTab())
    if (isAllowedUrl(active)) {
      chrome.scripting.executeScript({
        target: {tabId: active.id},
        files: ['e2e-content-script.js'],
      })
    }
  }

  registerListeners(): void {
    chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
      await this.initContentScript(checkTab(tab))
    })
  }

  get messageHandlers(): Partial<IHandlers> {
    return {
      [Message.COMMAND]: async ({command}) => {
        log(`[Command received]`, command)
        await handleCommand(command)
      },
      [Message.E2E_SET_ZOOM]: ({zoomFactor}) => {
        chrome.tabs.setZoom(zoomFactor)
      },
      [Message.E2E_RELOAD_EXTENSION]: async () => {
        await chrome.runtime.reload()
      },
      [Message.E2E_IS_MESSAGING_READY]: async () => true,
      [Message.E2E_IS_PAGE_ACTIVE]: async (_message, sender) => {
        const activeTab = await getActiveTab()
        const sourceTab = sender.tab
        if (sourceTab && activeTab) {
          return sourceTab.id === activeTab.id && sourceTab.windowId === activeTab.windowId
        }
        return false
      },
      [Message.PopupShown]: () => {
        log(`[PopupShown received]`)
        this.measureEndRenderingTime()
      },
      [Message.GetRenderingTime]: async () => this.endRenderingTime - this.startRenderingTime,
      [Message.GetLogs]: async () => getLogs(),
    }
  }

  measureStartRenderingTime(): void {
    this.startRenderingTime = performance.now()
  }

  measureEndRenderingTime(): void {
    this.endRenderingTime = performance.now()
  }
}

function isAllowedUrl(tab?: chrome.tabs.Tab): tab is ITab {
  if (!tab || !tab.url || !tab.id || !tab.windowId) {
    return false
  }
  return tab.url !== 'about:blank' && !tab.url.startsWith('chrome')
}

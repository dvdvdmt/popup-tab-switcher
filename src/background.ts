import browser, {Runtime, Tabs} from 'webextension-polyfill'
import TabRegistry, {getTabRegistry} from './utils/tab-registry'
import {getSettings, ISettings} from './utils/settings'
import {Command, Port, uninstallURL} from './utils/constants'
import {
  closePopup,
  demoSettings,
  handleMessage,
  IHandlers,
  Message,
  selectTab,
} from './utils/messages'
import isCodeExecutionForbidden from './utils/is-code-execution-forbidden'
import {isBrowserFocused} from './utils/is-browser-focused'
import {checkTab, ITab} from './utils/check-tab'

import Tab = Tabs.Tab

let settings: ISettings
let registry: TabRegistry
let isTabActivationInProcess = false
getSettings(browser.storage.local)
  .then((newSettings) => {
    console.log(`[ settings initialized]`)
    settings = newSettings
    return getTabRegistry(settings.numberOfTabsToShow)
  })
  .then((newRegistry) => {
    registry = newRegistry
    initListeners()
  })

function initListeners() {
  /** NOTE:
   *  The order of events on tab creation in a new window:
   *  1. Tab created
   *  2. Window activated (focus changed)
   *  3. Tab activated
   */
  browser.tabs.onCreated.addListener(handleTabCreation)
  browser.windows.onFocusChanged.addListener(handleWindowActivation)
  browser.tabs.onActivated.addListener(handleTabActivation)
  browser.tabs.onUpdated.addListener(handleTabUpdate)
  browser.tabs.onRemoved.addListener(handleTabRemove)
  browser.runtime.onConnect.addListener(handleConnection)
  browser.commands.onCommand.addListener(handleCommand)
  const handlers = messageHandlers()
  browser.runtime.onMessage.addListener(handleMessage(handlers))
  if (PRODUCTION) {
    initForProduction()
  }
  if (E2E) {
    initForE2ETests(handlers)
  }
}

function initForProduction() {
  browser.runtime.setUninstallURL(uninstallURL)
}

function initForE2ETests(handlers: Partial<IHandlers>) {
  const isAllowedUrl = (url: string) => url !== 'about:blank' && !url.startsWith('chrome')
  browser.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    const checkedTab = checkTab(tab)
    if (isAllowedUrl(checkedTab.url)) {
      await browser.scripting.executeScript({
        target: {tabId, allFrames: true},
        files: ['e2e-content-script.js'],
      })
    }
  })
  if (E2E) {
    // eslint-disable-next-line no-param-reassign
    handlers[Message.COMMAND] = async ({command}) => {
      await handleCommand(command)
    }
    // eslint-disable-next-line no-param-reassign
    handlers[Message.E2E_SET_ZOOM] = ({zoomFactor}) => {
      browser.tabs.setZoom(zoomFactor)
    }
  }
}

async function handleCommand(command: string) {
  const activeTab = await getActiveTab()
  if (!activeTab) {
    return
  }
  const active = checkTab(activeTab)
  if (isCodeExecutionForbidden(active)) {
    // If the content script can't be initialized then switch to the previous tab.
    // TODO: Create popup window on the center of a screen and show PTS in it.
    const previousTab = registry.getPreviouslyActive()
    if (previousTab) {
      activateTab(previousTab)
    }
    return
  }
  await initializeContentScript(active)
  // send the command to the content script
  await browser.tabs.sendMessage(active.id, selectTab(command === Command.NEXT ? 1 : -1))
}

async function handleWindowActivation(windowId: number) {
  // Do not react on windows without ids.
  // This happens on each window activation in some Linux window managers.
  if (windowId === browser.windows.WINDOW_ID_NONE) {
    return
  }
  await handleTabActivation()
}

async function handleTabActivation(info?: Tabs.OnActivatedActiveInfoType) {
  if (isTabActivationInProcess) {
    console.log(`[handleTabActivation in process]`, info?.tabId, registry.titles())
    return
  }
  const active = await getActiveTab()
  // the tab can be instantly closed and therefore currentTab can be null
  if (active) {
    const activatedTabWasClosed = info && info.tabId !== active.id
    if (activatedTabWasClosed) {
      registry.setActive(info.tabId)
    } else {
      registry.push(checkTab(active))
    }
  }
  console.log(`[handleTabActivation]`, info?.tabId, active?.id, registry.titles())
}

function handleTabCreation(tab: Tab) {
  if (!tab.active) {
    registry.pushUnderTop(checkTab(tab))
  }
  console.log(`[handleTabCreation]`, tab.id, registry.titles())
}

function handleTabUpdate(tabId: number, changeInfo: Tabs.OnUpdatedChangeInfoType, tab: Tab) {
  if (changeInfo.status === 'complete') {
    registry.removeFromInitialized(tabId)
    registry.update(checkTab(tab))
  }
}

function handleTabRemove(tabId: number) {
  console.log(`[handleTabRemove start]`, tabId, registry.titles())
  registry.remove(tabId)
  const isSwitchingNeeded = settings.isSwitchingToPreviouslyUsedTab
  if (isSwitchingNeeded) {
    const currentTab = registry.getActive()
    if (currentTab) {
      activateTab(currentTab)
    }
  }
}

function messageHandlers(): Partial<IHandlers> {
  return {
    [Message.INITIALIZED]: (_m, sender) => {
      registry.addToInitialized(checkTab(sender.tab!))
    },
    [Message.SWITCH_TAB]: ({selectedTab}) => {
      activateTab(selectedTab)
    },
    [Message.UPDATE_SETTINGS]: async ({newSettings}) => {
      settings.update(newSettings)
      registry.setNumberOfTabsToShow(newSettings.numberOfTabsToShow)
      const activeTab = await getActiveTab()
      if (!activeTab) {
        return
      }
      const active = checkTab(activeTab)
      if (isCodeExecutionForbidden(active)) {
        const previousNormalTab = registry.findBackward((tab) => !isCodeExecutionForbidden(tab))
        if (previousNormalTab) {
          activateTab(previousNormalTab)
        }
        return
      }
      await initializeContentScript(active)
      // send a command to the content script
      await browser.tabs.sendMessage(active.id, demoSettings())
    },
    [Message.GET_MODEL]: async () => ({
      tabs: registry.getTabsToShow(),
      settings,
      zoomFactor: await browser.tabs.getZoom(),
    }),
  }
}

async function initializeContentScript(tab: ITab): Promise<void> {
  if (!registry.isInitialized(tab.id)) {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error('Initialization took too much time'))
      }, 100)
      registry.tabInitialized = resolve
      browser.scripting
        .executeScript({
          target: {tabId: tab.id, allFrames: true},
          files: ['content.js'],
        })
        .catch((e) => {
          clearTimeout(timeoutId)
          reject(e)
        })
    })
  }
  return Promise.resolve()
}

async function getActiveTab(): Promise<Tab | undefined> {
  const [activeTab] = await browser.tabs.query({
    active: true,
    currentWindow: true,
  })
  return activeTab
}

async function activateTab({id, windowId}: ITab) {
  isTabActivationInProcess = true
  await browser.tabs.update(id, {active: true})
  if (isBrowserFocused()) {
    await browser.windows.update(windowId, {focused: true})
  }
  isTabActivationInProcess = false
}

function handleConnection(port: Runtime.Port) {
  if (Port.POPUP_SCRIPT === port.name) {
    port.onDisconnect.addListener(closeSwitcherInActiveTab)
  }
}

async function closeSwitcherInActiveTab() {
  const currentTab = await getActiveTab()
  if (currentTab) {
    await browser.tabs.sendMessage(checkTab(currentTab).id, closePopup())
  }
}

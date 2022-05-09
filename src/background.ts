import browser, {Runtime, Tabs} from 'webextension-polyfill'
import TabRegistry from './utils/tab-registry'
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
import {TabRegistryFactory} from './utils/tab-registry-factory'
import {log} from './utils/logger'

import Tab = Tabs.Tab

let settings: ISettings
let registry: TabRegistry
let isTabActivationInProcess = false

async function getOpenTabs(): Promise<ITab[]> {
  const windows = await browser.windows.getAll({populate: true})
  return windows.flatMap((w) => w.tabs || []).map(checkTab)
}

async function getSavedTabs(): Promise<ITab[]> {
  const {tabs} = await browser.storage.local.get('tabs')
  return tabs || []
}

function saveTabs(tabs: ITab[]): void {
  browser.storage.local.set({tabs})
}

Promise.all([getSettings(browser.storage.local), getOpenTabs(), getSavedTabs()])
  .then(([newSettings, openTabs, savedTabs]) => {
    log(`[ settings initialized]`, newSettings)
    settings = newSettings
    return TabRegistryFactory.create({
      numberOfTabsToShow: settings.numberOfTabsToShow,
      openTabs,
      savedTabs,
      onTabsUpdate: saveTabs,
    })
  })
  .then((newRegistry) => {
    registry = newRegistry
    log(`[ registry initialized]`, registry.titles())
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

async function initForE2ETests(handlers: Partial<IHandlers>) {
  const isAllowedUrl = (url: string) => url !== 'about:blank' && !url.startsWith('chrome')
  async function executeContentScript(tab: ITab) {
    if (isAllowedUrl(tab.url)) {
      await browser.scripting.executeScript({
        target: {tabId: tab.id, allFrames: true},
        files: ['e2e-content-script.js'],
      })
    }
  }
  browser.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    await executeContentScript(checkTab(tab))
  })
  const active = await getActiveTab()
  if (active) {
    await executeContentScript(checkTab(active))
  }

  // eslint-disable-next-line no-param-reassign
  handlers[Message.COMMAND] = async ({command}) => {
    log(`[Command received]`, command)
    await handleCommand(command)
  }
  // eslint-disable-next-line no-param-reassign
  handlers[Message.E2E_SET_ZOOM] = ({zoomFactor}) => {
    browser.tabs.setZoom(zoomFactor)
  }
  // eslint-disable-next-line no-param-reassign
  handlers[Message.E2E_RELOAD_EXTENSION] = async () => {
    await browser.runtime.reload()
  }
}

async function handleCommand(command: string) {
  const activeTab = await getActiveTab()
  if (!activeTab) {
    return
  }
  log(`[handleCommand]`, activeTab.id, activeTab.title)
  const active = checkTab(activeTab)
  if (isCodeExecutionForbidden(active)) {
    // If the content script can't be initialized then switch to the previous tab.
    // TODO: Create popup window on the center of a screen and show PTS in it.
    const previousTab = registry.getPreviouslyActive()
    if (previousTab) {
      await activateTab(previousTab)
    }
    return
  }
  await initializeContentScript(active)
  // send the command to the content script
  await browser.tabs.sendMessage(active.id, selectTab(command === Command.NEXT ? 1 : -1))
}

async function handleWindowActivation(windowId: number) {
  log(`[handleWindowActivation]`, windowId)
  // Do not react on windows without ids.
  // This happens on each window activation in some Linux window managers.
  if (windowId === browser.windows.WINDOW_ID_NONE) {
    return
  }
  await handleTabActivation()
}

async function handleTabActivation(info?: Tabs.OnActivatedActiveInfoType) {
  if (isTabActivationInProcess) {
    log(
      `[handleTabActivation is skipped because previous tab activation is in process]`,
      info?.tabId,
      registry.titles()
    )
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
  log(`[handleTabActivation end]`, info?.tabId, active?.id, registry.titles())
}

function handleTabCreation(tab: Tab) {
  if (tab.active) {
    registry.push(checkTab(tab))
  } else {
    registry.pushUnderTop(checkTab(tab))
  }
  log(`[handleTabCreation end]`, tab.id, registry.titles())
}

function handleTabUpdate(tabId: number, changeInfo: Tabs.OnUpdatedChangeInfoType, tab: Tab) {
  if (changeInfo.status === 'complete') {
    log(`[handleTabUpdate tabId]`, tabId, tab.title)
    registry.removeFromInitialized(tabId)
    registry.update(checkTab(tab))
  }
}

async function handleTabRemove(tabId: number) {
  log(`[handleTabRemove start]`, tabId, registry.titles())
  registry.remove(tabId)
  const isSwitchingNeeded = settings.isSwitchingToPreviouslyUsedTab
  if (isSwitchingNeeded) {
    const currentTab = registry.getActive()
    if (currentTab) {
      log(`[handleTabRemove will activate tab]`, currentTab.id, currentTab.title)
      await activateTab(currentTab)
    }
  }
}

function messageHandlers(): Partial<IHandlers> {
  return {
    [Message.INITIALIZED]: (_m, sender) => {
      registry.addToInitialized(checkTab(sender.tab!))
    },
    [Message.SWITCH_TAB]: async ({selectedTab}) => {
      await activateTab(selectedTab)
    },
    [Message.UPDATE_SETTINGS]: async ({newSettings}) => {
      await settings.update(newSettings)
      registry.setNumberOfTabsToShow(newSettings.numberOfTabsToShow)
      const activeTab = await getActiveTab()
      if (!activeTab) {
        return
      }
      const active = checkTab(activeTab)
      if (isCodeExecutionForbidden(active)) {
        const previousNormalTab = registry.findBackward((tab) => !isCodeExecutionForbidden(tab))
        if (previousNormalTab) {
          await activateTab(previousNormalTab)
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
      registry.tabInitialized = (initedTab) => {
        log(`[tabInitialized]`, initedTab)
        resolve()
      }
      browser.scripting
        .executeScript({
          target: {tabId: tab.id, allFrames: false},
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
  try {
    // The tab can already be removed from the browser, for example when a user quickly closes multiple tabs.
    // To handle this situation without an error we can use debounce technique.
    await browser.tabs.update(id, {active: true})
    if (isBrowserFocused()) {
      await browser.windows.update(windowId, {focused: true})
    }
  } catch (e) {
    console.error(`Can not activate the tab id: ${id}, windowId: ${windowId}`, e)
  } finally {
    isTabActivationInProcess = false
  }
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

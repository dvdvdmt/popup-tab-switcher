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
import {log} from './utils/logger'
import {ServiceFactory} from './service-factory'

type ChromeTab = chrome.tabs.Tab
type IPort = chrome.runtime.Port

// NOTE: This is somehow related to the test "focuses previously active window on a tab closing".
// TODO: Describe the problem in more details.
let tabIdToBeActivated: undefined | number

initListeners()

function initListeners() {
  /** NOTE:
   *  The order of events on tab creation in a new window:
   *  1. Tab created
   *  2. Window activated (focus changed)
   *  3. Tab activated
   */
  chrome.tabs.onCreated.addListener(handleTabCreation)
  chrome.windows.onFocusChanged.addListener(handleWindowActivation)
  chrome.tabs.onActivated.addListener(handleTabActivation)
  chrome.tabs.onUpdated.addListener(handleTabUpdate)
  chrome.tabs.onRemoved.addListener(handleTabRemove)
  chrome.runtime.onConnect.addListener(handleConnection)
  chrome.commands.onCommand.addListener(handleCommand)
  const handlers = messageHandlers()
  chrome.runtime.onMessage.addListener(handleMessage(handlers))
  if (PRODUCTION) {
    initForProduction()
  }
  if (E2E) {
    initForE2ETests(handlers)
  }
}

function initForProduction() {
  chrome.runtime.setUninstallURL(uninstallURL)
}

async function initForE2ETests(handlers: Partial<IHandlers>) {
  const isAllowedUrl = (url: string) => url !== 'about:blank' && !url.startsWith('chrome')
  async function executeContentScript(tab: ITab) {
    if (isAllowedUrl(tab.url)) {
      await chrome.scripting.executeScript({
        target: {tabId: tab.id},
        files: ['e2e-content-script.js'],
      })
    }
  }
  chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    await executeContentScript(checkTab(tab))
  })
  const active = await getActiveTab()
  if (active) {
    await executeContentScript(checkTab(active))
  }

  Object.assign(handlers, {
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
  } as Partial<IHandlers>)
}

async function switchToPreviousTab() {
  const registry = await ServiceFactory.getTabRegistry()
  const previousTab = registry.getPreviouslyActive()
  if (previousTab) {
    await activateTab(previousTab as ChromeTab)
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
    // TODO: Create popup window in the center of a screen and show PTS in it.
    await switchToPreviousTab()
    return
  }
  if (await initializeContentScript(active)) {
    // This forced activation solves the problem with document.contentType === 'application/pdf'
    // when the document.hasFocus() returns false.
    await activateTab(activeTab as ChromeTab)
    // send the command to the content script
    await chrome.tabs.sendMessage(active.id, selectTab(command === Command.NEXT ? 1 : -1))
  } else {
    // Tab initialization may fail due to different reasons:
    // - the page is not loaded,
    // - the initialization timeout passed.
    // If this happens we are switching to the previous tab
    await switchToPreviousTab()
  }
}

async function handleWindowActivation(windowId: number) {
  log(`[handleWindowActivation start]`, windowId)
  // Do not react on windows without ids.
  // This happens on each window activation in some Linux window managers.
  if (windowId === chrome.windows.WINDOW_ID_NONE) {
    return
  }
  await handleTabActivation()
}

async function handleTabActivation(info?: chrome.tabs.TabActiveInfo) {
  const registry = await ServiceFactory.getTabRegistry()
  log(`[handleTabActivation info]`, info)
  const isNotTheTargetTab = tabIdToBeActivated && tabIdToBeActivated !== info?.tabId
  if (isNotTheTargetTab) {
    log(`[handleTabActivation is skipped because previous tab activation is in process]`)
    log(`[current registry]`, registry.titles())
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
  log(`[handleTabActivation end]`, active?.id)
  log(`[current registry]`, registry.titles())
}

async function handleTabCreation(tab: ChromeTab) {
  const registry = await ServiceFactory.getTabRegistry()
  if (tab.active) {
    registry.push(checkTab(tab))
  } else {
    registry.pushUnderTop(checkTab(tab))
  }
  log(`[handleTabCreation end]`, tab.id)
  log(`[current registry]`, registry.titles())
}

async function handleTabUpdate(
  tabId: number,
  changeInfo: chrome.tabs.TabChangeInfo,
  tab: ChromeTab
) {
  const registry = await ServiceFactory.getTabRegistry()
  if (changeInfo.status === 'complete') {
    log(`[handleTabUpdate tabId]`, tabId, tab.title)
    registry.removeFromInitialized(tabId)
    registry.update(checkTab(tab))
  }
}

async function handleTabRemove(tabId: number) {
  const registry = await ServiceFactory.getTabRegistry()
  log(`[handleTabRemove start]`, tabId)
  log(`[current registry]`, registry.titles())
  registry.remove(tabId)
  const settings = await ServiceFactory.getSettings()
  const isSwitchingNeeded = settings.isSwitchingToPreviouslyUsedTab
  if (isSwitchingNeeded) {
    const currentTab = registry.getActive()
    if (currentTab) {
      log(`[handleTabRemove will activate tab]`, currentTab.id, currentTab.title)
      await activateTab(currentTab as ChromeTab)
    }
  }
}

function messageHandlers(): Partial<IHandlers> {
  return {
    [Message.ContentScriptStarted]: async (_m, sender) => {
      log(`[ContentScriptStarted]`, sender.tab)
      const registry = await ServiceFactory.getTabRegistry()
      registry.addToInitialized(checkTab(sender.tab!))
    },
    [Message.ContentScriptStopped]: async (_m, sender) => {
      log(`[ContentScriptStopped]`, sender.tab)
      const registry = await ServiceFactory.getTabRegistry()
      registry.removeFromInitialized(sender.tab!.id!)
    },
    [Message.SWITCH_TAB]: async ({selectedTab}) => {
      await activateTab(selectedTab)
    },
    [Message.DEMO_SETTINGS]: async () => {
      const settings = await ServiceFactory.getSettings(true)
      const registry = await ServiceFactory.getTabRegistry()
      registry.setNumberOfTabsToShow(settings.numberOfTabsToShow)
      const activeTab = await getActiveTab()
      if (!activeTab) {
        return
      }
      const active = checkTab(activeTab)
      if (isCodeExecutionForbidden(active)) {
        const previousNormalTab = registry.findBackward((tab) => !isCodeExecutionForbidden(tab))
        if (previousNormalTab) {
          await activateTab(previousNormalTab as ChromeTab)
        }
        return
      }
      if (await initializeContentScript(active)) {
        await chrome.tabs.sendMessage(active.id, demoSettings())
      } else {
        // TODO: Show extension in a separate window
      }
    },
    [Message.GET_MODEL]: async () => {
      const settings = await ServiceFactory.getSettings()
      const registry = await ServiceFactory.getTabRegistry()
      return {
        tabs: registry.getTabsToShow() as chrome.tabs.Tab[],
        settings,
        zoomFactor: await chrome.tabs.getZoom(),
      }
    },
    [Message.SetSettings]: async ({settings}) => {
      log(`[Settings received]`, settings)
      const currentSettings = await ServiceFactory.getSettings()
      if (settings) {
        await currentSettings.update(settings)
      } else {
        await currentSettings.reset()
      }
    },
    [Message.GetSettings]: async () => {
      log(`[Settings requested]`)
      const currentSettings = await ServiceFactory.getSettings()
      return currentSettings.getSettingsObject()
    },
  }
}

async function initializeContentScript(tab: ITab): Promise<boolean> {
  const registry = await ServiceFactory.getTabRegistry()
  if (registry.isInitialized(tab)) {
    return true
  }
  const initialization = registry.tabInitializations.get(tab.id)
  if (initialization) {
    log('[tab initialisation is in progress]', tab)
    return initialization.promise
  }
  const newInitialization = registry.startInitialization(tab)
  return newInitialization.promise
}

async function getActiveTab(): Promise<ChromeTab | undefined> {
  const [activeTab] = await chrome.tabs.query({
    active: true,
    currentWindow: true,
  })
  return activeTab
}

async function activateTab({id, windowId}: ChromeTab) {
  log(`[tab activation is started]`, {id, windowId})
  tabIdToBeActivated = id
  try {
    // The tab can already be removed from the browser, for example when a user quickly closes multiple tabs.
    // To handle this situation without an error we can use debounce technique.
    // @ts-expect-error Todo: fix this
    await chrome.tabs.update(id, {active: true})
    if (isBrowserFocused()) {
      await chrome.windows.update(windowId, {focused: true})
    }
  } catch (e) {
    console.error(`Can not activate the tab id: ${id}, windowId: ${windowId}`, e)
  } finally {
    tabIdToBeActivated = undefined
    log(`[tab activation is finished]`, {id, windowId})
  }
}

function handleConnection(port: IPort) {
  if (Port.POPUP_SCRIPT === port.name) {
    port.onDisconnect.addListener(closeSwitcherInActiveTab)
  }
}

async function closeSwitcherInActiveTab() {
  const registry = await ServiceFactory.getTabRegistry()
  const currentTab = await getActiveTab()
  if (currentTab && registry.isInitialized(checkTab(currentTab))) {
    await chrome.tabs.sendMessage(checkTab(currentTab).id, closePopup())
  }
}

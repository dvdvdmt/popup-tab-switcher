import browser, {Runtime, Tabs} from 'webextension-polyfill'
import TabRegistry from './utils/tab-registry'
import Settings from './utils/settings'
import {Command, Port, uninstallURL} from './utils/constants'
import {
  applyNewSettings,
  closePopup,
  handleMessage,
  Message,
  selectTab,
  updateSettings,
  updateZoomFactor,
} from './utils/messages'
import isCodeExecutionForbidden from './utils/is-code-execution-forbidden'
import {isBrowserFocused} from './utils/is-browser-focused'
import {checkTab, ITab} from './utils/check-tab'

import Tab = Tabs.Tab

const settings = new Settings()
let registry: TabRegistry
initTabRegistry().then((newRegistry) => {
  registry = newRegistry
  initListeners()
})

async function initTabRegistry() {
  const windows = await browser.windows.getAll({populate: true})
  const tabs = windows
    .flatMap((w) => w.tabs || [])
    .map(checkTab)
    .sort(activeLast)
  return new TabRegistry({
    tabs,
    numberOfTabsToShow: settings.get('numberOfTabsToShow') as number,
  })

  function activeLast(a: Tab, b: Tab) {
    if (a.active < b.active) {
      return -1
    }
    if (a.active > b.active) {
      return 1
    }
    return 0
  }
}

function initListeners() {
  browser.commands.onCommand.addListener(handleCommand)
  browser.windows.onFocusChanged.addListener(handleWindowActivation)
  browser.tabs.onActivated.addListener(handleTabActivation)
  browser.tabs.onCreated.addListener(handleTabCreation)
  browser.tabs.onUpdated.addListener(handleTabUpdate)
  browser.tabs.onRemoved.addListener(handleTabRemove)
  browser.tabs.onZoomChange.addListener(handleZoomChange)
  browser.runtime.onConnect.addListener(handleConnection)
  browser.runtime.onMessage.addListener(createMessageHandler())
  if (PRODUCTION) {
    initForProduction()
  }
  if (E2E) {
    initForE2ETests()
  }
}

function initForProduction() {
  browser.runtime.setUninstallURL(uninstallURL)
}

function initForE2ETests() {
  const isAllowedUrl = (url: string) => url !== 'about:blank' && !url.startsWith('chrome:')
  browser.runtime.onConnect.addListener((port) => {
    if (port.name === Port.COMMANDS_BRIDGE) {
      port.onMessage.addListener(
        handleMessage({
          [Message.COMMAND]: async ({command}) => {
            await handleCommand(command)
          },
          [Message.E2E_SET_ZOOM]: ({zoomFactor}) => {
            browser.tabs.setZoom(zoomFactor)
          },
        })
      )
    }
  })
  browser.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    const checkedTab = checkTab(tab)
    if (isAllowedUrl(checkedTab.url)) {
      await browser.tabs.executeScript(tabId, {
        file: 'e2e-test-commands-bridge.js',
        allFrames: true,
      })
    }
  })
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
  browser.tabs.sendMessage(
    active.id,
    selectTab(
      registry.getTabsToShow(),
      command === Command.NEXT ? 1 : -1,
      await browser.tabs.getZoom()
    )
  )
}

async function handleWindowActivation(windowId: number) {
  // Do not react on windows without ids.
  // This happens on each window activation in some Linux window managers.
  if (windowId === browser.windows.WINDOW_ID_NONE) {
    return
  }
  handleTabActivation()
}

async function handleTabActivation() {
  const currentTab = await getActiveTab()
  // the tab can be instantly closed and therefore currentTab can be null
  if (currentTab) {
    registry.push(checkTab(currentTab))
  }
}

function handleTabCreation(tab: Tab) {
  if (!tab.active) {
    registry.pushUnderTop(checkTab(tab))
  }
}

async function handleTabUpdate(tabId: number, changeInfo: Tabs.OnUpdatedChangeInfoType, tab: Tab) {
  if (changeInfo.status === 'complete') {
    registry.removeFromInitialized(tabId)
    registry.update(checkTab(tab))
  }
}

async function handleTabRemove(tabId: number) {
  registry.remove(tabId)
  const isSwitchingNeeded = settings.get('isSwitchingToPreviouslyUsedTab')
  if (isSwitchingNeeded) {
    const currentTab = registry.getActive()
    if (currentTab) {
      await activateTab(currentTab)
    }
  }
}

function handleZoomChange({tabId, newZoomFactor}: Tabs.OnZoomChangeZoomChangeInfoType) {
  if (registry.isInitialized(tabId)) {
    browser.tabs.sendMessage(tabId, updateZoomFactor(newZoomFactor))
  }
}

function createMessageHandler() {
  // FIXME:
  //  Double clicks on settings icon sometimes results in hidden switcher.
  //  This happens because switcher reacts on window blur event.
  //  When settings are open window blur handler should be disabled.
  return handleMessage({
    [Message.INITIALIZED]: (_m, sender) => {
      const tab = checkTab(sender.tab!)
      browser.tabs.sendMessage(tab.id, updateSettings(settings.getObject()))
      registry.addToInitialized(tab)
    },
    [Message.SWITCH_TAB]: ({selectedTab}) => {
      activateTab(selectedTab)
    },
    [Message.UPDATE_SETTINGS]: async ({newSettings}) => {
      settings.update(newSettings)
      registry.setNumberOfTabsToShow(newSettings.numberOfTabsToShow)
      await Promise.all(
        registry
          .getInitializedTabsIds()
          .map((id) => browser.tabs.sendMessage(id, updateSettings(newSettings)))
      )
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
      await browser.tabs.sendMessage(
        active.id,
        applyNewSettings(newSettings, registry.getTabsToShow())
      )
    },
  })
}

async function initializeContentScript(tab: ITab): Promise<void> {
  if (!registry.isInitialized(tab.id)) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        reject(new Error('Initialization took too much time'))
      }, 100)
      registry.tabInitialized = resolve
      browser.tabs.executeScript(tab.id, {file: 'content.js'})
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

function activateTab({id, windowId}: ITab) {
  browser.tabs.update(id, {active: true})
  if (isBrowserFocused()) {
    browser.windows.update(windowId, {focused: true})
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

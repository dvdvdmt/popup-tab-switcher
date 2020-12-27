import {browser, Runtime, Tabs} from 'webextension-polyfill-ts';
import TabRegistry from './utils/tab-registry';
import Settings from './utils/settings';
import {Command, Port, uninstallURL} from './utils/constants';
import {
  applyNewSettings,
  applyNewSettingsSilently,
  closePopup,
  handleMessage,
  Message,
  selectTab,
} from './utils/messages';
import isCodeExecutionForbidden from './utils/is-code-execution-forbidden';
import {isBrowserFocused} from './utils/is-browser-focused';

import Tab = Tabs.Tab;
import OnUpdatedChangeInfoType = Tabs.OnUpdatedChangeInfoType;

const settings = new Settings();
let registry: TabRegistry;
initTabRegistry().then((newRegistry) => {
  registry = newRegistry;
  initListeners();
});

async function initTabRegistry() {
  const windows = await browser.windows.getAll({populate: true});
  const tabs = windows.flatMap((w) => w.tabs).sort(activeLast);
  return new TabRegistry({
    tabs,
    numberOfTabsToShow: settings.get('numberOfTabsToShow') as number,
  });

  function activeLast(a: Tab, b: Tab) {
    return a.active < b.active ? -1 : 1;
  }
}

function initListeners() {
  browser.commands.onCommand.addListener(handleCommand);
  browser.tabs.onActivated.addListener(handleTabActivation);
  browser.windows.onFocusChanged.addListener(handleWindowActivation);
  browser.tabs.onCreated.addListener(handleTabCreation);
  browser.tabs.onUpdated.addListener(handleTabUpdate);
  browser.tabs.onRemoved.addListener(handleTabRemove);
  browser.runtime.onConnect.addListener(handleCommunications);
  if (PRODUCTION) {
    initForProduction();
  }
  if (E2E) {
    initForE2ETests();
  }
}

function initForProduction() {
  browser.runtime.setUninstallURL(uninstallURL);
}

function initForE2ETests() {
  const isAllowedUrl = (url: string) => url !== 'about:blank' && !url.startsWith('chrome:');
  browser.runtime.onConnect.addListener((port) => {
    if (port.name === Port.COMMANDS_BRIDGE) {
      port.onMessage.addListener(
        handleMessage({
          [Message.COMMAND]: async ({command}) => {
            await handleCommand(command);
          },
        })
      );
    }
  });
  browser.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && isAllowedUrl(tab.url)) {
      await browser.tabs.executeScript(tabId, {
        file: 'e2e-test-commands-bridge.js',
        allFrames: true,
      });
    }
  });
}

async function handleCommand(command: Command) {
  const currentTab = await getActiveTab();
  if (!currentTab) {
    return;
  }
  if (isCodeExecutionForbidden(currentTab)) {
    // If the content script can't be initialized then switch to the previous tab.
    // TODO: Create popup window on the center of a screen and show PTS in it.
    const previousTab = registry.getPreviouslyActive();
    if (previousTab) {
      activateTab(previousTab);
    }
    return;
  }
  await initializeContentScript(currentTab);
  // send the command to the content script
  await browser.tabs.sendMessage(
    currentTab.id,
    selectTab(
      registry.getTabsToShow(),
      command === Command.NEXT ? 1 : -1,
      await browser.tabs.getZoom()
    )
  );
}

async function handleWindowActivation(windowId: number) {
  // Do not react on windows without ids.
  // This happens on each window activation in some Linux window managers.
  if (windowId === browser.windows.WINDOW_ID_NONE) {
    return;
  }
  handleTabActivation();
}

async function handleTabActivation() {
  const currentTab = await getActiveTab();
  // the tab can be instantly closed and therefore currentTab can be null
  if (currentTab) {
    registry.push(currentTab);
  }
}

function handleTabCreation(tab: Tab) {
  if (!tab.active) {
    registry.pushUnderTop(tab);
  }
}

async function handleTabUpdate(tabId: number, changeInfo: OnUpdatedChangeInfoType, tab: Tab) {
  if (changeInfo.status === 'complete') {
    registry.removeFromInitialized(tabId);
    registry.update(tab);
  }
}

async function handleTabRemove(tabId: number) {
  registry.remove(tabId);
  const isSwitchingNeeded = settings.get('isSwitchingToPreviouslyUsedTab');
  if (isSwitchingNeeded) {
    const currentTab = registry.getActive();
    if (currentTab) {
      await activateTab(currentTab);
    }
  }
}

function handleCommunications(port: Runtime.Port) {
  if (Port.CONTENT_SCRIPT === port.name) {
    port.onMessage.addListener(handleContentScriptMessages());
  } else if (Port.POPUP_SCRIPT === port.name) {
    // TODO: On settings opening select a tab where content script can be executed and show popup in it.
    //  Remove initial updateSettings() execution from settings.vue.
    //  This will probably prevent a bug when extension icon is clicked twice which results in opened popup but closed settings.
    port.onMessage.addListener(
      handleMessage({
        [Message.UPDATE_SETTINGS]: async ({newSettings}) => {
          settings.update(newSettings);
          registry.setNumberOfTabsToShow(newSettings.numberOfTabsToShow);
          await Promise.all(
            registry
              .getInitializedTabsIds()
              .map((id) => browser.tabs.sendMessage(id, applyNewSettingsSilently(newSettings)))
          );
          const activeTab = await getActiveTab();
          if (!activeTab) {
            return;
          }
          if (isCodeExecutionForbidden(activeTab)) {
            const previousNormalTab = registry.findBackward(
              (tab: Tab) => !isCodeExecutionForbidden(tab)
            );
            if (previousNormalTab) {
              activateTab(previousNormalTab);
            }
            return;
          }
          await initializeContentScript(activeTab);
          // send a command to the content script
          await browser.tabs.sendMessage(
            activeTab.id,
            applyNewSettings(newSettings, registry.getTabsToShow())
          );
        },
      })
    );
    // notify a tab when the settings popup closes
    port.onDisconnect.addListener(handlePopupScriptDisconnection);
  }
}

async function initializeContentScript(tab: Tab) {
  if (!registry.isInitialized(tab)) {
    const settingsString = settings.getString();
    await browser.tabs.executeScript(tab.id, {
      code: `window.settings = ${settingsString};`,
    });
    await browser.tabs.executeScript(tab.id, {file: 'content.js'});
    registry.addToInitialized(tab);
  }
}

async function getActiveTab() {
  const [activeTab] = await browser.tabs.query({
    active: true,
    currentWindow: true,
  });
  return activeTab;
}

function activateTab({id, windowId}: Tab) {
  browser.tabs.update(id, {active: true});
  if (isBrowserFocused()) {
    browser.windows.update(windowId, {focused: true});
  }
}

async function handlePopupScriptDisconnection() {
  const currentTab = await getActiveTab();
  await browser.tabs.sendMessage(currentTab.id, closePopup());
}

function handleContentScriptMessages() {
  return handleMessage({
    [Message.SWITCH_TAB]: ({selectedTab}) => {
      activateTab(selectedTab);
    },
  });
}

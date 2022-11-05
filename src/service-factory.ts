import browser from 'webextension-polyfill'
import {getSettings, ISettings} from './utils/settings'
import TabRegistry from './utils/tab-registry'
import {checkTab, ITab} from './utils/check-tab'
import {TabRegistryFactory} from './utils/tab-registry-factory'
import {log} from './utils/logger'

export class ServiceFactory {
  private static settingsCache: ISettings | undefined

  private static registryCache: TabRegistry | undefined

  static async getSettings(reload = false): Promise<ISettings> {
    if (!reload && ServiceFactory.settingsCache) {
      return ServiceFactory.settingsCache
    }
    const settings = await getSettings(browser.storage.local)
    ServiceFactory.settingsCache = settings
    log(`[Settings initialized]`, settings)
    return settings
  }

  static async getTabRegistry(): Promise<TabRegistry> {
    if (ServiceFactory.registryCache) {
      return ServiceFactory.registryCache
    }
    const [settings, openTabs, savedTabs] = await Promise.all([
      ServiceFactory.getSettings(),
      getOpenTabs(),
      getSavedTabs(),
    ])
    const registry = TabRegistryFactory.create({
      numberOfTabsToShow: settings.numberOfTabsToShow,
      openTabs,
      savedTabs,
      onTabsUpdate: saveTabs,
    })
    ServiceFactory.registryCache = registry
    log(`[Registry initialized]`, {openTabs, savedTabs, registryTitles: registry.titles()})
    return registry
  }
}

async function getSavedTabs(): Promise<ITab[]> {
  const {tabs} = await browser.storage.local.get('tabs')
  return tabs || []
}

function saveTabs(tabs: ITab[]): void {
  browser.storage.local.set({tabs})
}

async function getOpenTabs(): Promise<ITab[]> {
  const windows = await browser.windows.getAll({populate: true})
  return windows.flatMap((w) => w.tabs || []).map(checkTab)
}

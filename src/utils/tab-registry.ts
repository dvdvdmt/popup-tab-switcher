import {ITab} from './check-tab'

interface TabRegistryOptions {
  tabs?: ITab[]
  numberOfTabsToShow?: number
}

interface InitializedTabs {
  [key: number]: ITab
}

export default class TabRegistry {
  private tabs: ITab[]

  private numberOfTabsToShow: number

  private initializedTabs: InitializedTabs = {}

  constructor({tabs = [], numberOfTabsToShow = 7}: TabRegistryOptions = {}) {
    this.tabs = tabs
    this.numberOfTabsToShow = numberOfTabsToShow
  }

  setNumberOfTabsToShow(n: number) {
    this.numberOfTabsToShow = n
  }

  removeTab(tabId: number) {
    this.tabs = this.tabs.filter(({id}) => id !== tabId)
  }

  addToInitialized(tab: ITab) {
    this.initializedTabs[tab.id] = tab
  }

  removeFromInitialized(tabId: number) {
    delete this.initializedTabs[tabId]
  }

  isInitialized(tabId: number) {
    return this.initializedTabs[tabId]
  }

  push(current: ITab) {
    this.removeTab(current.id)
    this.tabs.push(current)
  }

  remove(tabId: number) {
    this.removeTab(tabId)
    this.removeFromInitialized(tabId)
  }

  update(tabToUpdate: ITab) {
    this.tabs = this.tabs.map((t) => {
      if (t.id === tabToUpdate.id) {
        return tabToUpdate
      }
      return t
    })
  }

  getTabs() {
    return this.tabs.slice()
  }

  getInitializedTabsIds() {
    return Object.values(this.initializedTabs).map(({id}) => id)
  }

  getTabsToShow(): ITab[] {
    return this.tabs.slice(-this.numberOfTabsToShow).reverse()
  }

  getActive() {
    return this.tabs[this.tabs.length - 1]
  }

  getPreviouslyActive() {
    return this.tabs[this.tabs.length - 2]
  }

  findBackward(findFn: (t: ITab) => boolean) {
    for (let i = this.tabs.length - 1; i >= 0; i -= 1) {
      if (findFn(this.tabs[i])) {
        return this.tabs[i]
      }
    }
    return undefined
  }

  pushUnderTop(tab: ITab) {
    if (this.tabs.length) {
      const top = this.getActive()
      this.tabs.push(top)
      this.tabs[this.tabs.length - 2] = tab
    } else {
      this.tabs.push(tab)
    }
  }
}

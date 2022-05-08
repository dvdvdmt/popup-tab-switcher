import {ITab} from './check-tab'

interface ITabRegistryOptions {
  tabs: ITab[]
  numberOfTabsToShow: number
  onUpdate: (tabs: ITab[]) => void
}

interface IInitializedTabs {
  [key: number]: ITab
}

export default class TabRegistry {
  private tabs: ITab[]

  private numberOfTabsToShow: number

  private initializedTabs: IInitializedTabs

  private onUpdate: (tabs: ITab[]) => void

  constructor({
    tabs = [],
    numberOfTabsToShow = 7,
    onUpdate = () => {},
  }: Partial<ITabRegistryOptions> = {}) {
    this.initializedTabs = {}
    this.tabs = tabs
    this.numberOfTabsToShow = numberOfTabsToShow
    this.onUpdate = onUpdate
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  tabInitialized: (tab: ITab) => void = () => {}

  setNumberOfTabsToShow(n: number) {
    this.numberOfTabsToShow = n
  }

  addToInitialized(tab: ITab) {
    this.initializedTabs[tab.id] = tab
    this.tabInitialized(tab)
  }

  removeFromInitialized(tabId: number) {
    delete this.initializedTabs[tabId]
  }

  isInitialized(tabId: number) {
    return this.initializedTabs[tabId]
  }

  push(current: ITab) {
    this.tabs = this.removeTab(current.id)
    this.tabs.push(current)
    this.onUpdate(this.tabs)
  }

  remove(tabId: number) {
    this.tabs = this.removeTab(tabId)
    this.removeFromInitialized(tabId)
    this.onUpdate(this.tabs)
  }

  update(tabToUpdate: ITab) {
    this.tabs = this.tabs.map((t) => {
      if (t.id === tabToUpdate.id) {
        return tabToUpdate
      }
      return t
    })
    this.onUpdate(this.tabs)
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

  getActive(): ITab | undefined {
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
    const top = this.getActive()
    if (top) {
      this.tabs.push(top)
      this.tabs[this.tabs.length - 2] = tab
    } else {
      this.tabs.push(tab)
    }
    this.onUpdate(this.tabs)
  }

  /**
   * [0,1,2,3,4] -(active 2)-> [0,1,3,4,2]
   * */
  setActive(tabId: number) {
    this.tabs.sort((_a, b) => (b.id === tabId ? -1 : 0))
    this.onUpdate(this.tabs)
  }

  titles() {
    return this.tabs.map((tab) => `#${tab.id} ${tab.title}`).join(', ')
  }

  private removeTab(tabId: number): ITab[] {
    return this.tabs.filter(({id}) => id !== tabId)
  }
}

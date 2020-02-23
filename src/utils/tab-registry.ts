import {Tabs} from 'webextension-polyfill-ts';

import Tab = Tabs.Tab;

interface TabRegistryOptions {
  tabs?: Tab[];
  numberOfTabsToShow?: number;
}

interface InitializedTabs {
  [key: number]: Tab;
}

export default class TabRegistry {
  private tabs: Tab[];

  private numberOfTabsToShow: number;

  private initializedTabs: InitializedTabs = {};

  constructor({tabs = [], numberOfTabsToShow = 7}: TabRegistryOptions = {}) {
    this.tabs = tabs;
    this.numberOfTabsToShow = numberOfTabsToShow;
  }

  setNumberOfTabsToShow(n: number) {
    this.numberOfTabsToShow = n;
  }

  removeTab(tabId: number) {
    this.tabs = this.tabs.filter(({id}) => id !== tabId);
  }

  addToInitialized(tab: Tab) {
    this.initializedTabs[tab.id] = tab;
  }

  removeFromInitialized(tabId: number) {
    delete this.initializedTabs[tabId];
  }

  isInitialized(tab: Tab) {
    return this.initializedTabs[tab.id];
  }

  push(current: Tab) {
    this.removeTab(current.id);
    this.tabs.push(current);
  }

  remove(tabId: number) {
    this.removeTab(tabId);
    this.removeFromInitialized(tabId);
  }

  update(tabToUpdate: Tab) {
    this.tabs = this.tabs.map((t) => {
      if (t.id === tabToUpdate.id) {
        return tabToUpdate;
      }
      return t;
    });
  }

  getTabs() {
    return this.tabs.slice();
  }

  getInitializedTabsIds() {
    return Object.values(this.initializedTabs).map(({id}) => id);
  }

  getTabsToShow() {
    return this.tabs.slice(-this.numberOfTabsToShow).reverse();
  }

  getActive() {
    return this.tabs[this.tabs.length - 1];
  }

  getPreviouslyActive() {
    return this.tabs[this.tabs.length - 2];
  }

  findBackward(findFn: (t: Tab) => boolean) {
    for (let i = this.tabs.length - 1; i >= 0; i -= 1) {
      if (findFn(this.tabs[i])) {
        return this.tabs[i];
      }
    }
    return undefined;
  }

  pushUnderTop(tab: Tab) {
    if (this.tabs.length) {
      const top = this.getActive();
      this.tabs.push(top);
      this.tabs[this.tabs.length - 2] = tab;
    } else {
      this.tabs.push(tab);
    }
  }
}

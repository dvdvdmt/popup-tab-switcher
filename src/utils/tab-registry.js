export default class TabRegistry {
  constructor({tabs = [], numberOfTabsToShow = 7} = {}) {
    this.tabs = tabs;
    this.numberOfTabsToShow = numberOfTabsToShow;
    this.initializedTabs = {};
  }

  removeTab(tabId) {
    this.tabs = this.tabs.filter(({id}) => id !== tabId);
  }

  addToInitialized(tab) {
    this.initializedTabs[tab.id] = tab;
  }

  removeFromInitialized(tabId) {
    delete this.initializedTabs[tabId];
  }

  isInitialized(tab) {
    return this.initializedTabs[tab.id];
  }

  push(current) {
    this.removeTab(current.id);
    this.tabs.push(current);
  }

  remove(tabId) {
    this.removeTab(tabId);
    this.removeFromInitialized(tabId);
  }

  update(tabToUpdate) {
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

  getTabsToShow() {
    return this.tabs.slice(-this.numberOfTabsToShow)
      .reverse();
  }

  getActive() {
    return this.tabs[this.tabs.length - 1];
  }

  getPreviouslyActive() {
    return this.tabs[this.tabs.length - 2];
  }

  findBackward(findFn) {
    for (let i = this.tabs.length - 1; i >= 0; i -= 1) {
      if (findFn(this.tabs[i])) {
        return this.tabs[i];
      }
    }
    return undefined;
  }
}

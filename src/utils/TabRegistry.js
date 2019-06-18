export default class TabRegistry {
  constructor({ tabs = [], maxNumberOfTabs = 7 } = {}) {
    this.tabs = tabs;
    this.maxNumberOfTabs = maxNumberOfTabs;
    this.initializedTabs = {};
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
    const tempTabs = this.tabs.filter(({ id }) => id !== current.id);
    tempTabs.unshift(current);
    this.tabs = tempTabs.slice(0, this.maxNumberOfTabs - 1);
  }

  remove(tabId) {
    this.tabs = this.tabs.filter(({ id }) => id !== tabId);
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
}

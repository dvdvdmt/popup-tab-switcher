let tabs = [];
const maxTabsNumber = 7;
const initializedTabs = {};

export function addToInitialized(tab) {
  initializedTabs[tab.id] = tab;
}

export function removeFromInitialized(tabId) {
  delete initializedTabs[tabId];
}

export function push(current) {
  tabs = tabs.filter(({ id }) => id !== current.id);
  tabs.unshift(current);
  tabs = tabs.slice(0, maxTabsNumber - 1);
}

export function remove(tabId) {
  tabs = tabs.filter(({ id }) => id !== tabId);
  removeFromInitialized(tabId);
}

export function update(tabToUpdate) {
  tabs = tabs.map((t) => {
    if (t.id === tabToUpdate.id) {
      return tabToUpdate;
    }
    return t;
  });
}

export function init(initialTabs = []) {
  tabs = initialTabs;
}

export function getTabs() {
  return tabs.slice();
}

export function getTabsData() {
  return tabs
    .map(({
      id, url, title, favIconUrl,
    }) => ({
      id,
      url,
      title,
      favIconUrl,
    }));
}

export function isInitialized(tab) {
  return initializedTabs[tab.id];
}

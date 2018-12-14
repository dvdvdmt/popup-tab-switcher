let tabs = [];
const maxTabsNumber = 7;
const initializedTabs = {};

export function push(current) {
  tabs = tabs.filter(({ id }) => id !== current.id);
  tabs.unshift(current);
  tabs = tabs.slice(0, maxTabsNumber - 1);
}

export function getTabs() {
  return tabs.slice();
}

export function getTabsData() {
  return tabs
    .map(({ url, title, favIconUrl }) => ({
      url,
      title,
      favIconUrl,
    }));
}

export function isInitialized(tab) {
  return initializedTabs[tab.id];
}

export function markAsInitialized(tab) {
  initializedTabs[tab.id] = tab;
}

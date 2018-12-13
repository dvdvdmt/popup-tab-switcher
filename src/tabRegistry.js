let tabsRegistry = [];
const maxTabsNumber = 7;
const initializedTabs = {};

export function push(current) {
  tabsRegistry = tabsRegistry.filter(({ id }) => id !== current.id);
  tabsRegistry.unshift(current);
  tabsRegistry = tabsRegistry.slice(0, maxTabsNumber - 1);
}

export function getTabsData(tabs = tabsRegistry) {
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

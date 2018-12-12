const tabsRegistry = [];
const maxTabsNumber = 10;
const initializedTabs = {};

export function pushToRegistry(current) {
  tabsRegistry.unshift(current);
  return tabsRegistry
    .filter(({ id }, i) => (i > 0 && id !== current.id) || i < maxTabsNumber);
}

export function getForRender(tabs = tabsRegistry) {
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

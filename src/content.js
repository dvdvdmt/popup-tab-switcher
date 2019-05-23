/* eslint-disable no-undef */
import browser from 'webextension-polyfill';
import styles from './content.css';
import tabCornerSymbol from './images/tab-corner.svg';

const settings = {
  autoSwitchingTimeout: 1000,
  sizes: {
    popupWidth: 420,
    popupHeight: 448,
    popupBorderRadius: 8,
    tabHeight: 40,
    font: 16,
    icon: 24,
  },
};
const { sizes } = settings;
const overlay = document.createElement('div');
overlay.style.display = 'none';
overlay.className = styles.overlay;

const card = document.createElement('div');
card.className = styles.card;

overlay.append(card);
document.body.append(overlay);

function hideOverlay() {
  overlay.style.display = 'none';
}

function showOverlay() {
  overlay.style.setProperty('--popup-width-factor', sizes.popupWidth / window.outerWidth);
  overlay.style.setProperty('--popup-height-factor', sizes.popupHeight / window.outerWidth);
  overlay.style.setProperty('--popup-border-radius-factor', sizes.popupBorderRadius / window.outerWidth);
  overlay.style.setProperty('--tab-height-factor', sizes.tabHeight / window.outerWidth);
  overlay.style.setProperty('--font-size-factor', sizes.font / window.outerWidth);
  overlay.style.setProperty('--icon-size-factor', sizes.icon / window.outerWidth);
  overlay.style.setProperty('--size-window-width', window.outerWidth);
  overlay.style.setProperty('--time-auto-switch-timeout', `${settings.autoSwitchingTimeout}ms`);
  overlay.style.display = 'flex';
}

function createSVGIcon(symbol, className) {
  const cornerEl = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  cornerEl.setAttribute('viewBox', symbol.viewBox);
  cornerEl.classList.add(...className.split(' '));
  const cornerUseEl = document.createElementNS('http://www.w3.org/2000/svg', 'use');
  cornerUseEl.setAttribute('href', `#${symbol.id}`);
  cornerEl.append(cornerUseEl);
  return cornerEl;
}

function getTabElements(tabs, selectedId) {
  return tabs.map(({ title, favIconDataUrl }, i) => {
    const tabEl = document.createElement('div');
    tabEl.className = styles.tab;
    if (i === selectedId) {
      tabEl.classList.add(styles.tab_selected);
      if (!document.hasFocus()) {
        const indicator = document.createElement('div');
        indicator.className = styles.tabTimeoutIndicator;
        tabEl.append(indicator);
        tabEl.classList.add(styles.tab_timeout);
      }
    }
    const iconEl = document.createElement('img');
    iconEl.src = favIconDataUrl;
    iconEl.className = styles.tabIcon;
    tabEl.append(iconEl);
    const textEl = document.createElement('span');
    textEl.textContent = title;
    textEl.className = styles.tabText;
    tabEl.append(createSVGIcon(tabCornerSymbol, styles.tabCornerIcon_top));
    tabEl.append(createSVGIcon(tabCornerSymbol, styles.tabCornerIcon_bottom));
    tabEl.append(textEl);
    return tabEl;
  });
}

function renderTabs(tabs, selectedId) {
  card.innerHTML = '';
  const tabElements = getTabElements(tabs, selectedId);
  for (const tabElement of tabElements) {
    card.append(tabElement);
  }
  showOverlay();
}

let selectedTabIndex = 0;
let tabsArray;
let timeout;

/**
 * Restricts result of a number increment between [0, maxInteger - 1]
 */
function rangedIncrement(number, increment, maxInteger) {
  return (number + (increment % maxInteger) + maxInteger) % maxInteger;
}

function selectNextTab() {
  selectedTabIndex = rangedIncrement(selectedTabIndex, +1, tabsArray.length);
  renderTabs(tabsArray, selectedTabIndex);
}

function selectPreviousTab() {
  selectedTabIndex = rangedIncrement(selectedTabIndex, -1, tabsArray.length);
  renderTabs(tabsArray, selectedTabIndex);
}

const port = browser.runtime.connect({ name: 'content script' });

function switchToSelectedTab() {
  hideOverlay();
  port.postMessage({
    command: 'switch tab',
    selectedTab: tabsArray[selectedTabIndex],
  });
  selectedTabIndex = 0;
}

browser.runtime.onMessage.addListener(({ type, tabsData }) => {
  tabsArray = tabsData;
  if (type === 'next') {
    selectNextTab();
  } else if (type === 'previous') {
    selectPreviousTab();
  }
  // When the focus is on the address bar or the 'search in the page' field
  // then the extension should switch a tab at the end of a timer.
  // Because there is no way to handle key pressings when a page has no focus.
  // https://stackoverflow.com/a/20940788/3167855
  if (!document.hasFocus()) {
    clearTimeout(timeout);
    timeout = setTimeout(switchToSelectedTab, settings.autoSwitchingTimeout);
  }
});

overlay.addEventListener('click', hideOverlay);

document.addEventListener('keyup', ({ key }) => {
  if (key === 'Alt') {
    switchToSelectedTab();
  }
});

/* eslint-disable no-undef */
import browser from 'webextension-polyfill';
import styles from './content.css';

const sizes = {
  popupWidth: 300,
  popupHeight: 300,
  font: 16,
  icon: 18,
};
const overlay = document.createElement('div');
overlay.style.display = 'none';
overlay.className = styles.overlay;

const card = document.createElement('pre');
card.className = styles.card;

overlay.append(card);
document.body.append(overlay);

function hideOverlay() {
  overlay.style.display = 'none';
}

function showOverlay() {
  overlay.style.setProperty('--popup-width-factor', sizes.popupWidth / window.outerWidth);
  overlay.style.setProperty('--popup-height-factor', sizes.popupHeight / window.outerHeight);
  overlay.style.setProperty('--font-size-factor', sizes.font / window.outerHeight);
  overlay.style.setProperty('--icon-size-factor', sizes.icon / window.outerHeight);
  overlay.style.display = 'flex';
}

function getTabElements(tabs, selectedId) {
  return tabs.map(({ title, favIconUrl }, i) => {
    const tabEl = document.createElement('div');
    tabEl.className = styles.tab;
    if (i === selectedId) {
      tabEl.classList.add(styles.tab_selected);
    }
    const iconEl = document.createElement('img');
    iconEl.src = favIconUrl;
    iconEl.className = styles.tabIcon;
    tabEl.append(iconEl);
    const textEl = document.createElement('span');
    textEl.textContent = title;
    textEl.className = styles.tabText;
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

browser.runtime.onMessage.addListener(({ type, tabsData }) => {
  tabsArray = tabsData;
  if (type === 'next') {
    selectNextTab();
  } else if (type === 'previous') {
    selectPreviousTab();
  }
});

overlay.addEventListener('click', hideOverlay);

const port = browser.runtime.connect({ name: 'content script' });

document.addEventListener('keyup', ({ key }) => {
  if (key === 'Alt') {
    hideOverlay();
    port.postMessage({ command: 'switch tab', selectedTab: tabsArray[selectedTabIndex] });
    selectedTabIndex = 0;
  }
});

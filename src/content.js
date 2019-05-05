/* eslint-disable no-undef */
import browser from 'webextension-polyfill';
import styles from './content.css';

const overlay = document.createElement('div');
overlay.className = styles.overlay;

const card = document.createElement('pre');
card.className = styles.card;

overlay.append(card);
document.body.append(overlay);

function hideOverlay() {
  overlay.style.display = 'none';
}

function showOverlay() {
  overlay.style.display = 'flex';
}

function getTabElements(tabs, selectedId) {
  return tabs.map(({ title }, i) => {
    const tabEl = document.createElement('div');
    tabEl.className = styles.tab;
    if (i === selectedId) {
      tabEl.classList.add(styles.tab_selected);
    }
    tabEl.textContent = title;
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

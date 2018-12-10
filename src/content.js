/* eslint-disable no-undef */
import browser from 'webextension-polyfill';

const overlay = document.createElement('div');
overlay.className = 'popup-tab-switcher';

const card = document.createElement('pre');
card.className = 'popup-tab-switcher__card';

overlay.append(card);
document.body.append(overlay);

function getTabElements(tabs, selectedId) {
  return tabs.map(({ title }, i) => {
    const tabEl = document.createElement('div');
    tabEl.className = 'popup-tab-switcher__tab';
    if (i === selectedId) {
      tabEl.classList.add('popup-tab-switcher__tab--selected');
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
}

let selectedTabIndex = 0;
let tabsArray;

function selectNextTab() {
  selectedTabIndex = (selectedTabIndex + 1) % tabsArray.length;
  renderTabs(tabsArray, selectedTabIndex);
}

browser.runtime.onMessage.addListener(({ type, tabs }) => {
  if (type === 'initialize') {
    tabsArray = tabs;
    renderTabs(tabsArray, selectedTabIndex);
  }

  if (type === 'next-tab') {
    selectNextTab();
  }
});

function hideOverlay() {
  overlay.style.display = 'none';
}

overlay.addEventListener('click', hideOverlay);

document.addEventListener('keyup', ({ key }) => {
  // if (key === 'Alt') {
  //   hideOverlay();
  // }
});

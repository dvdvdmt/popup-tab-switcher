import styles from './content.scss';
import sprite from './utils/sprite';
import { CONTENT_SCRIPT_PORT, UPDATE_SETTINGS_MESSAGE } from './utils/constants';
import tabCornerSymbol from './images/tab-corner.svg';
import noFaviconSymbol from './images/no-favicon-icon.svg';
import settingsSymbol from './images/settings-icon.svg';
import downloadsSymbol from './images/downloads-icon.svg';
import extensionsSymbol from './images/extensions-icon.svg';
import historySymbol from './images/history-icon.svg';
import bookmarksSymbol from './images/bookmarks-icon.svg';

const favIcons = {
  default: noFaviconSymbol,
  settings: settingsSymbol,
  downloads: downloadsSymbol,
  extensions: extensionsSymbol,
  history: historySymbol,
  bookmarks: bookmarksSymbol,
};

let { settings } = window;

function createSVGIcon(symbol, className) {
  const svgEl = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svgEl.setAttribute('viewBox', symbol.viewBox);
  svgEl.classList.add(...className.split(' '));
  const useEl = document.createElementNS('http://www.w3.org/2000/svg', 'use');
  useEl.setAttribute('href', `#${symbol.id}`);
  svgEl.append(useEl);
  return svgEl;
}

function getIconEl(favIconUrl, url) {
  let iconEl;
  if (!favIconUrl && url) {
    const matches = /chrome:\/\/(\w*?)\//.exec(url);
    if (matches && matches[1] === 'newtab') {
      iconEl = document.createElement('div');
      iconEl.className = 'tab__icon';
      return iconEl;
    }
    if (matches && matches[1] && favIcons[matches[1]]) {
      return createSVGIcon(favIcons[matches[1]], 'tab__icon');
    }
    return createSVGIcon(favIcons.default, 'tab__icon tab__icon_noFavIcon');
  }
  iconEl = document.createElement('img');
  iconEl.src = favIconUrl;
  iconEl.className = 'tab__icon';
  return iconEl;
}

function getTabElements(tabs, selectedId) {
  return tabs.map(({ title, url, favIconUrl }, i) => {
    const tabEl = document.createElement('div');
    tabEl.className = 'tab';
    if (i === selectedId) {
      tabEl.classList.add('tab_selected');
      if (!document.hasFocus()) {
        const indicator = document.createElement('div');
        indicator.className = 'tab__timeoutIndicator';
        tabEl.append(indicator);
        tabEl.classList.add('tab_timeout');
      }
    }
    const iconEl = getIconEl(favIconUrl, url);
    tabEl.append(iconEl);
    const textEl = document.createElement('span');
    textEl.textContent = title;
    textEl.className = 'tab__text';
    tabEl.append(createSVGIcon(tabCornerSymbol, 'tab__cornerIcon tab__cornerIcon_top'));
    tabEl.append(createSVGIcon(tabCornerSymbol, 'tab__cornerIcon tab__cornerIcon_bottom'));
    tabEl.append(textEl);
    return tabEl;
  });
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

const contentScriptPort = chrome.runtime.connect({ name: CONTENT_SCRIPT_PORT });


export default class PopupTabSwitcher extends HTMLElement {
  constructor() {
    super();

    const shadow = this.attachShadow({ mode: 'open' });
    sprite.mount(shadow);
    const style = document.createElement('style');
    style.textContent = styles;
    this.card = document.createElement('div');
    shadow.appendChild(style);
    shadow.appendChild(this.card);

    this.addEventListener('click', this.hideOverlay);
    document.addEventListener('keyup', ({ key }) => {
      if (key === 'Alt') {
        this.switchToSelectedTab();
      }
    });

    chrome.runtime.onMessage.addListener(({ type, tabsData, newSettings }) => {
      if (type === UPDATE_SETTINGS_MESSAGE) {
        settings = newSettings;
        this.renderTabs(tabsArray, selectedTabIndex);
        return;
      }
      tabsArray = tabsData;
      if (type === 'next') {
        selectedTabIndex = rangedIncrement(selectedTabIndex, +1, tabsArray.length);
      } else if (type === 'previous') {
        selectedTabIndex = rangedIncrement(selectedTabIndex, -1, tabsArray.length);
      }
      this.renderTabs(tabsArray, selectedTabIndex);
      // When the focus is on the address bar or the 'search in the page' field
      // then the extension should switch a tab at the end of a timer.
      // Because there is no way to handle key pressings when a page has no focus.
      // https://stackoverflow.com/a/20940788/3167855
      if (!document.hasFocus()) {
        clearTimeout(timeout);
        timeout = setTimeout(this.switchToSelectedTab.bind(this), settings.autoSwitchingTimeout);
      }
    });
  }

  showOverlay() {
    const { sizes } = settings;
    this.style.setProperty('--popup-width-factor', sizes.popupWidth / window.outerWidth);
    this.style.setProperty('--popup-height-factor', sizes.popupHeight / window.outerWidth);
    this.style.setProperty('--popup-border-radius-factor', sizes.popupBorderRadius / window.outerWidth);
    this.style.setProperty('--tab-height-factor', sizes.tabHeight / window.outerWidth);
    this.style.setProperty('--font-size-factor', sizes.font / window.outerWidth);
    this.style.setProperty('--icon-size-factor', sizes.icon / window.outerWidth);
    this.style.setProperty('--size-window-width', window.outerWidth);
    this.style.setProperty('--time-auto-switch-timeout', `${settings.autoSwitchingTimeout}ms`);
    this.style.display = 'flex';
  }

  hideOverlay() {
    this.style.display = 'none';
  }

  switchToSelectedTab() {
    this.hideOverlay();
    contentScriptPort.postMessage({
      command: 'switch tab',
      selectedTab: tabsArray[selectedTabIndex],
    });
    selectedTabIndex = 0;
  }

  scrollLongTextOfSelectedTab() {
    const textEl = this.shadowRoot.querySelector('.tab_selected .tab__text');
    const textIndent = textEl.scrollWidth - textEl.offsetWidth;
    if (textIndent) {
      const scrollTime = textIndent / textEl.offsetWidth * settings.textScrollCoefficient;
      const totalTime = 2 * settings.textScrollDelay + scrollTime;
      const startDelayOffset = settings.textScrollDelay / totalTime;
      const endDelayOffset = 1 - startDelayOffset;
      textEl.style.setProperty('text-overflow', 'initial');
      textEl.animate([{
        textIndent: 'initial',
      }, {
        textIndent: 'initial',
        offset: startDelayOffset,
      }, {
        textIndent: `-${textIndent}px`,
        offset: endDelayOffset,
      }, {
        textIndent: `-${textIndent}px`,
      }], {
        duration: scrollTime + 2 * settings.textScrollDelay,
        iterations: Infinity,
      });
    }
  }

  renderTabs(tabs, selectedId) {
    this.card.innerHTML = '';
    this.card.className = ['card', settings.isDarkTheme ? 'card_dark' : ''].join(' ');
    const tabElements = getTabElements(tabs, selectedId);
    for (const tabElement of tabElements) {
      this.card.append(tabElement);
    }
    this.showOverlay();
    this.scrollLongTextOfSelectedTab();
  }
}

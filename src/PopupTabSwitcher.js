import styles from './PopupTabSwitcher.scss';
import sprite from './utils/sprite';
import { messages, ports } from './utils/constants';
import tabCornerSymbol from './images/tab-corner.svg';
import noFaviconSymbol from './images/no-favicon-icon.svg';
import settingsSymbol from './images/settings-icon.svg';
import downloadsSymbol from './images/downloads-icon.svg';
import extensionsSymbol from './images/extensions-icon.svg';
import historySymbol from './images/history-icon.svg';
import bookmarksSymbol from './images/bookmarks-icon.svg';
import handleMessage from './utils/handleMessage';

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

function restoreSelectionAndFocus(activeEl) {
  activeEl.focus();
  const has = Object.prototype.hasOwnProperty;
  if (
    has.call(activeEl, 'selectionStart')
    && has.call(activeEl, 'selectionEnd')
    && has.call(activeEl, 'selectionDirection')
    && has.call(activeEl, 'setSelectionRange')
  ) {
    const { selectionStart, selectionEnd, selectionDirection } = activeEl;
    activeEl.setSelectionRange(selectionStart, selectionEnd, selectionDirection);
  }
}

/**
 * Restricts result of a number increment between [0, maxInteger - 1]
 */
function rangedIncrement(number, increment, maxInteger) {
  return (number + (increment % maxInteger) + maxInteger) % maxInteger;
}

const contentScriptPort = chrome.runtime.connect({ name: ports.CONTENT_SCRIPT });

export default class PopupTabSwitcher extends HTMLElement {
  constructor() {
    super();
    this.timeout = null;
    this.tabsArray = null;
    this.activeElement = null;
    this.selectedTabIndex = 0;
    this.isOverlayVisible = false;
    const shadow = this.attachShadow({ mode: 'open' });
    sprite.mount(shadow);
    const style = document.createElement('style');
    style.textContent = styles;
    this.card = document.createElement('div');
    shadow.appendChild(style);
    shadow.appendChild(this.card);
    this.hideOverlay = this.hideOverlay.bind(this);
    this.setupListeners();
  }

  setupListeners() {
    this.popupEventListener = handleMessage({
      click: this.hideOverlay,
    });
    this.cardEventListener = handleMessage({
      keyup: (e) => {
        if (!this.isOverlayVisible) {
          return;
        }
        if (!settings.isStayingOpen && ['Alt', 'Control', 'Meta'].includes(e.key)) {
          this.switchToSelectedTab();
          e.preventDefault();
          e.stopPropagation();
        }
      },
      keydown: (e) => {
        if (!this.isOverlayVisible) {
          return;
        }
        const handlers = {
          Escape: () => this.hideOverlay(),
          Enter: () => this.switchToSelectedTab(),
          ArrowUp: () => this.selectNextTab(-1),
          ArrowDown: () => this.selectNextTab(1),
          Tab: () => this.selectNextTab(e.shiftKey ? -1 : 1),
        };
        const handler = handlers[e.key];
        if (handler) {
          handler();
          e.preventDefault();
          e.stopPropagation();
        }
      },
    });
    this.windowEventListener = handleMessage({
      blur: this.hideOverlay,
    });
    this.addEventListener('click', this.popupEventListener);
    this.card.addEventListener('keyup', this.cardEventListener);
    this.card.addEventListener('keydown', this.cardEventListener);
    window.addEventListener('blur', this.windowEventListener);
    this.messageListener = handleMessage({
      [messages.UPDATE_SETTINGS]: ({ tabsData, newSettings }) => {
        this.tabsArray = tabsData;
        settings = newSettings;
        this.renderTabs();
      },
      [messages.UPDATE_SETTINGS_SILENTLY]: ({ newSettings }) => {
        settings = newSettings;
      },
      [messages.CLOSE_POPUP]: this.hideOverlay,
      [messages.SELECT_TAB]: ({ tabsData, increment }) => {
        this.tabsArray = tabsData;
        this.selectNextTab(increment);
        // When the focus is on the address bar or the 'search in the page' field
        // then the extension should switch a tab at the end of a timer.
        // Because there is no way to handle key pressings when a page has no focus.
        // https://stackoverflow.com/a/20940788/3167855
        if (!document.hasFocus()) {
          clearTimeout(this.timeout);
          this.timeout = setTimeout(this.switchToSelectedTab.bind(this),
            settings.autoSwitchingTimeout);
        }
      },
    });
    chrome.runtime.onMessage.addListener(this.messageListener);
  }

  selectNextTab(increment) {
    this.selectedTabIndex = rangedIncrement(
      this.selectedTabIndex, increment, this.tabsArray.length,
    );
    this.renderTabs();
  }

  removeListeners() {
    this.removeEventListener('click', this.popupEventListener);
    document.removeEventListener('keyup', this.cardEventListener);
    document.removeEventListener('keydown', this.cardEventListener);
    window.removeEventListener('blur', this.windowEventListener);
    chrome.runtime.onMessage.removeListener(this.messageListener);
  }

  disconnectedCallback() {
    this.removeListeners();
  }

  showOverlay() {
    const {
      tabHeight,
      popupWidth,
      fontSize,
      iconSize,
      numberOfTabsToShow,
    } = settings;
    const popupHeight = numberOfTabsToShow * tabHeight;
    const popupBorderRadius = 8;
    this.style.setProperty('--popup-width-factor', popupWidth / window.outerWidth);
    this.style.setProperty('--popup-height-factor', popupHeight / window.outerWidth);
    this.style.setProperty('--popup-border-radius-factor', popupBorderRadius / window.outerWidth);
    this.style.setProperty('--tab-height-factor', tabHeight / window.outerWidth);
    this.style.setProperty('--font-size-factor', fontSize / window.outerWidth);
    this.style.setProperty('--icon-size-factor', iconSize / window.outerWidth);
    this.style.setProperty('--size-window-width', window.outerWidth);
    this.style.setProperty('--time-auto-switch-timeout', `${settings.autoSwitchingTimeout}ms`);
    this.style.display = 'flex';
    this.isOverlayVisible = true;
  }

  hideOverlay() {
    this.style.display = 'none';
    this.isOverlayVisible = false;
    this.selectedTabIndex = 0;
    if (this.activeElement) {
      restoreSelectionAndFocus(this.activeElement);
    }
    this.activeElement = null;
  }

  switchToSelectedTab() {
    this.switchTo(this.tabsArray[this.selectedTabIndex]);
  }

  switchTo(selectedTab) {
    this.hideOverlay();
    contentScriptPort.postMessage({
      type: messages.SWITCH_TAB,
      selectedTab,
    });
  }

  getTabElements() {
    return this.tabsArray.map((tab, i) => {
      const tabEl = document.createElement('div');
      tabEl.addEventListener('click', () => {
        this.switchTo(tab);
      });
      tabEl.className = 'tab';
      tabEl.tabIndex = -1;
      if (i === this.selectedTabIndex) {
        tabEl.classList.add('tab_selected');
        if (!document.hasFocus()) {
          const indicator = document.createElement('div');
          indicator.className = 'tab__timeoutIndicator';
          tabEl.append(indicator);
          tabEl.classList.add('tab_timeout');
        }
      }
      const iconEl = getIconEl(tab.favIconUrl, tab.url);
      const textEl = document.createElement('span');
      textEl.textContent = tab.title;
      textEl.className = 'tab__text';
      tabEl.append(
        iconEl,
        createSVGIcon(tabCornerSymbol, 'tab__cornerIcon tab__cornerIcon_top'),
        createSVGIcon(tabCornerSymbol, 'tab__cornerIcon tab__cornerIcon_bottom'),
        textEl,
      );
      return tabEl;
    });
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
      textEl.animate([
        {
          textIndent: 'initial',
        },
        {
          textIndent: 'initial',
          offset: startDelayOffset,
        },
        {
          textIndent: `-${textIndent}px`,
          offset: endDelayOffset,
        },
        {
          textIndent: `-${textIndent}px`,
        },
      ], {
        duration: scrollTime + 2 * settings.textScrollDelay,
        iterations: Infinity,
      });
    }
  }

  renderTabs() {
    // remember active element to restore focus and selection when switcher hides
    this.activeElement = this.activeElement || document.activeElement;
    this.card.innerHTML = '';
    this.card.className = ['card', settings.isDarkTheme ? 'card_dark' : ''].join(' ');
    const tabElements = this.getTabElements();
    this.card.append(...tabElements);
    this.showOverlay();
    tabElements[this.selectedTabIndex].focus();
    this.scrollLongTextOfSelectedTab();
  }
}

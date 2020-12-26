import {Tabs} from 'webextension-polyfill-ts';
import styles from './popup-tab-switcher.scss';
import sprite from './utils/sprite';
import {Port} from './utils/constants';
import tabCornerSymbol from './images/tab-corner.svg';
import noFaviconSymbol from './images/no-favicon-icon.svg';
import settingsSymbol from './images/settings-icon.svg';
import downloadsSymbol from './images/downloads-icon.svg';
import extensionsSymbol from './images/extensions-icon.svg';
import historySymbol from './images/history-icon.svg';
import bookmarksSymbol from './images/bookmarks-icon.svg';
import {handleMessage, Handlers, Message, switchTab} from './utils/messages';
import {DefaultSettings} from './utils/settings';

import Tab = Tabs.Tab;

interface FavIcons {
  [key: string]: SvgSymbol;
}
const favIcons: FavIcons = {
  default: noFaviconSymbol,
  settings: settingsSymbol,
  downloads: downloadsSymbol,
  extensions: extensionsSymbol,
  history: historySymbol,
  bookmarks: bookmarksSymbol,
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let {settings}: {settings: DefaultSettings} = window as any;

function createSVGIcon(symbol: SvgSymbol, className: string) {
  const svgEl = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svgEl.setAttribute('viewBox', symbol.viewBox);
  svgEl.classList.add(...className.split(' '));
  const useEl = document.createElementNS('http://www.w3.org/2000/svg', 'use');
  useEl.setAttribute('href', `#${symbol.id}`);
  svgEl.append(useEl);
  return svgEl;
}

function getIconEl(favIconUrl: string, url: string) {
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

function restoreSelectionAndFocus(activeEl: Element) {
  if (!(activeEl instanceof HTMLElement)) {
    return;
  }
  activeEl.focus();
  if (activeEl instanceof HTMLInputElement || activeEl instanceof HTMLTextAreaElement) {
    const {selectionStart, selectionEnd, selectionDirection} = activeEl;
    try {
      activeEl.setSelectionRange(
        selectionStart,
        selectionEnd,
        selectionDirection as 'forward' | 'backward' | 'none'
      );
      // eslint-disable-next-line no-empty
    } catch (e) {}
  }
}

/**
 * Restricts result of a number increment between [0, maxInteger - 1]
 */
function rangedIncrement(number: number, increment: number, maxInteger: number) {
  return (number + (increment % maxInteger) + maxInteger) % maxInteger;
}

const contentScriptPort = chrome.runtime.connect({name: Port.CONTENT_SCRIPT});

export default class PopupTabSwitcher extends HTMLElement {
  private activeElement: Element;

  private timeout: number;

  private popupEventListener: (message: unknown) => void;

  private tabsArray: Tab[];

  private selectedTabIndex = 0;

  private isOverlayVisible = false;

  private readonly card: HTMLDivElement;

  private cardEventListener: (message: unknown) => void;

  private messageListener: (message: unknown) => void;

  private windowEventListener: (message: unknown) => void;

  private overlay: HTMLDivElement;

  constructor() {
    super();
    const shadow = this.attachShadow({mode: 'open'});
    sprite.mount(shadow);
    const style = document.createElement('style');
    style.textContent = styles;
    this.overlay = document.createElement('div');
    this.overlay.classList.add('overlay');
    this.card = document.createElement('div');
    shadow.appendChild(style);
    this.overlay.appendChild(this.card);
    shadow.appendChild(this.overlay);
    this.hideOverlay = this.hideOverlay.bind(this);
    this.setupListeners();
  }

  get nextTab() {
    return this.tabsArray[this.selectedTabIndex];
  }

  setupListeners() {
    this.popupEventListener = handleMessage({
      click: this.hideOverlay,
    });
    this.cardEventListener = handleMessage({
      keyup: (e: KeyboardEvent) => {
        if (!this.isOverlayVisible) {
          return;
        }
        if (!settings.isStayingOpen && ['Alt', 'Control', 'Meta'].includes(e.key)) {
          this.switchToSelectedTab();
          e.preventDefault();
          e.stopPropagation();
        }
      },
      keydown: (e: KeyboardEvent) => {
        if (!this.isOverlayVisible) {
          return;
        }
        const handlers: Handlers = {
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
      [Message.APPLY_NEW_SETTINGS]: ({tabsData, newSettings}) => {
        this.tabsArray = tabsData;
        settings = newSettings;
        this.renderTabs();
      },
      [Message.APPLY_NEW_SETTINGS_SILENTLY]: ({newSettings}) => {
        settings = newSettings;
      },
      [Message.CLOSE_POPUP]: this.hideOverlay,
      [Message.SELECT_TAB]: ({tabsData, increment}) => {
        this.tabsArray = tabsData;
        this.selectNextTab(increment);
        // When the focus is on the address bar or the 'search in the page' field
        // then the extension should switch a tab at the end of a timer.
        // Because there is no way to handle key pressings when a page has no focus.
        // https://stackoverflow.com/a/20940788/3167855
        if (!document.hasFocus()) {
          // When PDF file opens 'document.hasFocus() === false' no mater if the page
          // focused or not. This enables auto switching timeout which must not happen.
          // To prevent that we can switch to another tab instantly for all PDFs and
          // other locally opened files.
          if (document.contentType !== 'text/html') {
            this.switchToSelectedTab();
            return;
          }

          clearTimeout(this.timeout);
          this.timeout = window.setTimeout(
            this.switchToSelectedTab.bind(this),
            settings.autoSwitchingTimeout
          );
        }
      },
    });
    chrome.runtime.onMessage.addListener(this.messageListener);
  }

  selectNextTab(increment: number) {
    this.selectedTabIndex = rangedIncrement(
      this.selectedTabIndex,
      increment,
      this.tabsArray.length
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
    this.setStylePropertiesThatDependOnPageZoom();
    this.style.setProperty('--popup-opacity', `${settings.opacity / 100}`);
    this.style.setProperty('--time-auto-switch-timeout', `${settings.autoSwitchingTimeout}ms`);
    this.style.display = 'block';
    this.isOverlayVisible = true;
  }

  private setStylePropertiesThatDependOnPageZoom() {
    /*
     NOTE:
     The popup tries to look the same independent of page zoom level.
     Unfortunately there is no way of getting zoom level reliably (https://stackoverflow.com/questions/1713771/how-to-detect-page-zoom-level-in-all-modern-browsers).
     - Using outerWidth/innerWidth will give wrong results if a side bar is open (eg. dev tools,
       menu in FF).
     - The devicePixelRatio (DPR) changes on zoom but you can't rely on it on high DPI devices
       because there is no way of getting base DPR that corresponds to zoom 100% (https://www.w3.org/community/respimg/2013/04/06/devicenormalpixelratio-proposal-for-zoom-independent-devicepixelratio-for-hd-retina-games/).
     - Currently the 'vw' unit is used to preserve popup look on different zoom levels which has
       the same flaws as outerWidth/innerWidth approach.

     There is also Tab.getZoom() but it is extension specific API.
    */
    const {fontSize, numberOfTabsToShow, tabHeight, popupWidth, iconSize} = settings;
    const {outerWidth} = window;
    const popupHeight = numberOfTabsToShow * tabHeight;
    const popupBorderRadius = 8;
    this.style.setProperty('--popup-width-factor', `${popupWidth / outerWidth}`);
    this.style.setProperty('--popup-height-factor', `${popupHeight / outerWidth}`);
    this.style.setProperty('--popup-border-radius-factor', `${popupBorderRadius / outerWidth}`);
    this.style.setProperty('--tab-height-factor', `${tabHeight / outerWidth}`);
    this.style.setProperty('--font-size-factor', `${fontSize / outerWidth}`);
    this.style.setProperty('--icon-size-factor', `${iconSize / outerWidth}`);
    this.style.setProperty('--size-window-width', `${outerWidth}`);
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
    this.switchTo(this.nextTab);
  }

  switchTo(selectedTab: Tab) {
    this.hideOverlay();
    contentScriptPort.postMessage(switchTab(selectedTab));
  }

  getTabElements() {
    return this.tabsArray.map((tab, i, tabs) => {
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
      const topCornerEl = createSVGIcon(tabCornerSymbol, 'tab__cornerIcon tab__cornerIcon_top');
      const bottomCornerEl = createSVGIcon(
        tabCornerSymbol,
        'tab__cornerIcon tab__cornerIcon_bottom'
      );
      const textEl = document.createElement('span');
      textEl.textContent = tab.title;
      textEl.className = 'tab__text';
      let tabElements = [iconEl, topCornerEl, bottomCornerEl, textEl];
      if (i === 0) {
        tabElements = [iconEl, bottomCornerEl, textEl];
      } else if (i === tabs.length - 1) {
        tabElements = [iconEl, topCornerEl, textEl];
      }
      tabEl.append(...tabElements);
      return tabEl;
    });
  }

  scrollLongTextOfSelectedTab() {
    const textEl: HTMLElement = this.shadowRoot.querySelector('.tab_selected .tab__text');
    const textIndent = textEl.scrollWidth - textEl.offsetWidth;
    if (textIndent) {
      const scrollTime = (textIndent / textEl.offsetWidth) * settings.textScrollCoefficient;
      const totalTime = 2 * settings.textScrollDelay + scrollTime;
      const startDelayOffset = settings.textScrollDelay / totalTime;
      const endDelayOffset = 1 - startDelayOffset;
      textEl.style.setProperty('text-overflow', 'initial');
      textEl.animate(
        [
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
        ],
        {
          duration: scrollTime + 2 * settings.textScrollDelay,
          iterations: Infinity,
        }
      );
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

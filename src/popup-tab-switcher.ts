import styles from './popup-tab-switcher.scss'
import {Port} from './utils/constants'
import {handleMessage, Message, switchTab} from './utils/messages'
import {DefaultSettings} from './utils/settings'
import {getIconEl, getSVGIcon} from './icon'
import {cache} from './utils/cache'
import {ITab} from './utils/check-tab'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let {settings}: {settings: DefaultSettings} = window as any

const getIconElCached = cache(getIconEl)

function restoreSelectionAndFocus(activeEl: Element) {
  if (!(activeEl instanceof HTMLElement)) {
    return
  }
  activeEl.focus()
  if (activeEl instanceof HTMLInputElement || activeEl instanceof HTMLTextAreaElement) {
    const {selectionStart, selectionEnd, selectionDirection} = activeEl
    try {
      activeEl.setSelectionRange(
        selectionStart,
        selectionEnd,
        selectionDirection as 'forward' | 'backward' | 'none'
      )
      // eslint-disable-next-line no-empty
    } catch (e) {}
  }
}

/**
 * Restricts result of a number increment between [0, maxInteger - 1]
 */
function rangedIncrement(number: number, increment: number, maxInteger: number) {
  return (number + (increment % maxInteger) + maxInteger) % maxInteger
}

const contentScriptPort = chrome.runtime.connect({name: Port.CONTENT_SCRIPT})

export default class PopupTabSwitcher extends HTMLElement {
  private activeElement: Element | null

  private timeout: number

  private tabsArray: ITab[]

  private selectedTabIndex = 0

  private isOverlayVisible = false

  private readonly card: HTMLDivElement

  private messageListener: (message: unknown) => void

  private readonly overlay: HTMLDivElement

  private zoomFactor = 1

  private readonly root: ShadowRoot

  constructor() {
    super()
    this.onKeyUp = this.onKeyUp.bind(this)
    this.onKeyDown = this.onKeyDown.bind(this)
    this.onWindowBlur = this.onWindowBlur.bind(this)
    this.onClick = this.onClick.bind(this)
    this.root = this.attachShadow({mode: 'open'})
    const style = document.createElement('style')
    style.textContent = styles
    this.overlay = document.createElement('div')
    this.overlay.classList.add('overlay')
    this.card = document.createElement('div')
    this.root.appendChild(style)
    this.overlay.appendChild(this.card)
    this.root.appendChild(this.overlay)
    this.setupListeners()
  }

  get nextTab() {
    return this.tabsArray[this.selectedTabIndex]
  }

  setupListeners() {
    this.addEventListener('click', this.onClick)
    this.card.addEventListener('keyup', this.onKeyUp)
    this.card.addEventListener('keydown', this.onKeyDown)
    window.addEventListener('blur', this.onWindowBlur)
    this.messageListener = handleMessage({
      [Message.APPLY_NEW_SETTINGS]: ({tabsData, newSettings}) => {
        this.tabsArray = tabsData
        settings = newSettings
        this.renderTabs()
      },
      [Message.APPLY_NEW_SETTINGS_SILENTLY]: ({newSettings}) => {
        settings = newSettings
      },
      [Message.UPDATE_ZOOM_FACTOR]: ({zoomFactor}) => {
        this.zoomFactor = zoomFactor
        this.setStylePropertiesThatDependOnPageZoom()
      },
      [Message.CLOSE_POPUP]: () => this.hideOverlay(),
      [Message.SELECT_TAB]: ({tabsData, increment, zoomFactor}) => {
        this.tabsArray = tabsData
        this.zoomFactor = zoomFactor
        this.selectNextTab(increment)
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
            this.switchToSelectedTab()
            return
          }

          clearTimeout(this.timeout)
          this.timeout = window.setTimeout(
            this.switchToSelectedTab.bind(this),
            settings.autoSwitchingTimeout
          )
        }
      },
    })
    chrome.runtime.onMessage.addListener(this.messageListener)
  }

  selectNextTab(increment: number) {
    this.selectedTabIndex = rangedIncrement(this.selectedTabIndex, increment, this.tabsArray.length)
    this.renderTabs()
  }

  removeListeners() {
    this.removeEventListener('click', this.onClick)
    document.removeEventListener('keyup', this.onKeyUp)
    document.removeEventListener('keydown', this.onKeyDown)
    window.removeEventListener('blur', this.onWindowBlur)
    chrome.runtime.onMessage.removeListener(this.messageListener)
  }

  disconnectedCallback() {
    this.removeListeners()
  }

  showOverlay() {
    this.setStylePropertiesThatDependOnPageZoom()
    this.style.setProperty('--popup-opacity', `${settings.opacity / 100}`)
    this.style.setProperty('--time-auto-switch-timeout', `${settings.autoSwitchingTimeout}ms`)
    this.style.display = 'block'
    this.isOverlayVisible = true
  }

  private setStylePropertiesThatDependOnPageZoom() {
    /*
     NOTE:
     The popup tries to look the same independent of a page zoom level.
     Unfortunately there is no way of getting zoom level reliably (https://stackoverflow.com/questions/1713771/how-to-detect-page-zoom-level-in-all-modern-browsers).
     - Using outerWidth/innerWidth will give wrong results if a side bar is open (eg. dev tools,
       menu in FF).
     - The usage of 'vw' unit has the same flaws as outerWidth/innerWidth approach.
     - The window.devicePixelRatio (DPR) changes on zoom but you can't rely on it on high DPI devices
       because there is no way of getting base DPR that corresponds to zoom 100% (https://www.w3.org/community/respimg/2013/04/06/devicenormalpixelratio-proposal-for-zoom-independent-devicepixelratio-for-hd-retina-games/).

     Currently extension specific API browser.tabs.getZoom() is used to get tab zoom factor.
     Despite of knowing zoom factor the minimal font size on large zoom levels can't be rewritten.
    */
    const {fontSize, numberOfTabsToShow, tabHeight, popupWidth, iconSize} = settings
    const popupHeight = numberOfTabsToShow * tabHeight
    const popupBorderRadius = 8
    const tabHorizontalPadding = 10
    const tabTextPadding = 14
    const tabTimeoutIndicatorHeight = 2

    this.style.setProperty('--popup-width', `${popupWidth / this.zoomFactor}px`)
    this.style.setProperty('--popup-height', `${popupHeight / this.zoomFactor}px`)
    this.style.setProperty('--popup-border-radius', `${popupBorderRadius / this.zoomFactor}px`)
    this.style.setProperty('--tab-height', `${tabHeight / this.zoomFactor}px`)
    this.style.setProperty(
      '--tab-horizontal-padding',
      `${tabHorizontalPadding / this.zoomFactor}px`
    )
    this.style.setProperty('--tab-text-padding', `${tabTextPadding / this.zoomFactor}px`)
    this.style.setProperty(
      '--tab-timeout-indicator-height',
      `${tabTimeoutIndicatorHeight / this.zoomFactor}px`
    )
    this.style.setProperty('--font-size', `${fontSize / this.zoomFactor}px`)
    this.style.setProperty('--icon-size', `${iconSize / this.zoomFactor}px`)
  }

  hideOverlay() {
    this.style.display = 'none'
    this.isOverlayVisible = false
    this.selectedTabIndex = 0
    if (this.activeElement) {
      restoreSelectionAndFocus(this.activeElement)
    }
    this.activeElement = null
  }

  switchToSelectedTab() {
    this.switchTo(this.nextTab)
  }

  switchTo(selectedTab: ITab) {
    this.hideOverlay()
    contentScriptPort.postMessage(switchTab(selectedTab))
  }

  getTabElements() {
    return this.tabsArray.map((tab, i, tabs) => {
      const tabEl = document.createElement('div')
      tabEl.addEventListener('click', () => {
        this.switchTo(tab)
      })
      tabEl.className = 'tab'
      tabEl.tabIndex = -1
      if (i === this.selectedTabIndex) {
        tabEl.classList.add('tab_selected')
        if (!document.hasFocus()) {
          const indicator = document.createElement('div')
          indicator.className = 'tab__timeoutIndicator'
          tabEl.append(indicator)
          tabEl.classList.add('tab_timeout')
        }
      }
      const iconEl = getIconElCached(tab.favIconUrl, tab.url)
      const topCornerEl = getSVGIcon('tabCorner', 'tab__cornerIcon tab__cornerIcon_top')
      const bottomCornerEl = getSVGIcon('tabCorner', 'tab__cornerIcon tab__cornerIcon_bottom')
      const textEl = document.createElement('span')
      textEl.textContent = tab.title || ''
      textEl.className = 'tab__text'
      let tabElements = [iconEl, topCornerEl, bottomCornerEl, textEl]
      if (i === 0) {
        tabElements = [iconEl, bottomCornerEl, textEl]
      } else if (i === tabs.length - 1) {
        tabElements = [iconEl, topCornerEl, textEl]
      }
      tabEl.append(...tabElements)
      return tabEl
    })
  }

  scrollLongTextOfSelectedTab() {
    const textEl: HTMLElement = this.root.querySelector('.tab_selected .tab__text')!
    const textIndent = textEl.scrollWidth - textEl.offsetWidth
    if (textIndent) {
      const scrollTime = (textIndent / textEl.offsetWidth) * settings.textScrollCoefficient
      const totalTime = 2 * settings.textScrollDelay + scrollTime
      const startDelayOffset = settings.textScrollDelay / totalTime
      const endDelayOffset = 1 - startDelayOffset
      textEl.style.setProperty('text-overflow', 'initial')
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
      )
    }
  }

  renderTabs() {
    // remember active element to restore focus and selection when switcher hides
    this.activeElement = this.activeElement || document.activeElement
    this.card.innerHTML = ''
    this.card.className = ['card', settings.isDarkTheme ? 'card_dark' : ''].join(' ')
    const tabElements = this.getTabElements()
    this.card.dataset.testId = 'pts__card'
    this.card.append(...tabElements)
    this.showOverlay()
    tabElements[this.selectedTabIndex].focus()
    this.scrollLongTextOfSelectedTab()
  }

  onKeyUp(e: KeyboardEvent): void {
    if (!this.isOverlayVisible) {
      return
    }
    if (!settings.isStayingOpen && ['Alt', 'Control', 'Meta'].includes(e.key)) {
      this.switchToSelectedTab()
      e.preventDefault()
      e.stopPropagation()
    }
  }

  onKeyDown(e: KeyboardEvent): void {
    if (!this.isOverlayVisible) {
      return
    }
    const handlers: {[key: string]: () => void} = {
      Escape: () => this.hideOverlay(),
      Enter: () => this.switchToSelectedTab(),
      ArrowUp: () => this.selectNextTab(-1),
      ArrowDown: () => this.selectNextTab(1),
      Tab: () => this.selectNextTab(e.shiftKey ? -1 : 1),
    }
    const handler = handlers[e.key]
    if (handler) {
      handler()
      e.preventDefault()
      e.stopPropagation()
    }
  }

  onWindowBlur(): void {
    this.hideOverlay()
  }

  onClick(): void {
    this.hideOverlay()
  }
}

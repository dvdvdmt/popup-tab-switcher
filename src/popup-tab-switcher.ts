import browser from 'webextension-polyfill'
import styles from './popup-tab-switcher.scss'
import {getModel, handleMessage, initialized, Message, switchTab} from './utils/messages'
import {DefaultSettings} from './utils/settings'
import {getIconEl, getSVGIcon} from './icon'
import {cache} from './utils/cache'
import {ITab} from './utils/check-tab'

export interface IModel {
  settings: DefaultSettings
  tabs: ITab[]
  zoomFactor: number
}

const getIconElCached = cache(getIconEl)

/**
 * Restricts result of a number increment between [0, maxInteger - 1]
 */
function rangedIncrement(number: number, increment: number, maxInteger: number) {
  return (number + (increment % maxInteger) + maxInteger) % maxInteger
}

export default class PopupTabSwitcher extends HTMLElement {
  private activeEl: Element | null

  private timeout: number

  private tabsArray: ITab[]

  private selectedTabIndex = 0

  private isOverlayVisible = false

  private readonly card: HTMLDivElement

  private messageListener: ReturnType<typeof handleMessage>

  private readonly overlay: HTMLDivElement

  private zoomFactor = 1

  private readonly root: ShadowRoot

  private settings: DefaultSettings

  private isSettingsDemo = false

  constructor() {
    super()
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
    browser.runtime.sendMessage(initialized())
  }

  get nextTab() {
    return this.tabsArray[this.selectedTabIndex]
  }

  setupListeners() {
    this.addEventListener('click', this.onClick)
    this.card.addEventListener('keyup', this.onKeyUp)
    this.card.addEventListener('keydown', this.onKeyDown)
    window.addEventListener('blur', this.onWindowBlur)
    // TODO:
    //  Zoom events are listened in background script and passed to the content scripts in active tabs.
    //  It is better to listen to resize event and request data about zoomFactor from background script when necessary.
    // window.addEventListener('resize', (e) => {
    //   console.log(`[ resize]`, e)
    // })

    this.messageListener = handleMessage({
      [Message.DEMO_SETTINGS]: async () => {
        await this.updateModel()
        this.isSettingsDemo = true
        this.renderTabs()
        setTimeout(() => {
          //  Double clicks on settings icon can result in hidden switcher.
          //  This happens because switcher reacts on window blur event.
          //  When settings are open blur handler should be disabled.
          this.isSettingsDemo = false
        })
      },
      [Message.UPDATE_ZOOM_FACTOR]: ({zoomFactor}) => {
        this.zoomFactor = zoomFactor
        this.setStylePropertiesThatDependOnPageZoom()
      },
      [Message.CLOSE_POPUP]: () => this.hideOverlay(),
      [Message.SELECT_TAB]: async ({increment}) => {
        await this.updateModel()
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
            this.settings.autoSwitchingTimeout
          )
        }
      },
    })
    browser.runtime.onMessage.addListener(this.messageListener)
  }

  async updateModel() {
    const model: IModel = await browser.runtime.sendMessage(getModel())
    this.tabsArray = model.tabs
    this.zoomFactor = model.zoomFactor
    this.settings = model.settings
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
    browser.runtime.onMessage.removeListener(this.messageListener)
  }

  disconnectedCallback() {
    this.removeListeners()
  }

  showOverlay() {
    this.setStylePropertiesThatDependOnPageZoom()
    this.style.setProperty('--popup-opacity', `${this.settings.opacity / 100}`)
    this.style.setProperty('--time-auto-switch-timeout', `${this.settings.autoSwitchingTimeout}ms`)
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
    const {fontSize, numberOfTabsToShow, tabHeight, popupWidth, iconSize} = this.settings
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
    this.restoreSelectionAndFocus()
  }

  switchToSelectedTab() {
    this.switchTo(this.nextTab)
  }

  switchTo(selectedTab: ITab) {
    this.hideOverlay()
    browser.runtime.sendMessage(switchTab(selectedTab))
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
    if (textIndent > 0) {
      const scrollTime = (textIndent / textEl.offsetWidth) * this.settings.textScrollCoefficient
      const duration = scrollTime + 2 * this.settings.textScrollDelay
      const startDelayOffset = this.settings.textScrollDelay / duration
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
          duration,
          iterations: Infinity,
        }
      )
    }
  }

  renderTabs() {
    // remember active element to restore focus and selection when switcher hides
    this.activeEl = this.activeEl || document.activeElement
    this.card.innerHTML = ''
    this.card.className = ['card', this.settings.isDarkTheme ? 'card_dark' : ''].join(' ')
    const tabElements = this.getTabElements()
    this.card.dataset.testId = 'pts__card'
    this.card.append(...tabElements)
    this.showOverlay()
    tabElements[this.selectedTabIndex].focus()
    this.scrollLongTextOfSelectedTab()
  }

  onKeyUp = (e: KeyboardEvent): void => {
    if (!this.isOverlayVisible) {
      return
    }
    if (!this.settings.isStayingOpen && ['Alt', 'Control', 'Meta'].includes(e.key)) {
      this.switchToSelectedTab()
      e.preventDefault()
      e.stopPropagation()
    }
  }

  onKeyDown = (e: KeyboardEvent): void => {
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

  onWindowBlur = (): void => {
    if (this.isSettingsDemo) {
      return
    }
    this.hideOverlay()
  }

  onClick = (): void => {
    this.hideOverlay()
  }

  restoreSelectionAndFocus() {
    if (this.activeEl) {
      const activeEl = this.activeEl
      this.activeEl = null
      if (activeEl instanceof HTMLElement) {
        activeEl.focus({preventScroll: true})
      }
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
  }
}

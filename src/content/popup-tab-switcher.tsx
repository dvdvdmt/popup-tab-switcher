import browser from 'webextension-polyfill'
import {For, render, Show} from 'solid-js/web'
import {ComponentType} from 'solid-element'
import {createEffect, onCleanup, onMount} from 'solid-js'
import styles from './popup-tab-switcher.scss'
import {
  getModel,
  handleMessage,
  IGetModelResponse,
  initialized,
  Message,
  switchTab,
} from '../utils/messages'
import {defaultSettings} from '../utils/settings'
import {getIconEl, getSVGIcon} from './icon'
import {cache} from '../utils/cache'
import {ITab} from '../utils/check-tab'
import {log} from '../utils/logger'
import {createPopupStore} from './popup-store'
import {TabCornerIcon, TabIcon} from './icons'

const getIconElCached = cache(getIconEl)

/**
 * Restricts result of a number increment between [0, maxInteger - 1]
 */
function rangedIncrement(number: number, increment: number, maxInteger: number) {
  return (number + (increment % maxInteger) + maxInteger) % maxInteger
}

export const PopupTabSwitcher: ComponentType<unknown> = (_props, {element}) => {
  const {store, syncStoreWithBackground, openPopup, closePopup} = createPopupStore()
  // TODO: check that isSettingsDemo is needed
  // let isSettingsDemo = false
  const setUpListeners = () => {
    // element.addEventListener('click', this.onClick)
    // window.addEventListener('keyup', this.onKeyUp)
    // window.addEventListener('keydown', this.onKeyDown)
    // window.addEventListener('blur', this.onWindowBlur)
    // window.addEventListener('resize', this.onWindowResize)

    const messageListener = handleMessage({
      [Message.DEMO_SETTINGS]: async () => {
        // isSettingsDemo = true
        await syncStoreWithBackground()
        openPopup()
        // this.renderTabs()
        // setTimeout(() => {
        //   //  Double clicks on settings icon can result in hidden switcher.
        //   //  This happens because switcher reacts on window blur event.
        //   //  When settings are open blur handler should be disabled.
        //   this.isSettingsDemo = false
        // })
      },
      [Message.CLOSE_POPUP]: closePopup,
      // [Message.SELECT_TAB]: async ({increment}) => {
      //   await this.updateModel()
      //   this.selectNextTab(increment)
      //   // When the focus is on the address bar or the 'search in the page' field
      //   // then the extension should switch a tab at the end of a timer.
      //   // Because there is no way to handle key pressings when a page has no focus.
      //   // https://stackoverflow.com/a/20940788/3167855
      //   if (!document.hasFocus()) {
      //     // When PDF file opens 'document.hasFocus() === false' no mater if the page
      //     // focused or not. This enables auto switching timeout which must not happen.
      //     // To prevent that we can switch to another tab instantly for all PDFs and
      //     // other locally opened files.
      //     if (document.contentType !== 'text/html') {
      //       this.switchToSelectedTab()
      //       return
      //     }
      //
      //     clearTimeout(this.timeout)
      //     this.timeout = window.setTimeout(
      //       this.switchToSelectedTab.bind(this),
      //       this.settings.autoSwitchingTimeout
      //     )
      //   }
      // },
    })
    browser.runtime.onMessage.addListener(messageListener)
  }

  const setStylePropertiesThatDependOnPageZoom = () => {
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
     Restrictions:
     - The minimal font size on large zoom levels can't be rewritten.
    */
    const {fontSize, numberOfTabsToShow, tabHeight, popupWidth, iconSize} = store.settings
    const zoomFactor = store.zoomFactor
    const popupHeight = numberOfTabsToShow * tabHeight
    const popupBorderRadius = 8
    const tabHorizontalPadding = 10
    const tabTextPadding = 10
    const tabTimeoutIndicatorHeight = 2

    element.style.setProperty('--popup-width', `${popupWidth / zoomFactor}px`)
    element.style.setProperty('--popup-height', `${popupHeight / zoomFactor}px`)
    element.style.setProperty('--popup-border-radius', `${popupBorderRadius / zoomFactor}px`)
    element.style.setProperty('--tab-height', `${tabHeight / zoomFactor}px`)
    element.style.setProperty('--tab-horizontal-padding', `${tabHorizontalPadding / zoomFactor}px`)
    element.style.setProperty('--tab-text-padding', `${tabTextPadding / zoomFactor}px`)
    element.style.setProperty(
      '--tab-timeout-indicator-height',
      `${tabTimeoutIndicatorHeight / zoomFactor}px`
    )
    element.style.setProperty('--font-size', `${fontSize / zoomFactor}px`)
    element.style.setProperty('--icon-size', `${iconSize / zoomFactor}px`)
  }

  const showOverlay = () => {
    element.style.display = 'block'
    element.style.setProperty('--popup-opacity', `${store.settings.opacity / 100}`)
    element.style.setProperty(
      '--time-auto-switch-timeout',
      `${store.settings.autoSwitchingTimeout}ms`
    )
    setStylePropertiesThatDependOnPageZoom()
  }

  onMount(() => {
    log(`[init switcher]`)
    setUpListeners()
    browser.runtime.sendMessage(initialized())
  })

  onCleanup(() => {
    log(`[remove switcher]`)
  })

  createEffect(() => {
    log(`[render switcher]`)
    if (store.isOpen) {
      showOverlay()
    } else {
      element.style.display = 'none'
    }
  })

  return (
    <>
      <style>{styles}</style>
      <Show when={store.isOpen}>
        <div class="overlay">
          <div
            class="card"
            classList={{card_dark: store.settings.isDarkTheme}}
            data-test-id="pts__card"
          >
            <For each={store.tabs}>
              {(tab, index) => (
                <div
                  tabindex="-1"
                  class="tab"
                  classList={{
                    tab_selected: store.selectedTabIndex === index(),
                  }}
                >
                  <Show when={store.selectedTabIndex === index() && !document.hasFocus()}>
                    <div class="tab__timeoutIndicator" />
                  </Show>
                  <TabIcon url={tab.url} />
                  {tab.title}
                </div>
              )}
            </For>
          </div>
        </div>
      </Show>
    </>
  )
}

export class PopupTabSwitcherElementOld extends HTMLElement {
  private activeEl: Element | null

  private timeout: number

  private tabsArray: ITab[] = []

  private selectedTabIndex = 0

  private readonly card: HTMLDivElement

  private messageListener: ReturnType<typeof handleMessage>

  private readonly overlay: HTMLDivElement

  private zoomFactor = 1

  private readonly root: ShadowRoot

  private settings = defaultSettings

  private isSettingsDemo = false

  constructor() {
    super()
    this.root = this.attachShadow({mode: 'open'})
    const style = document.createElement('style')
    style.textContent = styles
    this.overlay = document.createElement('div')
    this.overlay.classList.add('overlay')
    this.card = document.createElement('div')
    render(() => <div class="card">THIS IS A TEST OF SOLID-JS</div>, this.root)
    // this.root.appendChild(style)
    this.overlay.appendChild(this.card)
    // this.root.appendChild(this.overlay)
    this.setupListeners()
    browser.runtime.sendMessage(initialized())
  }

  get nextTab() {
    return this.tabsArray[this.selectedTabIndex]
  }

  get isOverlayVisible(): boolean {
    return this.style.display === 'block'
  }

  setupListeners() {
    this.addEventListener('click', this.onClick)
    window.addEventListener('keyup', this.onKeyUp)
    window.addEventListener('keydown', this.onKeyDown)
    window.addEventListener('blur', this.onWindowBlur)
    window.addEventListener('resize', this.onWindowResize)

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
    const model: IGetModelResponse = await browser.runtime.sendMessage(getModel())
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
    window.removeEventListener('keyup', this.onKeyUp)
    window.removeEventListener('keydown', this.onKeyDown)
    window.removeEventListener('blur', this.onWindowBlur)
    window.removeEventListener('resize', this.onWindowResize)
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
  }

  hideOverlay() {
    this.style.display = 'none'
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
        }
      }
      const iconEl = getIconElCached(tab.url, tab.id)
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
    if (!this.isOverlayVisible || this.settings.isStayingOpen) {
      return
    }
    if (['Alt', 'Control', 'Meta'].includes(e.key)) {
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
    const tabTextPadding = 10
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

  private onWindowResize = async () => {
    if (this.isOverlayVisible) {
      await this.updateModel()
      this.setStylePropertiesThatDependOnPageZoom()
    }
  }
}

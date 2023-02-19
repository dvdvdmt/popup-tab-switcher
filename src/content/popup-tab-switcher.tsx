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
import {log} from '../utils/logger'
import {createPopupStore, rangedIncrement} from './popup-store'
import {TabComponent} from './tab-component'

type ITab = chrome.tabs.Tab

export function PopupTabSwitcher(_props: unknown, {element}: {element: HTMLElement}) {
  const {store, syncStoreWithBackground, openPopup, closePopup, selectNextTab} = createPopupStore()
  // TODO: check that isSettingsDemo is needed
  // let isSettingsDemo = false
  let lastActiveElement: Element | null = null

  // TODO:
  //  Think of moving all arrow functions to named functions and placing them
  //  after the return statement. This will divide code in two distinct parts:
  //  - synchronous part that creates the component
  //  - asynchronous part that handles changes during the component lifecycle
  //  By putting the structure and main logic of the component at the start
  //  and minor details like event handlers at the end of the file we achieve better readability.
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

  const onWindowResize = async () => {
    if (store.isOpen) {
      await syncStoreWithBackground()
      setStylePropertiesThatDependOnPageZoom()
    }
  }

  const setUpListeners = () => {
    element.addEventListener('click', onOverlayClick)
    // window.addEventListener('keyup', this.onKeyUp)
    // window.addEventListener('keydown', this.onKeyDown)
    // window.addEventListener('blur', this.onWindowBlur)
    window.addEventListener('resize', onWindowResize)

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
      [Message.SELECT_TAB]: async ({increment}) => {
        await syncStoreWithBackground()
        openPopup()
        selectNextTab(increment)
        // When the focus is on the address bar or the 'search in the page' field
        // then the extension should switch a tab at the end of a timer.
        // Because there is no way to handle key pressings when a page has no focus.
        // https://stackoverflow.com/a/20940788/3167855
        // if (!document.hasFocus()) {
        //   // When PDF file opens 'document.hasFocus() === false' no mater if the page
        //   // focused or not. This enables auto switching timeout which must not happen.
        //   // To prevent that we can switch to another tab instantly for all PDFs and
        //   // other locally opened files.
        //   if (document.contentType !== 'text/html') {
        //     this.switchToSelectedTab()
        //     return
        //   }
        //
        //   clearTimeout(this.timeout)
        //   this.timeout = window.setTimeout(
        //     this.switchToSelectedTab.bind(this),
        //     this.settings.autoSwitchingTimeout
        //   )
        // }
      },
    })
    browser.runtime.onMessage.addListener(messageListener)
  }

  const switchTo = (selectedTab: ITab) => {
    browser.runtime.sendMessage(switchTab(selectedTab))
    closePopup()
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
      lastActiveElement = document.activeElement
      showOverlay()
    } else {
      element.style.display = 'none'
      restoreSelectionAndFocus()
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
                <TabComponent
                  tab={tab}
                  isFirst={index() === 0}
                  isLast={index() === store.tabs.length - 1}
                  isSelected={index() === store.selectedTabIndex}
                  onClick={() => {
                    switchTo(tab)
                  }}
                  textScrollCoefficient={store.settings.textScrollCoefficient}
                  textScrollDelay={store.settings.textScrollDelay}
                />
              )}
            </For>
          </div>
        </div>
      </Show>
    </>
  )

  function onOverlayClick(event: MouseEvent) {
    if (event.target === element) {
      closePopup()
    }
  }

  function restoreSelectionAndFocus() {
    if (!lastActiveElement) {
      return
    }
    if (lastActiveElement instanceof HTMLElement) {
      lastActiveElement.focus({preventScroll: true})
    }
    // TODO: Restore selection properly.
    //  Not only input and textarea elements can have selection.
    //  For example, contenteditable elements can have selection too.
    if (
      lastActiveElement instanceof HTMLInputElement ||
      lastActiveElement instanceof HTMLTextAreaElement
    ) {
      const {selectionStart, selectionEnd, selectionDirection} = lastActiveElement
      try {
        lastActiveElement.setSelectionRange(
          selectionStart,
          selectionEnd,
          selectionDirection as 'forward' | 'backward' | 'none'
        )
        // eslint-disable-next-line no-empty
      } catch (e) {}
    }
    lastActiveElement = null
  }
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
    // TODO: Replace solid-element with this approach
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
    // window.addEventListener('resize', this.onWindowResize)

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
    // window.removeEventListener('resize', this.onWindowResize)
    browser.runtime.onMessage.removeListener(this.messageListener)
  }

  disconnectedCallback() {
    this.removeListeners()
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

  renderTabs() {
    // remember active element to restore focus and selection when switcher hides
    this.activeEl = this.activeEl || document.activeElement
    this.card.innerHTML = ''
    this.card.className = ['card', this.settings.isDarkTheme ? 'card_dark' : ''].join(' ')
    // const tabElements = this.getTabElements()
    this.card.dataset.testId = 'pts__card'
    // this.card.append(...tabElements)
    // this.showOverlay()
    // tabElements[this.selectedTabIndex].focus()
    // this.scrollLongTextOfSelectedTab()
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
}

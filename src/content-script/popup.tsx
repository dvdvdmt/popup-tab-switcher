import {For, render, Show} from 'solid-js/web'
import {createEffect, onCleanup, onMount} from 'solid-js'
import styles from './popup.scss'
import {
  contentScriptStarted,
  contentScriptStopped,
  handleMessage,
  Message,
  switchTab,
} from '../utils/messages'
import {log} from '../utils/logger'
import {createPopupStore} from './popup-store'
import {PopupTab} from './popup-tab'
import uuid from '../utils/uuid'
import {SelectionAndFocus} from './selection-and-focus'
import {PopupTestHelper} from './popup-test-helper'

type ITab = chrome.tabs.Tab

interface IProps {
  element: HTMLElement
}

let testHelper: undefined | PopupTestHelper
if (E2E) {
  testHelper = new PopupTestHelper()
}

export function Popup({element}: IProps) {
  const {store, syncStoreWithBackground, openPopup, closePopup, selectNextTab} = createPopupStore()
  // Prevents auto switching when the popup is opened.
  let isSettingsDemo = false
  // Stores the last active element before the popup was opened.
  const selectionAndFocus = new SelectionAndFocus()
  let cleanUpListeners = () => {}
  let disposeAutoSwitchingTimeout: () => void = () => {}

  onMount(() => {
    log(`[start switcher]`)
    cleanUpListeners = setUpListeners()
    chrome.runtime.sendMessage(contentScriptStarted())
  })

  onCleanup(() => {
    log(`[stop switcher]`)
    cleanUpListeners()
    disposeAutoSwitchingTimeout()
    chrome.runtime.sendMessage(contentScriptStopped())
  })

  createEffect(() => {
    log(`[render switcher]`)
    if (store.isOpen) {
      selectionAndFocus.saveState()
      showOverlay()
      testHelper?.popupShown()
    } else {
      element.style.display = 'none'
      selectionAndFocus.apply()
    }
  })

  return (
    <>
      <style>{styles}</style>
      <Show when={store.isOpen}>
        <div class="overlay">
          <div class="card" classList={{card_dark: store.settings.isDarkTheme}} data-test="card">
            <For each={store.tabs}>
              {(tab, index) => (
                <PopupTab
                  tab={tab}
                  isFirst={index() === 0}
                  isLast={index() === store.tabs.length - 1}
                  isSelected={index() === store.selectedTabIndex}
                  isTimeoutShown={index() === store.selectedTabIndex && !document.hasFocus()}
                  onClick={() => {
                    switchTo(tab)
                  }}
                  textScrollSpeed={store.settings.textScrollSpeed}
                  textScrollDelay={store.settings.textScrollDelay}
                />
              )}
            </For>
          </div>
        </div>
      </Show>
    </>
  )

  // NOTE:
  //  Placing functions after the return statement divides the code in two distinct parts:
  //  - Synchronous part that creates the component.
  //  - Asynchronous part that handles changes during the component lifecycle.
  //  By placing the structure and sync logic of at the start and all
  //  minor details like event handlers at the end we achieve better clarity.

  function setStylePropertiesThatDependOnPageZoom() {
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

  function showOverlay() {
    element.style.display = 'block'
    element.style.setProperty('--popup-opacity', `${store.settings.opacity / 100}`)
    element.style.setProperty(
      '--time-auto-switch-timeout',
      `${store.settings.autoSwitchingTimeout}ms`
    )
    setStylePropertiesThatDependOnPageZoom()
  }

  async function onWindowResize() {
    if (store.isOpen) {
      await syncStoreWithBackground()
      setStylePropertiesThatDependOnPageZoom()
    }
  }

  function switchTo(selectedTab: ITab) {
    chrome.runtime.sendMessage(switchTab(selectedTab))
    closePopup()
  }

  function setUpListeners() {
    element.addEventListener('click', onOverlayClick, {capture: true})
    window.addEventListener('keyup', onKeyUp, {capture: true})
    window.addEventListener('keydown', onKeyDown, {capture: true})
    window.addEventListener('blur', onWindowBlur, {capture: true})
    window.addEventListener('resize', onWindowResize, {capture: true})

    const messageListener = handleMessage({
      [Message.DEMO_SETTINGS]: async () => {
        isSettingsDemo = true
        await syncStoreWithBackground()
        openPopup()
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
        if (!document.hasFocus()) {
          disposeAutoSwitchingTimeout()

          const timeout = window.setTimeout(() => {
            switchTo(store.tabs[store.selectedTabIndex])
          }, store.settings.autoSwitchingTimeout)

          disposeAutoSwitchingTimeout = () => {
            window.clearTimeout(timeout)
          }
        }
      },
    })
    chrome.runtime.onMessage.addListener(messageListener)

    const disposeFixUnfocusedDocumentInPdfFiles = fixUnfocusedDocumentInPdfFiles()

    return () => {
      element.removeEventListener('click', onOverlayClick)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('blur', onWindowBlur)
      window.removeEventListener('resize', onWindowResize)
      chrome.runtime.onMessage.removeListener(messageListener)
      disposeFixUnfocusedDocumentInPdfFiles()
    }
  }

  function onOverlayClick(event: MouseEvent) {
    if (event.target === element) {
      closePopup()
    }
  }

  function onKeyDown(event: KeyboardEvent) {
    log(`[onKeyDown event]`, event)
    if (!store.isOpen) {
      return
    }
    const handlers: {[key: string]: () => void} = {
      Escape: () => closePopup(),
      Enter: () => switchTo(store.tabs[store.selectedTabIndex]),
      ArrowUp: () => selectNextTab(-1),
      ArrowDown: () => selectNextTab(1),
      Tab: () => selectNextTab(event.shiftKey ? -1 : 1),
    }
    const handler = handlers[event.key]
    if (handler) {
      handler()
      event.preventDefault()
      event.stopPropagation()
    }
  }

  function onKeyUp(event: KeyboardEvent): void {
    log(`[onKeyUp event]`, event)
    if (!store.isOpen || store.settings.isStayingOpen) {
      return
    }
    if (['Alt', 'Control', 'Meta'].includes(event.key)) {
      switchTo(store.tabs[store.selectedTabIndex])
      event.preventDefault()
      event.stopPropagation()
    }
  }

  function onWindowBlur(event: Event): void {
    if (event.target !== window || isSettingsDemo) {
      return
    }
    closePopup()
  }

  /**
   * When PDF file opens 'document.hasFocus() === false' which turns ON
   * the auto switching behaviour by timer.
   * This fix force focus the PDF embed element and solves the issue.
   * More on this:
   * https://stackoverflow.com/questions/58702747/window-events-with-pdf-document-via-chrome/75570258#75570258
   */
  function fixUnfocusedDocumentInPdfFiles(): () => void {
    if (document.contentType !== 'application/pdf') {
      return () => {}
    }
    const pdfElement = document.querySelector<HTMLEmbedElement>('embed[type="application/pdf"]')
    restoreFocus()
    pdfElement?.addEventListener('blur', restoreFocus)

    return () => {
      pdfElement?.removeEventListener('blur', restoreFocus)
    }

    function restoreFocus() {
      pdfElement?.focus()
    }
  }
}

export class PopupTabSwitcherElement extends HTMLElement {
  shadowRoot: ShadowRoot

  /**
   * Removes the SolidJS element from the DOM.
   */
  private disposeRoot: () => void

  /**
   * Stops listening to the disconnection of the element from the DOM.
   */
  private disposeDisconnectionListener: () => void

  constructor() {
    super()
    this.attachShadow({mode: 'open'})
  }

  /**
   * Fires when the custom element is disconnected from the DOM.
   */
  disconnectedCallback() {
    log('[disconnectedCallback]')
    this.disposeDisconnectionListener()
    this.disposeRoot()
  }

  /**
   * Fires when the custom element is connected to the DOM.
   */
  connectedCallback() {
    this.disposeDisconnectionListener = this.initDisconnectionListener()
    // We can't render instantly in the constructor because the custom element
    // should not have properties before it is created.
    this.disposeRoot = render(() => <Popup element={this} />, this.shadowRoot)
  }

  /**
   * Safety measure that tracks the disconnection of the element from the DOM, even in cases when
   * the `disconnectedCallback` is not called. It happens when the element is removed from the DOM
   * by the external script. The external script is a script that was not injected by the extension.
   * It may be:
   * - a page script that already exists on the page.
   * - another extension. Including the different version of the Popup Tab Switcher extension.
   */
  initDisconnectionListener(): () => void {
    const observer = new MutationObserver((records) => {
      log(`[mutation records]`, records)
      if (!this.parentNode) {
        this.disconnectedCallback()
      }
    })

    observer.observe(document.body, {
      childList: true,
    })

    return () => {
      observer.disconnect()
    }
  }
}

export function initPopupTabSwitcher(): void {
  const id = 'popup-tab-switcher'
  const existingEl = document.getElementById(id)
  if (existingEl) {
    existingEl.remove()
  }
  // NOTE:
  // Registered custom element can't use the same name in a subsequent registration
  // using define() method. That is why we need to generate a new name by mixing
  // a random number to it.
  const name = `${id}-${uuid()}`
  customElements.define(name, PopupTabSwitcherElement)
  const tabSwitcherElement = document.createElement(name)
  tabSwitcherElement.id = id
  document.body.append(tabSwitcherElement)
}

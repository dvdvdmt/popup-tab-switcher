import browser from 'webextension-polyfill'
import {For, render, Show} from 'solid-js/web'
import {createEffect, onCleanup, onMount} from 'solid-js'
import styles from './popup-tab-switcher.scss'
import {handleMessage, initialized, Message, switchTab} from '../utils/messages'
import {log} from '../utils/logger'
import {createPopupStore} from './popup-store'
import {TabComponent} from './tab-component'

type ITab = chrome.tabs.Tab

interface IProps {
  element: HTMLElement
}

export function PopupTabSwitcher({element}: IProps) {
  const {store, syncStoreWithBackground, openPopup, closePopup, selectNextTab} = createPopupStore()
  let isSettingsDemo = false
  let lastActiveElement: Element | null = null
  let cleanUpListeners = () => {}

  onMount(() => {
    log(`[init switcher]`)
    cleanUpListeners = setUpListeners()
    browser.runtime.sendMessage(initialized())
  })

  onCleanup(() => {
    log(`[remove switcher]`)
    cleanUpListeners()
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

  // NOTE:
  //  Placing functions them after the return statement divides the code in two distinct parts:
  //  - Synchronous part that creates the component.
  //  - Asynchronous part that handles changes during the component lifecycle.
  //  By placing the structure and sync logic of the component at the start and all
  //  minor details like event handlers at the end of the file we achieve better clarity.

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
    browser.runtime.sendMessage(switchTab(selectedTab))
    closePopup()
  }

  function setUpListeners() {
    element.addEventListener('click', onOverlayClick)
    window.addEventListener('keyup', onKeyUp)
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('blur', onWindowBlur)
    window.addEventListener('resize', onWindowResize)

    const messageListener = handleMessage({
      [Message.DEMO_SETTINGS]: async () => {
        isSettingsDemo = true
        await syncStoreWithBackground()
        openPopup()
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

    return () => {
      element.removeEventListener('click', onOverlayClick)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('blur', onWindowBlur)
      window.removeEventListener('resize', onWindowResize)
      browser.runtime.onMessage.removeListener(messageListener)
    }
  }

  function onOverlayClick(event: MouseEvent) {
    if (event.target === element) {
      closePopup()
    }
  }

  function onKeyDown(event: KeyboardEvent) {
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
    if (!store.isOpen || store.settings.isStayingOpen) {
      return
    }
    if (['Alt', 'Control', 'Meta'].includes(event.key)) {
      switchTo(store.tabs[store.selectedTabIndex])
      event.preventDefault()
      event.stopPropagation()
    }
  }

  function onWindowBlur(): void {
    if (isSettingsDemo) {
      return
    }
    closePopup()
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

export class PopupTabSwitcherElement extends HTMLElement {
  constructor() {
    super()
    this.attachShadow({mode: 'open'})
  }
}

export function initPopupTabSwitcher(): void {
  // TODO: restore proper redefinition of custom element that was removed.
  //  Because custom element can't use the same name in define method we need to
  //  generate new name for each redefinition. That is why we mixing a random
  //  number into the name.
  const name = 'popup-tab-switcher'
  const existingEl = document.querySelector(name)
  if (existingEl) {
    existingEl.remove()
  } else {
    customElements.define(name, PopupTabSwitcherElement)
  }
  const tabSwitcherEl = document.createElement(name)
  render(() => <PopupTabSwitcher element={tabSwitcherEl} />, tabSwitcherEl.shadowRoot!)
  document.body.append(tabSwitcherEl)
}
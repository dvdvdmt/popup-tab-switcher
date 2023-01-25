import assert from 'assert'
import {HelperPage, PuppeteerPopupHelper} from './utils/puppeteer-popup-helper'
import {defaultSettings} from '../src/utils/settings'
import {
  closeTabs,
  startPuppeteer,
  stopPuppeteer,
  timeoutDurationMS,
  waitFor,
} from './utils/puppeteer-utils'
import {e2eReloadExtension, e2eSetZoom} from '../src/utils/messages'

let helper: PuppeteerPopupHelper

describe('popup', function TestPopup() {
  this.timeout(timeoutDurationMS)

  before(() =>
    startPuppeteer().then((res) => {
      helper = res.helper
    })
  )

  after(stopPuppeteer)

  context('one page', () => {
    after(closeTabs)

    async function popupOpens(page: HelperPage) {
      await helper.selectTabForward()
      await page.isVisible('#popup-tab-switcher')
    }

    it('opens on "Alt+Y"', async () => {
      const page = await helper.openPage('wikipedia.html')
      await popupOpens(page)
      // Works after page reload
      await popupOpens(await helper.openPage('wikipedia.html', page))
    })

    it('opens on "Alt+Y" even if the page has popup-tab-switcher element', async () => {
      const page = await helper.openPage('page-with-popup-tab-switcher.html')
      await popupOpens(page)
    })

    it('opens on file pages', async () => {
      await popupOpens(await helper.openPage('file.png'))
      await popupOpens(await helper.openPage('file.js'))
    })

    it('hides on "Alt" release', async () => {
      const page = await helper.openPage('wikipedia.html')
      await popupOpens(page)
      await page.keyboard.up('Alt')
      const display = await page.$eval('#popup-tab-switcher', (popup) =>
        getComputedStyle(popup).getPropertyValue('display')
      )
      assert.strictEqual(display, 'none', 'popup hidden')
    })

    it('hides the popup if a user selects other tab in a browser top bar', async () => {
      // the closing behaviour is based on a blur event
      const pageWikipedia = await helper.openPage('wikipedia.html')
      await helper.selectTabForward()
      await pageWikipedia.evaluate(() => {
        window.dispatchEvent(new Event('blur'))
      })

      const display = await pageWikipedia.$eval(
        '#popup-tab-switcher',
        (el) => getComputedStyle(el).display
      )
      assert.strictEqual(display, 'none', 'The popup is closed')
    })
  })

  context('many pages', () => {
    afterEach(closeTabs)

    it('adds visited pages to the registry in correct order', async () => {
      const expectedTexts = ['Stack Overflow', 'Example', 'Wikipedia']
      await helper.openPage('wikipedia.html')
      await helper.openPage('example.html')
      const pageStOverflow = await helper.openPage('stackoverflow.html')
      await helper.selectTabForward()
      const elTexts = await pageStOverflow.queryPopup('.tab', (els) =>
        els.map((el) => el.textContent)
      )
      assert.deepStrictEqual(elTexts, expectedTexts, '3 tabs were added')
    })

    it(`restores visited pages order after the background worker restart`, async () => {
      // Open multiple tabs.
      await helper.openPage('wikipedia.html')
      const pageExample1 = await helper.openPage('example.html')
      await pageExample1.evaluate(() => {
        document.title = 'Example 1'
      })
      const pageStOverflow = await helper.openPage('stackoverflow.html')
      const pageExample2 = await helper.openPage('example.html')
      await pageExample2.evaluate(() => {
        document.title = 'Example 2'
      })
      await helper.openPage('links.html')
      // Send command to reload the extension to simulate web worker shut down.
      await pageExample1.bringToFront()
      await pageStOverflow.bringToFront()
      await helper.sendMessage(e2eReloadExtension())
      await helper.selectTabForward()
      const elTexts = await pageStOverflow.queryPopup('.tab', (els) =>
        els.map((el) => el.textContent)
      )
      assert.deepStrictEqual(
        elTexts,
        ['Stack Overflow', 'Example 1', 'Links', 'Example 2', 'Wikipedia'],
        'The history of visited pages is not preserved after the extension reload.'
      )
    })

    it('updates tab list on closing open tabs', async () => {
      const expectedTexts = ['Stack Overflow', 'Wikipedia']
      await helper.openPage('wikipedia.html')
      const pageExample = await helper.openPage('example.html')
      const pageStOverflow = await helper.openPage('stackoverflow.html')
      await pageExample.close()
      await helper.selectTabForward()
      const elTexts = await pageStOverflow.queryPopup('.tab', (els) =>
        els.map((el) => el.textContent)
      )
      assert.deepStrictEqual(elTexts, expectedTexts, '2 tabs were left')
    })

    it('selects proper tab names in the popup', async () => {
      await helper.openPage('wikipedia.html')
      const pageExample = await helper.openPage('example.html')
      const pageStOverflow = await helper.openPage('stackoverflow.html')
      await helper.selectTabForward()
      let elText = await pageStOverflow.queryPopup('.tab_selected', ([el]) => el.textContent)
      assert.strictEqual(elText, 'Example')
      await helper.selectTabForward()
      elText = await pageStOverflow.queryPopup('.tab_selected', ([el]) => el.textContent)
      assert.strictEqual(elText, 'Wikipedia')
      await helper.selectTabForward()
      elText = await pageStOverflow.queryPopup('.tab_selected', ([el]) => el.textContent)
      assert.strictEqual(elText, 'Stack Overflow')
      await helper.switchToSelectedTab()
      await helper.selectTabBackward()
      elText = await pageStOverflow.queryPopup('.tab_selected', ([el]) => el.textContent)
      assert.strictEqual(elText, 'Wikipedia')
      await helper.selectTabBackward()
      elText = await pageStOverflow.queryPopup('.tab_selected', ([el]) => el.textContent)
      assert.strictEqual(elText, 'Example')
      await helper.selectTabBackward() // Stack Overflow is selected
      await pageExample.close()
      await helper.selectTabForward()
      elText = await pageStOverflow.queryPopup('.tab_selected', ([el]) => el.textContent)
      assert.strictEqual(elText, 'Wikipedia')
    })

    it('switches between tabs on Alt release', async () => {
      await helper.openPage('wikipedia.html')
      await helper.openPage('example.html')
      await helper.openPage('stackoverflow.html')
      let activeTab = await helper.switchTab()
      let elText = await activeTab.$eval('title', (el) => el.textContent)
      assert.strictEqual(elText, 'Example')
      activeTab = await helper.switchTab()
      elText = await activeTab.$eval('title', (el) => el.textContent)
      assert.strictEqual(elText, 'Stack Overflow')
      activeTab = await helper.switchTab(2)
      elText = await activeTab.$eval('title', (el) => el.textContent)
      assert.strictEqual(elText, 'Wikipedia')
      activeTab = await helper.switchTab(3)
      elText = await activeTab.$eval('title', (el) => el.textContent)
      assert.strictEqual(elText, 'Wikipedia')
      activeTab = await helper.switchTab(2)
      elText = await activeTab.$eval('title', (el) => el.textContent)
      assert.strictEqual(elText, 'Example')
    })

    it('switches to previously opened tab when current one closes', async () => {
      const pageWikipedia = await helper.openPage('wikipedia.html')
      const pageExample = await helper.openPage('example.html')
      await helper.openPage('stackoverflow.html')
      await pageWikipedia.bringToFront()
      // TODO:
      //  Need to react on handleTabActivation data.tabId than use getActive() because at the time
      //  of handleTabActivation execution the activeTab is already set to 'example.html'
      await pageWikipedia.close()
      await waitFor(100)
      let activeTab = await helper.getActivePage()
      let elText = await activeTab.$eval('title', (el) => el.textContent)
      assert.strictEqual(elText, 'Stack Overflow')
      await helper.openPage('wikipedia.html')
      await pageExample.bringToFront()
      await pageExample.close()
      await waitFor(100)
      activeTab = await helper.getActivePage()
      elText = await activeTab.$eval('title', (el) => el.textContent)
      assert.strictEqual(elText, 'Wikipedia')
    })

    it.skip(`switches instantly or after a timeout if the page can't show the popup`, async () => {
      /*
        Examples of the pages that can't show the switcher are:
        - Utility pages like Settings, History, New tab, etc.
        - Broken or non-existent pages with a message like "This site can't be reached".
        - Slowly loading pages or those that were broken during the load.
          These include errors like ERR_INVALID_CHUNKED_ENCODING when the DOM was not created.
       Currently, it is impossible to test the switching from such pages because they don't allow
       content script initialization which is crucial to simulate keyboard pressings with sendCommandOnShortcut()
      */
    })

    it('focuses previously active window on a tab closing', async () => {
      /*
      opens Wikipedia in first window
      opens Example in second window
      opens Stack in third window
      opens File in first window
      closes File -> Stack is focused
      closes Stack -> Example is focused
      closes Example -> Wikipedia is focused
      */
      const pageWikipedia = await helper.openPage('wikipedia.html')
      const pageExample = await helper.openPageAsPopup('example.html')
      const pageStOverflow = await helper.openPageAsPopup('stackoverflow.html')
      const pageFile = await helper.openPage('file.js')
      await pageFile.close()
      await pageStOverflow.evaluate(() => window.e2e.isPageFocused())
      await pageStOverflow.close()
      await pageExample.evaluate(() => window.e2e.isPageFocused())
      await pageExample.close()
      await pageWikipedia.evaluate(() => window.e2e.isPageFocused())
    })

    it('switches to the tab that was clicked', async () => {
      await helper.openPage('wikipedia.html')
      await helper.openPage('example.html')
      const pageStOverflow = await helper.openPage('stackoverflow.html')
      await helper.selectTabForward()
      await pageStOverflow.queryPopup('.tab:nth-child(3)', ([el]) => {
        el.click()
      })

      await pageStOverflow.keyboard.up('Alt')
      const activeTab = await helper.getActivePage()
      const elText = await activeTab.$eval('title', (el) => el.textContent)
      assert.strictEqual(elText, 'Wikipedia', 'switches to the clicked tab')
    })

    it('pressing ESC stops switching', async () => {
      await helper.openPage('wikipedia.html')
      await helper.openPage('example.html')
      const pageStOverflow = await helper.openPage('stackoverflow.html')
      await helper.selectTabForward()
      await pageStOverflow.keyboard.press('Escape')
      const isPopupClosed = await pageStOverflow.isNotVisible('#popup-tab-switcher')
      assert(isPopupClosed, 'hides on pressing Esc button')
      await pageStOverflow.keyboard.up('Alt')
      const activeTab = await helper.getActivePage()
      const elText = await activeTab.$eval('title', (el) => el.textContent)
      assert.strictEqual(elText, 'Stack Overflow', 'stays on the same tab')
    })

    it('switches between windows', async () => {
      await helper.openPage('wikipedia.html')
      await helper.openPage('example.html')
      await helper.openPageAsPopup('stackoverflow.html')

      let activeTab = await helper.switchTab()
      let title = await activeTab.evaluate(() => document.title)
      assert.strictEqual(title, 'Example')

      activeTab = await helper.switchTab()
      title = await activeTab.evaluate(() => document.title)
      assert.strictEqual(title, 'Stack Overflow')

      activeTab = await helper.switchTab(2)
      title = await activeTab.evaluate(() => document.title)
      assert.strictEqual(title, 'Wikipedia')
    })

    it('stores unlimited number of opened tabs in history', async () => {
      const pages = [await helper.openPage('wikipedia.html')]
      const numberOfTabsToOpen = defaultSettings.numberOfTabsToShow + 3
      for (let i = 0; i < numberOfTabsToOpen; i += 1) {
        // We need to open tabs with focusing on them to populate tab registry
        // eslint-disable-next-line no-await-in-loop
        pages.push(await helper.openPage('example.html'))
      }
      await helper.selectTabForward()
      let activeTab = await helper.getActivePage()
      let numberOfShownTabs = await activeTab.queryPopup('.tab', (els) => els.length)
      assert.strictEqual(
        numberOfShownTabs,
        defaultSettings.numberOfTabsToShow,
        'The number of shown tabs is correct'
      )
      const closingPagesPromises = []
      for (let i = pages.length - 1; i > 2; i -= 1) {
        closingPagesPromises.push(pages[i].close())
      }
      await Promise.all(closingPagesPromises)
      await helper.selectTabForward()
      activeTab = await helper.getActivePage()
      numberOfShownTabs = await activeTab.queryPopup('.tab', (els) => els.length)
      assert.strictEqual(
        numberOfShownTabs,
        3,
        'The number of shown tabs is correct after closing multiple tabs'
      )
      const tabTitle = await activeTab.queryPopup('.tab:nth-child(3)', ([el]) => el.textContent)
      assert.strictEqual(tabTitle, 'Wikipedia')
    })

    it('selects tabs with Up/Down arrow keys and switches to them by Enter', async () => {
      await helper.openPage('wikipedia.html')
      await helper.openPage('example.html')
      const pageStOverflow = await helper.openPage('stackoverflow.html')
      await helper.selectTabForward()
      await pageStOverflow.keyboard.press('ArrowDown')
      let elText = await pageStOverflow.queryPopup('.tab_selected', ([el]) => el.textContent)
      assert.strictEqual(elText, 'Wikipedia')
      await pageStOverflow.keyboard.press('ArrowDown')
      elText = await pageStOverflow.queryPopup('.tab_selected', ([el]) => el.textContent)
      assert.strictEqual(elText, 'Stack Overflow')
      await pageStOverflow.keyboard.press('ArrowDown')
      elText = await pageStOverflow.queryPopup('.tab_selected', ([el]) => el.textContent)
      assert.strictEqual(elText, 'Example')
      await pageStOverflow.keyboard.press('ArrowUp')
      await pageStOverflow.keyboard.press('ArrowUp')
      elText = await pageStOverflow.queryPopup('.tab_selected', ([el]) => el.textContent)
      assert.strictEqual(elText, 'Wikipedia')
      await pageStOverflow.keyboard.press('Enter')
      const activeTab = await helper.getActivePage()
      elText = await activeTab.$eval('title', (el) => el.textContent)
      assert.strictEqual(elText, 'Wikipedia')
    })

    it('selects tabs with Tab or Shift+Tab and switches to them by Enter', async () => {
      await helper.openPage('wikipedia.html')
      await helper.openPage('example.html')
      const pageStOverflow = await helper.openPage('stackoverflow.html')
      await helper.selectTabForward()
      await pageStOverflow.keyboard.press('Tab')
      let elText = await pageStOverflow.queryPopup('.tab_selected', ([el]) => el.textContent)
      assert.strictEqual(elText, 'Wikipedia')
      await pageStOverflow.keyboard.press('Tab')
      elText = await pageStOverflow.queryPopup('.tab_selected', ([el]) => el.textContent)
      assert.strictEqual(elText, 'Stack Overflow')
      await pageStOverflow.keyboard.press('Tab')
      elText = await pageStOverflow.queryPopup('.tab_selected', ([el]) => el.textContent)
      assert.strictEqual(elText, 'Example')
      await pageStOverflow.keyboard.down('Shift')
      await pageStOverflow.keyboard.press('Tab')
      await pageStOverflow.keyboard.press('Tab')
      elText = await pageStOverflow.queryPopup('.tab_selected', ([el]) => el.textContent)
      assert.strictEqual(elText, 'Wikipedia')
      await pageStOverflow.keyboard.press('Enter')
      const activeTab = await helper.getActivePage()
      elText = await activeTab.$eval('title', (el) => el.textContent)
      assert.strictEqual(elText, 'Wikipedia')
    })

    it('sets focus back to a previously focused element and cursor position', async () => {
      const pageWikipedia = await helper.openPage('wikipedia.html')
      await pageWikipedia.focus('#searchInput')
      await pageWikipedia.keyboard.type('Hello World!')
      await pageWikipedia.keyboard.down('Shift')
      const moveCursorLeftPromises = []
      for (let i = 0; i < 7; i += 1) {
        moveCursorLeftPromises.push(pageWikipedia.keyboard.press('ArrowLeft'))
      }
      await Promise.all(moveCursorLeftPromises)
      await pageWikipedia.keyboard.up('Shift')
      await helper.selectTabForward()
      await helper.selectTabForward()
      await pageWikipedia.keyboard.press('Escape')
      const focusedEl = await pageWikipedia.evaluate(() => {
        const {id, selectionStart, selectionEnd, selectionDirection} =
          document.activeElement as HTMLInputElement
        return {
          id,
          selectionStart,
          selectionEnd,
          selectionDirection,
        }
      })
      assert.strictEqual(focusedEl.id, 'searchInput')
      assert.strictEqual(focusedEl.selectionStart, 5)
      assert.strictEqual(focusedEl.selectionEnd, 12)
      assert.strictEqual(focusedEl.selectionDirection, 'backward')
    })

    it('restores focus without breaking switching', async () => {
      const errors: Error[] = []
      await helper.openPage('example.html')
      const pageWithInputs = await helper.openPage('non-selectable-inputs.html')
      pageWithInputs.on('pageerror', (err) => {
        errors.push(err)
      })
      await pageWithInputs.focus('#dewey')
      await helper.switchTab()
      let activeTab = await helper.getActivePage()
      let tabTitle = await activeTab.$eval('title', (el) => el.textContent)
      assert.strictEqual('Example', tabTitle, 'focus on radio button does not prevent switching')

      await pageWithInputs.bringToFront()
      await pageWithInputs.focus('#manual-mode')
      await helper.switchTab()
      activeTab = await helper.getActivePage()
      tabTitle = await activeTab.$eval('title', (el) => el.textContent)
      assert.strictEqual('Example', tabTitle, 'focus on checkbox does not prevent switching')

      const [firstError] = errors
      if (firstError) {
        throw firstError
      }
    })

    it(`prevents scrolling on focus restoration`, async () => {
      const page = await helper.openPage('stackoverflow.html')
      const scrollY = await page.evaluate(() => {
        document.querySelector<HTMLElement>('#stack-exchange-link')!.focus()
        window.scrollBy(0, document.body.scrollHeight)
        return window.scrollY
      })
      await helper.selectTabForward()
      await page.keyboard.press('Escape')
      const scrollYNew = await page.evaluate(() => window.scrollY)
      assert.strictEqual(scrollY, scrollYNew, 'The page was scrolled back')
    })

    it('switches on any modifier (Alt, Control, Command) keyup event', async () => {
      await helper.openPage('wikipedia.html')
      await helper.openPage('example.html')
      let activeTab = await helper.getActivePage()
      await activeTab.keyboard.down('Control')
      await activeTab.keyboard.press('KeyY')
      await activeTab.keyboard.up('Control')
      activeTab = await helper.getActivePage()
      let tabTitle = await activeTab.$eval('title', (el) => el.textContent)
      assert.strictEqual('Wikipedia', tabTitle)
      await activeTab.keyboard.down('Meta') // Command or Windows key
      await activeTab.keyboard.press('KeyY')
      await activeTab.keyboard.up('Meta')
      activeTab = await helper.getActivePage()
      tabTitle = await activeTab.$eval('title', (el) => el.textContent)
      assert.strictEqual('Example', tabTitle)
    })

    it('works in pages with iframe', async () => {
      await helper.openPage('wikipedia.html')
      const pageWithIframe = await helper.openPage('page-with-iframe.html')
      const frame = await pageWithIframe.$('iframe').then((handle) => handle?.contentFrame())
      await frame?.focus('input')
      let activeTab = await helper.switchTab()
      let tabTitle = await activeTab.$eval('title', (el) => el.textContent)
      assert.strictEqual('Wikipedia', tabTitle)
      activeTab = await helper.switchTab()
      tabTitle = await activeTab.$eval('title', (el) => el.textContent)
      assert.strictEqual('Page with iframe', tabTitle)
    })

    it('adds tabs opened by Ctrl+Click to the registry', async () => {
      const pageWithLinks = await helper.openPage('links.html')
      await helper.openPageByClickOnHyperlink(pageWithLinks, '#wikipedia')
      await helper.openPageByClickOnHyperlink(pageWithLinks, '#stack')
      await helper.openPageByClickOnHyperlink(pageWithLinks, '#example')
      await helper.selectTabForward()
      const elTexts = await pageWithLinks.queryPopup('.tab', (els) =>
        els.map((el) => el.textContent)
      )
      const expectedTexts = ['Links', 'Example', 'Stack Overflow', 'Wikipedia']
      assert.deepStrictEqual(elTexts, expectedTexts, 'background tabs were added')
    })

    it(`preserves look on different zoom levels and window sizes`, async () => {
      async function getCardRect(page: HelperPage) {
        return page.queryPopup(`[data-test-id=pts__card]`, ([el]) => {
          const rect = el.getBoundingClientRect()
          return {width: rect.width, height: rect.height}
        })
      }
      const zoomFactor = 2
      const windowInitialWidth = 1000
      const windowInitialHeight = 800
      const cardInitialWidth = 436
      const cardInitialHeight = 280
      const cardZoomedWidth = cardInitialWidth / zoomFactor
      const cardZoomedHeight = cardInitialHeight / zoomFactor
      const page = await helper.openPage('example.html')
      await helper.resizeWindow(windowInitialWidth, windowInitialHeight)
      await helper.selectTabForward()
      let cardRect = await getCardRect(page)

      assert.strictEqual(
        cardRect.width,
        cardInitialWidth,
        'Card has invalid width on initial zoom and window size'
      )
      assert.strictEqual(
        cardRect.height,
        cardInitialHeight,
        'Card has invalid height on initial zoom and window size'
      )

      const newWidth = 600
      const newHeight = 600
      await helper.resizeWindow(newWidth, newHeight)
      cardRect = await getCardRect(page)

      assert.strictEqual(
        cardRect.width,
        cardInitialWidth,
        'Card has invalid width on initial zoom and new window size'
      )
      assert.strictEqual(
        cardRect.height,
        cardInitialHeight,
        'Card has invalid height on initial zoom and new window size'
      )

      await helper.resizeWindow(windowInitialWidth, cardInitialHeight)
      await helper.sendMessage(e2eSetZoom(zoomFactor))
      await waitFor(200)
      cardRect = await getCardRect(page)

      assert.strictEqual(
        cardRect.width,
        cardZoomedWidth,
        'Card has invalid width on double zoom and initial window size'
      )
      assert.strictEqual(
        cardRect.height,
        cardZoomedHeight,
        'Card has invalid height on double zoom and initial window size'
      )

      await helper.resizeWindow(windowInitialWidth, cardInitialHeight)
      cardRect = await getCardRect(page)

      assert.strictEqual(
        cardRect.width,
        cardZoomedWidth,
        'Card has invalid width on double zoom and new window size'
      )
      assert.strictEqual(
        cardRect.height,
        cardZoomedHeight,
        'Card has invalid height on double zoom and new window size'
      )

      await helper.sendMessage(e2eSetZoom(1))
      await waitFor(200)
      cardRect = await getCardRect(page)

      assert.strictEqual(
        cardRect.width,
        cardInitialWidth,
        'Card has invalid width on initial zoom and new window size'
      )
      assert.strictEqual(
        cardRect.height,
        cardInitialHeight,
        'Card has invalid height on initial zoom and new window size'
      )
    })
  })
})

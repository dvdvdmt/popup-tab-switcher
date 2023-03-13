import assert from 'assert'
import {startPuppeteer, stopPuppeteer, timeoutDurationMS} from '../utils/puppeteer-utils'
import {PuppeteerPopupHelper} from '../utils/puppeteer-popup-helper'
import {contentScript} from '../selectors/content-script'

/**
 * The focus or selection of the text on a page should be restored after the popup is closed.
 */
describe('Selection restoration', function () {
  let helper: PuppeteerPopupHelper
  this.timeout(timeoutDurationMS)

  before(() =>
    startPuppeteer().then((res) => {
      helper = res.helper
    })
  )

  after(stopPuppeteer)

  it(`returns focus to the initially focused element`, async () => {
    // Given the focused button.
    const page = await helper.openPage('selection-restoration.html')
    await page.focus('#fourth-button')

    // When the popup is opened and closed.
    await helper.selectTabForward()
    await page.isVisible(contentScript.root)
    await page.keyboard.press('Escape')

    // Then the button should be focused.
    assert.strictEqual(await page.evaluate(() => document.activeElement?.id), 'fourth-button')
  })

  it(`restores selection of the non-editable text`, async () => {
    // Given the selected text.
    const page = await helper.openPage('selection-restoration.html')
    await page.evaluate(() => {
      const element = document.querySelector('#non-editable-text')
      if (element) {
        const range = document.createRange()
        range.selectNodeContents(element)
        const selection = window.getSelection()
        if (selection) {
          selection.removeAllRanges()
          selection.addRange(range)
        }
      }
    })

    // When the popup is opened and closed.
    await helper.selectTabForward()
    await page.isVisible(contentScript.root)
    await page.mouse.click(0, 0)

    // Then the text should be selected.
    assert.strictEqual(
      await page.evaluate(() => window.getSelection()?.toString()),
      `If you put off everything till you're sure of it, you'll never get anything done.`
    )
  })

  it(`restores selection of the text in "input" element`, async () => {
    // Given the selected text in the "input" element.
    const page = await helper.openPage('selection-restoration.html')
    await page.focus('#input')
    await page.keyboard.down('Shift')
    await page.keyboard.press('ArrowRight')
    await page.keyboard.press('ArrowRight')
    await page.keyboard.press('ArrowRight')
    await page.keyboard.up('Shift')

    // When the popup is opened and closed.
    await helper.selectTabForward()
    await page.isVisible(contentScript.root)
    await page.mouse.click(0, 0)

    // Then the text should be selected.
    assert.strictEqual(await page.evaluate(() => window.getSelection()?.toString()), `Hel`)
  })

  it(`restores selection of the text in "textarea" element`, async () => {
    // Given the selected text in the "textarea" element.
    const page = await helper.openPage('selection-restoration.html')
    await page.focus('#textarea')
    await page.keyboard.press('End')
    await page.keyboard.down('Shift')
    await page.keyboard.press('ArrowLeft')
    await page.keyboard.press('ArrowLeft')
    await page.keyboard.press('ArrowLeft')
    await page.keyboard.up('Shift')

    // When the popup is opened and closed.
    await helper.selectTabForward()
    await page.isVisible(contentScript.root)
    await page.mouse.click(0, 0)

    // Then the text should be selected.
    assert.strictEqual(await page.evaluate(() => window.getSelection()?.toString()), `ld!`)
  })

  it(`restores selection of the text in "contenteditable" element`, async () => {
    // Given the selected text in the "contenteditable" element.
    const page = await helper.openPage('selection-restoration.html')
    await page.focus('#content-editable')
    await page.keyboard.down('Shift')
    await page.keyboard.press('ArrowRight')
    await page.keyboard.press('ArrowRight')
    await page.keyboard.press('ArrowRight')
    await page.keyboard.up('Shift')

    // When the popup is opened and closed.
    await helper.selectTabForward()
    await page.isVisible(contentScript.root)
    await page.mouse.click(0, 0)

    // Then the text should be selected.
    assert.strictEqual(await page.evaluate(() => window.getSelection()?.toString()), `Con`)
  })

  it(`restores selection of the text inside "iframe" element`, async () => {
    // Given the selected text inside the "iframe" element.
    const page = await helper.openPage('selection-restoration.html')
    const iframe = page.frames().find((frame) => frame.name() === 'iframe')!
    await iframe.focus('#iframe-input')
    await page.keyboard.down('Shift')
    await page.keyboard.press('ArrowRight')
    await page.keyboard.press('ArrowRight')
    await page.keyboard.press('ArrowRight')
    await page.keyboard.up('Shift')

    // When the popup is opened and closed.
    await helper.selectTabForward()
    await page.isVisible(contentScript.root)
    await page.mouse.click(0, 0)

    // Then the text should be selected.
    assert.strictEqual(await iframe.evaluate(() => window.getSelection()?.toString()), `Tex`)
    // The previous assertion is not enough to check the selection inside the iframe.
    // We need also check that the input is focused.
    assert.strictEqual(await iframe.evaluate(() => document.activeElement?.id), 'iframe-input')
  })
})

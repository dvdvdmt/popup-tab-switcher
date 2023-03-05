import {closeTabs, startPuppeteer, stopPuppeteer, timeoutDurationMS} from '../utils/puppeteer-utils'
import {PuppeteerPopupHelper} from '../utils/puppeteer-popup-helper'

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
  beforeEach(closeTabs)

  // Test cases:
  // returns focus to the initially focused element
  //   Given the focused button.
  //   When the popup is opened and closed.
  //   Then the button should be focused.
  //
  // restores selection of the non-editable text
  //   Given the selected text.
  //   When the popup is opened and closed.
  //   Then the text should be selected.
  //
  // restores selection of the text in "input" element
  //   Given the selected text in the "input" element.
  //   When the popup is opened and closed.
  //   Then the text should be selected.
  //
  // restores selection of the text in "textarea" element
  //   Given the selected text in the "textarea" element.
  //   When the popup is opened and closed.
  //   Then the text should be selected.
  //
  // restores selection of the text in "contenteditable" element
  //   Given the selected text in the "contenteditable" element.
  //   When the popup is opened and closed.
  //   Then the text should be selected.
  //
  // restores selection of the text inside "iframe" element
  //   Given the selected text inside the "iframe" element.
  //   When the popup is opened and closed.
  //   Then the text should be selected.
})

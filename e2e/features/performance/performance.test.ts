/* eslint-disable no-await-in-loop */
import assert from 'assert'
import {
  closeTabs,
  startPuppeteer,
  stopPuppeteer,
  timeoutDurationMS,
} from '../../utils/puppeteer-utils'
import {PuppeteerPopupHelper} from '../../utils/puppeteer-popup-helper'
import {contentScript} from '../../selectors/content-script'
import {getRenderingTime} from '../../../src/utils/messages'

describe(`Sharing`, function () {
  let helper: PuppeteerPopupHelper

  this.timeout(timeoutDurationMS)

  before(async () => {
    const res = await startPuppeteer()
    helper = res.helper
  })

  after(stopPuppeteer)

  afterEach(closeTabs)

  it('renders in an adequate time', async function () {
    if (process.env.CI) {
      // Performance tests are not stable in CI
      this.skip()
    }
    // Scenario:
    // 1. Navigate to the page.
    // 2. Open the popup. And save the rendering time.
    // 3. Repeat 1-2 for 50 times.
    // 4. Calculate the average rendering time.
    // 5. Assert that the average rendering time is less than 100ms.
    const maxNumberOfIterations = 50
    const maxRenderingTimeMs = 20
    const renderingTimes: number[] = []
    const page = await helper.openPage('stackoverflow.html')
    for (let i = 0; i < maxNumberOfIterations; i += 1) {
      await helper.selectTabForward()
      await page.isVisible(contentScript.root)
      const renderingTime = await helper.sendMessage(getRenderingTime())
      renderingTimes.push(renderingTime)
      await helper.openPage('stackoverflow.html', page)
    }
    const totalRenderingTime = renderingTimes.reduce((a, b) => a + b)
    const averageRenderingTimeMs =
      Math.round((totalRenderingTime / renderingTimes.length) * 100) / 100 // round number to 2 decimal places
    console.log(`Average rendering time is ${averageRenderingTimeMs}ms.`)
    assert(
      averageRenderingTimeMs < maxRenderingTimeMs,
      `Average rendering time should be less than ${maxRenderingTimeMs}ms.`
    )
  })
})

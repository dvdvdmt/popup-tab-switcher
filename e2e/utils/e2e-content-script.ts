import browser from 'webextension-polyfill'
import {IMessage} from '../../src/utils/messages'

declare global {
  interface Window {
    isE2EContentScriptRegistered: boolean
  }
}

if (!window.isE2EContentScriptRegistered) {
  window.addEventListener('message', async (e: MessageEvent<IMessage>) => {
    const isMessageFromPageScript = Boolean(e.data?.type)
    if (isMessageFromPageScript) {
      console.log(`[ContentScript: received message from PageScript]`, e.data)
      const response = await browser.runtime.sendMessage(e.data)
      window.postMessage(response, '*')
    }
  })
  window.isE2EContentScriptRegistered = true
}

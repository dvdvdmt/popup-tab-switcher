import browser from 'webextension-polyfill'
import {IMessagePackage} from './page-scripts/send-message'

declare global {
  interface Window {
    isE2EContentScriptRegistered: boolean
  }
}

if (!window.isE2EContentScriptRegistered) {
  window.addEventListener('message', async (e: MessageEvent<IMessagePackage>) => {
    if (e.data.sender === 'pageScript') {
      console.log(`[ContentScript: received a message from PageScript]`, e.data)
      const response = await browser.runtime.sendMessage(e.data.message)
      window.postMessage({sender: 'contentScript', response}, '*')
    }
  })
  window.isE2EContentScriptRegistered = true
}

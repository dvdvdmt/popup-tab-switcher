import browser from 'webextension-polyfill'
import {IMessageFromContentScript, IMessagePackage} from './page-scripts/send-message'

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
      const messageFrom: IMessageFromContentScript = {sender: 'contentScript', message: response}
      window.postMessage(messageFrom, '*')
    }
  })
  window.isE2EContentScriptRegistered = true
  console.log(`[ContentScript registered]`)
}

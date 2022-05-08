import browser from 'webextension-polyfill'
import {
  IMessageFromContentScript,
  IMessageFromNewContentScript,
  IMessagePackage,
} from './page-scripts/send-message'
import {IMessage, IMessageResponse, Message} from '../../src/utils/messages'

declare global {
  interface Window {
    isE2EContentScriptRegistered: boolean
  }
}

function messageFromMe(message: IMessageResponse<IMessage>): IMessageFromContentScript {
  return {sender: 'contentScript', message}
}

function messageFromNewMe(): IMessageFromNewContentScript {
  return {sender: 'newContentScript', message: undefined}
}

async function sendMessageToBackground(e: MessageEvent<IMessagePackage>): Promise<any> {
  let response: any
  try {
    response = await browser.runtime.sendMessage(e.data.message)
  } catch (err) {
    response = err
  }
  return response
}

async function messageHandler(e: MessageEvent<IMessagePackage>) {
  if (e.data.sender === 'pageScript') {
    console.log(`[ContentScript: received a message from PageScript]`, e.data)
    let response
    if (e.data.message.type === Message.E2E_RELOAD_EXTENSION) {
      // After the extension reloads this content script can't continue to work with the old context.
      // To prevent errors like "Extension context invalidated" we unsubscribe the content script from messages.
      await sendMessageToBackground(e)
      await waitForTheNewContentScriptRegistration()
    } else {
      response = await sendMessageToBackground(e)
    }
    window.postMessage(messageFromMe(response), '*')
  }
}

async function waitForTheNewContentScriptRegistration(): Promise<void> {
  return new Promise((resolve) => {
    const cleanupHandler = (e: MessageEvent<IMessagePackage>) => {
      if (e.data.sender === 'newContentScript') {
        // This means that new content script is ready to replace this one.
        window.removeEventListener('message', messageHandler)
        window.removeEventListener('message', cleanupHandler)
        resolve()
        console.log(`[ContentScript unregistered]`)
      }
    }
    window.addEventListener('message', cleanupHandler)
  })
}

if (!window.isE2EContentScriptRegistered) {
  window.postMessage(messageFromNewMe(), '*')
  window.addEventListener('message', messageHandler)
  window.isE2EContentScriptRegistered = true
  console.log(`[ContentScript registered]`)
}

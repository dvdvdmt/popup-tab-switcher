import {
  IMessageFromContentScript,
  IMessageFromNewContentScript,
  IMessagePackage,
} from './page-scripts/send-message'
import {
  IMessage,
  IMessageResponse,
  Message,
  sendMessageAndGetResponse,
} from '../../src/utils/messages'
import {log} from '../../src/utils/logger'

declare global {
  interface Window {
    isE2EContentScriptRegistered: boolean
  }
}

function messageFromMe(message: IMessageResponse<IMessage>, id: string): IMessageFromContentScript {
  return {sender: 'contentScript', id, message}
}

function messageFromNewMe(): IMessageFromNewContentScript {
  return {sender: 'newContentScript', message: undefined, id: ''}
}

async function sendMessageToBackground(e: MessageEvent<IMessagePackage>): Promise<any> {
  let response: any
  try {
    response = await sendMessageAndGetResponse(e.data.message as IMessage)
  } catch (err) {
    response = false
  }
  return response
}

async function messageHandler(e: MessageEvent<IMessagePackage>) {
  if (e.data.sender === 'pageScript') {
    log(`[ContentScript: received a message from PageScript]`, e.data)
    let response
    if (e.data.message.type === Message.E2E_RELOAD_EXTENSION) {
      // After the extension reloads this content script can't continue to work with the old context.
      // To prevent errors like "Extension context invalidated" we unsubscribe the content script from messages.
      await sendMessageToBackground(e)
      await waitForTheNewContentScriptRegistration()
    } else {
      response = await sendMessageToBackground(e)
    }
    window.postMessage(messageFromMe(response, e.data.id), '*')
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
        log(`[ContentScript unregistered]`)
      }
    }
    window.addEventListener('message', cleanupHandler)
  })
}

if (!window.isE2EContentScriptRegistered) {
  window.postMessage(messageFromNewMe(), '*')
  window.addEventListener('message', messageHandler)
  window.isE2EContentScriptRegistered = true
  log(`[ContentScript registered]`)
}

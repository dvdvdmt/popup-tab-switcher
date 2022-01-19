import {IMessage, IMessageResponse} from '../../../src/utils/messages'

export interface IMessageFromPageScript {
  sender: 'pageScript'
  message: IMessage
}

export interface IMessageFromContentScript {
  sender: 'contentScript'
  message: IMessageResponse<IMessage>
}

export type IMessagePackage = IMessageFromPageScript | IMessageFromContentScript

let promiseResolver: (message: IMessageResponse<IMessage>) => void = () => {}

/**
 * This function sends messages and receive responses from content script using window.postMessage API.
 * */
export function sendMessage<Message extends IMessage>(
  message: Message
): Promise<IMessageResponse<Message>> {
  return new Promise<IMessageResponse<Message>>((resolve) => {
    promiseResolver = resolve as typeof promiseResolver
    const messageFrom: IMessageFromPageScript = {sender: 'pageScript', message}
    window.postMessage(messageFrom, '*')
  })
}

export function initMessageListener() {
  window.addEventListener('message', (e: MessageEvent<IMessagePackage>) => {
    if (e.data.sender === 'contentScript') {
      console.log(`[PageScript: received a message from ContentScript]`, e.data.message)
      promiseResolver(e.data.message)
    }
  })
}

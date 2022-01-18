import {IMessage, IMessageResponse} from '../../../src/utils/messages'

interface IMessageFromPageScript {
  sender: 'pageScript'
  message: IMessage
}

interface IMessageFromContentScript {
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
    window.postMessage({sender: 'pageScript', message}, '*')
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

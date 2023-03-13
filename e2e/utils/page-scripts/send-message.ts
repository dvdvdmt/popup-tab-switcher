import {IMessage, IMessageResponse} from '../../../src/utils/messages'
import {log} from '../../../src/utils/logger'

export interface IMessageFromPageScript {
  sender: 'pageScript'
  id: string
  message: IMessage
}

export interface IMessageFromContentScript {
  sender: 'contentScript'
  id: string
  message: IMessageResponse<IMessage>
}

export interface IMessageFromNewContentScript {
  sender: 'newContentScript'
  id: string
  message: undefined
}

export type IMessagePackage =
  | IMessageFromPageScript
  | IMessageFromContentScript
  | IMessageFromNewContentScript

interface IMessageResolver {
  (message: IMessageResponse<IMessage>): void
}

const resolversMap = new Map<string, IMessageResolver>()

/**
 * This function sends messages and receive responses from content script using window.postMessage API.
 * It maps each response to the original request.
 */
export function sendMessage<Message extends IMessage>(
  message: Message
): Promise<IMessageResponse<Message>> {
  return new Promise<IMessageResponse<Message>>((resolve) => {
    const id = Math.random().toString()
    resolversMap.set(id, resolve as IMessageResolver)
    const messageFrom: IMessageFromPageScript = {
      sender: 'pageScript',
      id,
      message,
    }
    window.parent.postMessage(messageFrom, '*')
  })
}

export function initMessageListener() {
  window.addEventListener('message', (e: MessageEvent<IMessagePackage>) => {
    if (e.data.sender === 'contentScript') {
      log(`[PageScript: received a message from ContentScript]`, e.data.message)
      const resolver = resolversMap.get(e.data.id)
      if (!resolver) {
        log(`[PageScript: the resolver for the message is not found]`, e.data)
        return
      }
      resolver(e.data.message)
      resolversMap.delete(e.data.id)
    }
  })
}

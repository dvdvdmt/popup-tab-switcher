import {IMessage, IMessageResponse} from '../../../src/utils/messages'

let promiseResolver: (message: IMessageResponse<IMessage>) => void = () => {}

/**
 * This function sends messages and receive responses from content script using window.postMessage API.
 * */
export function sendMessage<Message extends IMessage>(
  message: Message
): Promise<IMessageResponse<Message>> {
  return new Promise<IMessageResponse<Message>>((resolve) => {
    promiseResolver = resolve as typeof promiseResolver
    window.postMessage(message, '*')
  })
}

window.addEventListener('message', (e: MessageEvent<IMessageResponse<IMessage>>) => {
  const isMessageFromContentScript = !e.data || (e.data && !('type' in e.data))
  if (isMessageFromContentScript) {
    console.log(`[ received message from content script]`, e.data)
    promiseResolver(e.data)
  }
})

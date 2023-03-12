import {sendMessage} from './send-message'
import {e2eIsMessagingReady} from '../../../src/utils/messages'

async function isMessagingReady(): Promise<boolean> {
  return sendMessage(e2eIsMessagingReady())
}

export function waitUntilMessagingIsReady(): Promise<void> {
  return new Promise(async (resolve, reject) => {
    if (await isMessagingReady()) {
      resolve()
    } else {
      testAgain(1, resolve, reject)
    }
  })

  function testAgain(attempt: number, resolve: () => void, reject: (reason: string) => void) {
    setTimeout(async () => {
      if (attempt >= 50) {
        reject(`The messaging is not initialized`)
      } else if (await isMessagingReady()) {
        resolve()
      } else {
        testAgain(attempt + 1, resolve, reject)
      }
    }, 10)
  }
}

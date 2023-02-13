import {ISettings} from '../../../src/utils/settings'
import {getModel} from '../../../src/utils/messages'
import {sendMessage} from './send-message'

export async function getSettings(): Promise<ISettings> {
  const {settings} = await sendMessage(getModel())
  return settings
}

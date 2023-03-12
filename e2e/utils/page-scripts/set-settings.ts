import {e2eSetSettings} from '../../../src/utils/messages'
import {sendMessage} from './send-message'
import {ISettings} from '../../../src/utils/settings'

// TODO: This can be replaced with sendMessage(e2eSetSettings(settings))
export async function setSettings(settings: Partial<ISettings>): Promise<void> {
  await sendMessage(e2eSetSettings(settings))
}

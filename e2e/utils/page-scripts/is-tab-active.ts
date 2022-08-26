import {e2eIsPageActive} from '../../../src/utils/messages'
import {sendMessage} from './send-message'

/** Gets active page using the Chrome extension runtime API.
 *  This is the most reliable way to get the currently focused page.
 *  The other methods like document.hasFocus() or Visibility API don't get the same stable result.
 */
export function isTabActive(): Promise<boolean> {
  return sendMessage(e2eIsPageActive())
}

import {popupShown} from '../utils/messages'

export class PopupTestHelper {
  popupShown() {
    chrome.runtime.sendMessage(popupShown())
  }
}

import '@webcomponents/custom-elements' // polyfill for custom elements
import {customElement} from 'solid-element'
import {PopupTabSwitcher} from './popup-tab-switcher'

const elementName = 'popup-tab-switcher'
const existingEl = document.querySelector(elementName)
if (existingEl) {
  existingEl.remove()
}
customElement(elementName, PopupTabSwitcher)
const tabSwitcherEl = document.createElement(elementName)
document.body.append(tabSwitcherEl)

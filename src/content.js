import '@webcomponents/custom-elements';
import PopupTabSwitcher from './PopupTabSwitcher';

const existingEl = document.querySelector('popup-tab-switcher');
if (existingEl) {
  existingEl.remove();
} else {
  customElements.define('popup-tab-switcher', PopupTabSwitcher);
}
const tabSwitcherEl = document.createElement('popup-tab-switcher');
document.body.append(tabSwitcherEl);

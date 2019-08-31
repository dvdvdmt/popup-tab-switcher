import '@webcomponents/custom-elements';
import uuid from './utils/uuid';
import PopupTabSwitcher from './popup-tab-switcher';

const existingEl = document.querySelector('#popup-tab-switcher');
if (existingEl) {
  existingEl.remove();
}

const id = uuid();
customElements.define(`popup-tab-switcher-${id}`, PopupTabSwitcher);
const tabSwitcherEl = document.createElement(`popup-tab-switcher-${id}`);
tabSwitcherEl.id = 'popup-tab-switcher';
document.body.append(tabSwitcherEl);

/* eslint-disable no-undef */
import './webcomponents-sd-ce';
import PopupTabSwitcher from './PopupTabSwitcher';

customElements.define('popup-tab-switcher', PopupTabSwitcher);
const tabSwitcherEl = document.createElement('popup-tab-switcher');
document.body.append(tabSwitcherEl);

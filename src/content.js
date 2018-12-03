/* eslint-disable no-undef */
const overlay = document.createElement('div');
overlay.className = 'popup-tab-switcher';
overlay.addEventListener('click', () => { overlay.style.display = 'none'; });

const card = document.createElement('div');
card.className = 'popup-tab-switcher__card';
card.textContent = 'Hello!';

overlay.append(card);
document.body.append(overlay);

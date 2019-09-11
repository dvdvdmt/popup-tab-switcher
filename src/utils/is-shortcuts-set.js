import browser from 'webextension-polyfill';
import {commands} from './constants';

export default async function isShortcutsSet() {
  const shortcuts = await browser.commands.getAll();
  const existingShortcuts = shortcuts
    .filter(({name, shortcut}) => shortcut && Object.values(commands).includes(name));
  return existingShortcuts.length === Object.keys(commands).length;
}

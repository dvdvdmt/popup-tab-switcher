import browser from 'webextension-polyfill'
import {Command} from './constants'

export default async function areShortcutsSet() {
  const shortcuts = await browser.commands.getAll()
  const existingShortcuts = shortcuts.filter(({shortcut}) => shortcut)
  // TODO: fixme
  return false
  return existingShortcuts.length === Object.keys(Command).length
}

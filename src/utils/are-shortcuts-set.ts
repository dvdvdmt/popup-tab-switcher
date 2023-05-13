import {Command} from './constants'

export default async function areShortcutsSet() {
  const shortcuts = await chrome.commands.getAll()
  const existingShortcuts = shortcuts.filter(({shortcut}) => shortcut)
  return existingShortcuts.length === Object.keys(Command).length
}

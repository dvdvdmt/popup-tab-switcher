# Popup tab switcher #

![Popup tab switcher logo](./readme-assets/tab-switcher-logo.png)

A browser extension that makes switching between tabs more convenient.

[![Popup tab switcher work demo](./readme-assets/youtube-preview.png)](https://youtu.be/JyX3lk-OrXw)

It remembers the order in which tabs were activated and allows you to switch 
between recently active tabs in a fraction of a second without using a mouse.

## Motivation ##

My everyday code editor from JetBrains has 
a handful popup (Settings > Keymap > Switcher) that simplifies switching between
editor's tabs. A similar switcher is build into all modern operating systems,
which allows you to jump between apps and it can be triggered by pressing `Alt + Tab` 
in Windows and `Cmd + Tab` in macOS. 
The project is copying this behaviour to the Chrome browser.

## How to use ##

Default shortcuts to trigger the extension are:
<ul>
  <li>
    <code>Alt + Y</code> to select tabs from top to bottom (recent to old)
    <details><summary>demo</summary>
      <img src="./readme-assets/switching-forward.gif" alt="Work demo. Switching forward" />
    </details> 
  </li>
  <li>
    <code>Alt + Shift + Y</code> to select tabs from bottom to top (old to recent)
    <details><summary>demo</summary>
      <img src="./readme-assets/switching-backward.gif" alt="Work demo. Switching backward" />
    </details> 
  </li>
</ul>

After you selected necessary tab, release the `Alt` key to activate it.  
You can press `Escape` or click on the space around popup to hide it. 

When you close a tab the extension will switch you to the previously active one. 
It is more helpful than the default Chrome behaviour, which activates the adjacent tab.

## Restrictions ##  
The extension tries to render its popup on the page wherever it is possible, but there are cases where it can't do that:
* Chrome's web store pages. The extension doesn't work here.
* Special Chrome tabs such as Settings, New tab, History, etc. In this case the extension tries to switch a user from a special tab to a previous tab without showing a popup.
* The page has no focus (a user searches on the page, focused on address bar, etc.). In this case the extension shows its popup and starts a timer by the end of which it will switch a user to the selected tab.
* File pages (URL starts with `file:///`). The extension can't work on such pages without a special permission which you can turn on in Extensions > Popup Tab Switcher (Details) > Allow access to file URLs.

## Contributors ##

Design of the icon and promo images - [Alina Zaripova](https://www.behance.net/alicilinia)


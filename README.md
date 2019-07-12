# Popup tab switcher #

![Popup tab switcher logo](./readme-assets/tab-switcher-logo.png)

A browser extension that makes switching between tabs more convenient.

[![Popup tab switcher work demo](./readme-assets/youtube-preview.png)](https://youtu.be/JyX3lk-OrXw)

It remembers the order in which tabs were activated and allows you to switch 
between recently active tabs in a fraction of a second without using a mouse.

## Motivation ##

My everyday code editor from JetBrains has 
a handful popup (Settings > Keymap > Switcher) that simplifies switching between
editor's tabs. So basically the project is copying this behaviour to the Chrome 
browser.

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

## Contributors ##

Design of the icon and promo images - [Alina Zaripova](https://www.behance.net/alicilinia)


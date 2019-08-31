export default function isSpecialTab(currentTab) {
  return /^chrome:|^view-source:/.test(currentTab.url);
}

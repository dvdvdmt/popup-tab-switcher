export async function getActiveTab(): Promise<chrome.tabs.Tab | undefined> {
  const [activeTab] = await chrome.tabs.query({
    active: true,
    currentWindow: true,
  })
  return activeTab
}

export function resolveWhenPageBecomesVisible(): Promise<void> {
  return new Promise((resolve, reject) => {
    document.addEventListener(
      'visibilitychange',
      () => {
        if (document.visibilityState === 'visible') {
          resolve()
        }
      },
      {once: true}
    )
    setTimeout(() => {
      reject(new Error(`Page ${window.location.href} did not become visible.`))
    }, 1000)
  })
}

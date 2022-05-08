export function isPageFocused(): Promise<true> {
  return getIsPageFocusedPromise()
}

function getIsPageFocusedPromise(): Promise<true> {
  return new Promise((resolve, reject) => {
    if (document.hasFocus()) {
      resolve(true)
    } else {
      testAgain(1, resolve, reject)
    }
  })

  function testAgain(
    attempt: number,
    resolve: (value: true) => void,
    reject: (reason: string) => void
  ) {
    setTimeout(() => {
      if (attempt >= 50) {
        reject(`The page '${document.title}' is not focused`)
      } else if (document.hasFocus()) {
        resolve(true)
      } else {
        testAgain(attempt + 1, resolve, reject)
      }
    })
  }
}

export function log(...args: any): void {
  if (PRODUCTION) {
    return
  }
  console.log(...args)
}

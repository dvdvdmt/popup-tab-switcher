// TODO: replace it with direct console.log calls and babel-plugin-transform-remove-debug
// This log function has a drawback that it doesn't show the file name and line number in the
// console of the place where it was called. It's more convenient to use console.log directly.
export function log(...args: any): void {
  if (PRODUCTION) {
    return
  }
  console.log(...args)
}

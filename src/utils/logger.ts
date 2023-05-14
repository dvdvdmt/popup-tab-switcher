const entries: string[] = []
// TODO: replace it with direct console.log calls and babel-plugin-transform-remove-debug
// This log function has a drawback that it doesn't show the file name and line number in the
// console of the place where it was called. It's more convenient to use console.log directly.
export function log(message: string, ...args: any): void {
  if (PRODUCTION) {
    return
  }
  console.log(message, ...args)
  const date = new Date()
  // time in the format hh:mm:ss.sss
  const formattedTime = date.toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
  const time = `${formattedTime}.${date.getMilliseconds()}`
  const entry = `${time} ${message} ${args
    .map((arg: any) => {
      try {
        // max length of the argument is 100 characters
        return JSON.stringify(arg).slice(0, 100)
      } catch (e) {
        return ''
      }
    })
    .join(' ')}`
  entries.push(entry)
}

export function getLogs(): string {
  return entries.join('\n')
}

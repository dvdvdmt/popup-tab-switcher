export function cache<T extends unknown[], R = unknown>(cb: (...args: T) => R) {
  const results = new Map<string, R>()
  return (...args: T) => {
    const key = args.join('')
    let result = results.get(key)
    if (result) {
      return result
    }
    result = cb(...args)
    results.set(key, result)
    return result
  }
}

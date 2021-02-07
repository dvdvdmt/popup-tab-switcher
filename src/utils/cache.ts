export function cache<T extends unknown[], R = unknown>(cb: (...args: T) => R) {
  const results = new Map<string, R>();
  return (...args: T) => {
    const key = args.join('');
    if (results.has(key)) {
      return results.get(key);
    }
    const result = cb(...args);
    results.set(key, result);
    return result;
  };
}

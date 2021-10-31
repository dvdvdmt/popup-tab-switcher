/* eslint-disable no-bitwise */
export default function uuid() {
  return '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, (ch) => {
    const digit = +ch
    return (digit ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (digit / 4)))).toString(
      16
    )
  })
}

export default function debounce(fn, delay) {
  let timerId;

  function debounced(...args) {
    if (timerId) {
      clearTimeout(timerId);
    }
    timerId = setTimeout(fn.bind(this, ...args), delay);
  }

  return debounced;
}

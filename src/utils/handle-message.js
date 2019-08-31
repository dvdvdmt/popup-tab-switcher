/**
 * Accepts an object that maps message.type to the handler
 * @param {object} handlers
 */
export default function handleMessage(handlers) {
  return (message) => {
    handlers[message.type](message);
  };
}

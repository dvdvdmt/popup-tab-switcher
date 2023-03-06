// TODO: move to SelectionAndFocus module
export interface IInputElementSelection {
  start: number
  end: number
  direction: 'forward' | 'backward' | 'none'
  element: HTMLInputElement | HTMLTextAreaElement
}

export function getInputElementSelection(element: Element | null): IInputElementSelection | null {
  if (
    !(element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) ||
    element.selectionStart == null ||
    element.selectionEnd == null
  ) {
    return null
  }
  const start = element.selectionStart
  const end = element.selectionEnd
  const direction = element.selectionDirection || 'none'
  return {start, end, direction, element}
}

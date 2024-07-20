import {log} from '../utils/logger'

export class SelectionAndFocus {
  private activeWindow: Window | null

  private activeElement: Element | null = null

  private selectionRanges: Range[] = []

  private inputElementSelection: IInputElementSelection | null = null

  static getInputElementSelection(element: Element | null): IInputElementSelection | null {
    if (
      !isInputOrTextarea(element) ||
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

  static getSelectionRanges(window: Window | null): Range[] {
    const selection = window?.getSelection()
    if (!selection) {
      return []
    }
    const ranges = []
    for (let i = 0; i < selection.rangeCount; i += 1) {
      ranges.push(selection.getRangeAt(i))
    }
    return ranges
  }

  /**
   * Gets the window object of the active element.
   * It pierces through all iframes recursively.
   */
  static getActiveWindow(current: Window): Window | null {
    const activeElement = current.document.activeElement
    if (!activeElement) {
      return null
    }
    if (activeElement instanceof HTMLIFrameElement && activeElement.contentWindow) {
      try {
        // Attempt to access the iframe's contentWindow
        // This will throw an error if cross-origin access is blocked
        // eslint-disable-next-line no-unused-expressions
        activeElement.contentWindow.document // Check if access is allowed
        return SelectionAndFocus.getActiveWindow(activeElement.contentWindow)
      } catch (error) {
        // Cross-origin access is blocked, return the current window
        log('Cross-origin iframe access blocked:', error)
        return current
      }
    }
    return current
  }

  /** Applies current selection and focus state to the page. */
  apply() {
    if (!this.activeWindow || !this.activeElement) {
      return
    }

    // Handle input and textarea elements.
    if (this.inputElementSelection) {
      const {element: inputElement, end, direction, start} = this.inputElementSelection
      try {
        inputElement.focus({preventScroll: true})
        inputElement.setSelectionRange(start, end, direction)
        // eslint-disable-next-line no-empty
      } catch (e) {}
      this.resetState()
      return
    }

    // Handle contenteditable elements.
    if (this.activeElement instanceof HTMLElement) {
      this.activeElement.focus({preventScroll: true})
    }

    if (this.selectionRanges.length > 0) {
      const selection = this.activeWindow.getSelection()
      if (selection) {
        selection.removeAllRanges()
        this.selectionRanges.forEach((range) => selection.addRange(range))
      }
    }

    this.resetState()
  }

  saveState() {
    this.activeWindow = this.activeWindow ?? SelectionAndFocus.getActiveWindow(window)
    this.activeElement = this.activeElement ?? this.activeWindow?.document.activeElement ?? null
    this.selectionRanges =
      this.selectionRanges.length > 0
        ? this.selectionRanges
        : SelectionAndFocus.getSelectionRanges(this.activeWindow)
    this.inputElementSelection =
      this.inputElementSelection ?? SelectionAndFocus.getInputElementSelection(this.activeElement)
  }

  resetState() {
    this.activeWindow = null
    this.activeElement = null
    this.selectionRanges = []
    this.inputElementSelection = null
  }
}

export interface IInputElementSelection {
  start: number
  end: number
  direction: 'forward' | 'backward' | 'none'
  element: HTMLInputElement | HTMLTextAreaElement
}

function isInputOrTextarea(
  element: Element | null
): element is HTMLInputElement | HTMLTextAreaElement {
  return element !== null && (element.nodeName === 'INPUT' || element.nodeName === 'TEXTAREA')
}

export interface IInputElementSelection {
  start: number
  end: number
  direction: 'forward' | 'backward' | 'none'
  element: HTMLInputElement | HTMLTextAreaElement
}

export class SelectionAndFocus {
  activeElement: Element | null = null

  selectionRanges: Range[] = []

  inputElementSelection: IInputElementSelection | null = null

  static getInputElementSelection(element: Element | null): IInputElementSelection | null {
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

  static getSelectionRanges(): Range[] {
    const selection = window.getSelection()
    if (!selection) {
      return []
    }
    const ranges = []
    for (let i = 0; i < selection.rangeCount; i += 1) {
      ranges.push(selection.getRangeAt(i))
    }
    return ranges
  }

  /** Applies current selection and focus state to the page. */
  apply() {
    if (!this.activeElement) {
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
      const selection = window.getSelection()
      if (selection) {
        selection.removeAllRanges()
        this.selectionRanges.forEach((range) => selection.addRange(range))
      }
    }

    this.resetState()
  }

  saveState() {
    this.activeElement = this.activeElement ?? document.activeElement
    this.selectionRanges =
      this.selectionRanges.length > 0
        ? this.selectionRanges
        : SelectionAndFocus.getSelectionRanges()
    this.inputElementSelection =
      this.inputElementSelection ?? SelectionAndFocus.getInputElementSelection(this.activeElement)
  }

  resetState() {
    this.activeElement = null
    this.selectionRanges = []
    this.inputElementSelection = null
  }
}

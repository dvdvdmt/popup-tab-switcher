export function getSelectionRanges(): Range[] {
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

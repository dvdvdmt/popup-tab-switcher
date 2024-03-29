import {Show} from 'solid-js'
import styles from './m-text-field.module.scss'

interface IProps {
  value: number
  id: string
  onInput: (value: number) => void
  suffix?: string
  min?: number
  max?: number
}

export function MNumberInput(props: IProps) {
  let previousValue = props.value
  const min = props.min ? props.min : 0
  const max = props.max ? props.max : 10000
  let inputElement: HTMLInputElement
  return (
    <div class={styles.field}>
      <input
        ref={inputElement!}
        class={props.suffix ? styles.inputWithSuffix : styles.input}
        id={props.id}
        type="number"
        name={props.id}
        min={min}
        max={max}
        value={props.value}
        onInput={() => {
          const value = normalizeValue(inputElement.value, previousValue, min, max)
          previousValue = value
          props.onInput(value)
          inputElement.value = value.toString()
        }}
      />
      <Show when={props.suffix}>
        <div class={styles.suffix}>{props.suffix}</div>
      </Show>
      <div class={styles.outline}>
        <div class={styles.outlineLeading}></div>
        <div class={styles.outlineTrailing}></div>
      </div>
    </div>
  )
}

/**
 * Parses a number from a string and normalizes it to be within the given range.
 */
function normalizeValue(value: string, previousValue: number, min: number, max: number): number {
  if (!value) {
    return min
  }
  const parsed = Number(value)
  if (Number.isNaN(parsed)) {
    return previousValue
  }
  if (parsed < min) {
    return min
  }
  if (parsed > max) {
    return previousValue
  }
  return parsed
}

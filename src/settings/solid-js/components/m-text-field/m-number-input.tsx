import {Show} from 'solid-js'
import styles from './m-text-field.module.scss'

interface IProps {
  value: number
  id: string
  suffix?: string
  min?: string
  max?: string
  onInput?: (value: number) => void
}

export function MNumberInput(props: IProps) {
  const initialValue = props.value
  const min = props.min ? props.min : '0'
  const max = props.max ? props.max : Infinity
  let inputElement: HTMLInputElement
  return (
    <div class={`mdc-text-field mdc-text-field--outlined mdc-text-field--no-label ${styles.field}`}>
      <input
        ref={inputElement!}
        class={`mdc-text-field__input ${styles.input}`}
        classList={{'mdc-text-field__input--suffix': !!props.suffix}}
        id={props.id}
        type="number"
        name={props.id}
        min={min}
        max={max}
        value={props.value}
        onInput={() => {
          const value = parseNumber(inputElement.value, initialValue)
          props.onInput?.(value)
        }}
      />
      <Show when={props.suffix}>
        <div class={styles.suffix}>{props.suffix}</div>
      </Show>
      <div class="mdc-notched-outline">
        <div class="mdc-notched-outline__leading"></div>
        <div class="mdc-notched-outline__trailing"></div>
      </div>
    </div>
  )
}

// Parses a number from a string. Returns default value if the string is not a number.
function parseNumber(value: string, defaultValue = 0): number {
  const parsed = Number(value)
  return Number.isNaN(parsed) ? defaultValue : parsed // normalize the value
}

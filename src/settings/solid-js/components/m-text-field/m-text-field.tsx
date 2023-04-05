import {Show} from 'solid-js'
import styles from './m-text-field.module.scss'

interface IProps {
  value: number
  id: string
  type: string
  suffix: string
  min?: string
  max?: string
}

export function MTextField(props: IProps) {
  const min = props.min ? props.min : '0'
  const max = props.max ? props.max : Infinity
  return (
    <div class={`mdc-text-field mdc-text-field--outlined mdc-text-field--no-label ${styles.field}`}>
      <input
        class={`mdc-text-field__input ${styles.input}`}
        classList={{'mdc-text-field__input--suffix': !!props.suffix}}
        id={props.id}
        type={props.type}
        name={props.id}
        min={min}
        max={max}
        value={props.value}
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

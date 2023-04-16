import styles from './m-banner.module.scss'
import {MButton} from '../m-button/m-button'

interface IProps {
  actionMessage: string
  icon: string
  message: string
  onAction: () => void
  onDismiss: () => void
}

export function MBanner(props: IProps) {
  return (
    <div class={styles.banner}>
      <div class={styles.content}>
        <div class={styles.icon}>{props.icon}</div>
        <div class={styles.message}>{props.message}</div>
      </div>
      <div class={styles.actions}>
        <MButton text="dismiss" onClick={props.onDismiss} />
        <MButton text={props.actionMessage} onClick={props.onAction} raised />
      </div>
    </div>
  )
}

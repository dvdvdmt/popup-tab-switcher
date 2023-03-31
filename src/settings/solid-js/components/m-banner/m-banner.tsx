import styles from './m-banner.module.scss'

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
        <div class={`${styles.icon} material-icons`}>{props.icon}</div>
        <div class={styles.message}>{props.message}</div>
      </div>
      <div class={styles.actions}>
        <button type="button" class={styles.button} onClick={props.onDismiss}>
          dismiss
        </button>
        <a type="button" class={styles.button_raised} onClick={props.onAction}>
          {props.actionMessage}
        </a>
      </div>
    </div>
  )
}

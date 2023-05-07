import {Show} from 'solid-js/web'
import {onMount} from 'solid-js'
// eslint-disable-next-line import/no-extraneous-dependencies
import {MDCRipple} from '@material/ripple/index'
import styles from './m-button.module.scss'

interface IProps {
  testId?: string
  raised?: boolean
  unelevated?: boolean
  outlined?: boolean
  href?: string
  target?: string
  icon?: string
  text: string
  onClick?: () => void
}

export function MButton(props: IProps) {
  let buttonElement: HTMLElement
  onMount(() => {
    MDCRipple.attachTo(buttonElement!)
  })
  return (
    <Show when={props.href} fallback={<MButtonWithIcon {...props} ref={buttonElement!} />}>
      <MHyperlinkButton {...props} ref={buttonElement!} />
    </Show>
  )
}

interface IPropsWithRef extends IProps {
  ref: HTMLElement
}

function MHyperlinkButton(props: IPropsWithRef) {
  return (
    <a
      ref={props.ref as HTMLAnchorElement}
      // the mdc-button class is needed to preserve ripple effect
      class={`mdc-button ${styles.button}`}
      classList={{
        [styles.buttonRaised]: props.raised,
        [styles.buttonUnelevated]: props.unelevated,
        [styles.buttonOutlined]: props.outlined,
      }}
      href={props.href}
      role="button"
      onClick={props.onClick}
      data-test={props.testId}
    >
      <i class={styles.icon}>{props.icon}</i>
      {props.text}
    </a>
  )
}

function MButtonWithIcon(props: IPropsWithRef) {
  return (
    <button
      ref={props.ref as HTMLButtonElement}
      class={`mdc-button ${styles.button}`}
      classList={{
        [styles.buttonRaised]: props.raised,
        [styles.buttonUnelevated]: props.unelevated,
        [styles.buttonOutlined]: props.outlined,
      }}
      onClick={(event) => {
        event.preventDefault()
        props.onClick?.()
      }}
      data-test={props.testId}
    >
      <i class={styles.icon}>{props.icon}</i>
      {props.text}
    </button>
  )
}

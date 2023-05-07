interface IProps {
  id: string
  isOn: boolean
  onToggle: () => void
}

export function MSwitch(props: IProps) {
  return (
    <div class="mdc-switch" classList={{'mdc-switch--checked': props.isOn}}>
      <div class="mdc-switch__track" />
      <div class="mdc-switch__thumb-underlay">
        <div class="mdc-switch__thumb">
          <input
            type="checkbox"
            id={props.id}
            name={props.id}
            class="mdc-switch__native-control"
            role="switch"
            onChange={() => props.onToggle()}
            checked={props.isOn}
          />
        </div>
      </div>
    </div>
  )
}

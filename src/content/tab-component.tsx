import {Show} from 'solid-js/web'
import {TabCornerIcon, TabIcon} from './icons'

interface IProps {
  isSelected: boolean
  isLast: boolean
  isFirst: boolean
  tab: chrome.tabs.Tab
}

export function TabComponent(props: IProps) {
  return (
    <div
      tabindex="-1"
      class="tab"
      classList={{
        tab_selected: props.isSelected,
      }}
    >
      <Show when={props.isSelected && !document.hasFocus()}>
        <div class="tab__timeoutIndicator" />
      </Show>
      <TabIcon url={props.tab.url} />
      <Show when={!props.isFirst}>
        <TabCornerIcon type="top" />
      </Show>
      <Show when={!props.isLast}>
        <TabCornerIcon type="bottom" />
      </Show>
      <span class="tab__text">{props.tab.title}</span>
    </div>
  )
}

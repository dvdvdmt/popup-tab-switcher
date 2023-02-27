import {Show} from 'solid-js/web'
import {createEffect} from 'solid-js'
import {TabCornerIcon, TabIcon} from './icons'

interface IProps {
  isSelected: boolean
  isTimeoutShown: boolean
  isLast: boolean
  isFirst: boolean
  tab: chrome.tabs.Tab
  onClick: () => void
  textScrollCoefficient: number
  textScrollDelay: number
}

export function PopupTab(props: IProps) {
  let tabElement: HTMLDivElement
  let titleElement: HTMLElement

  createEffect(() => {
    if (props.isSelected) {
      scrollLongTextOfSelectedTab()
      tabElement.focus()
    } else {
      titleElement.getAnimations().forEach((animation) => animation.cancel())
    }
  })

  return (
    <div
      ref={tabElement!}
      tabindex="-1"
      class="tab"
      classList={{
        tab_selected: props.isSelected,
      }}
      onClick={props.onClick}
    >
      <Show when={props.isTimeoutShown}>
        <div class="tab__timeoutIndicator" />
      </Show>
      <TabIcon url={props.tab.url} />
      <Show when={!props.isFirst}>
        <TabCornerIcon type="top" />
      </Show>
      <Show when={!props.isLast}>
        <TabCornerIcon type="bottom" />
      </Show>
      <span ref={titleElement!} class="tab__text">
        {props.tab.title}
      </span>
    </div>
  )

  function scrollLongTextOfSelectedTab() {
    const textOverflow = titleElement.scrollWidth - titleElement.offsetWidth
    if (textOverflow > 0) {
      const scrollTime = (textOverflow / titleElement.offsetWidth) * props.textScrollCoefficient
      const duration = scrollTime + 2 * props.textScrollDelay
      const startDelayOffset = props.textScrollDelay / duration
      const endDelayOffset = 1 - startDelayOffset
      titleElement.style.setProperty('text-overflow', 'initial')
      titleElement.animate(
        [
          {
            textIndent: 'initial',
          },
          {
            textIndent: 'initial',
            offset: startDelayOffset,
          },
          {
            textIndent: `-${textOverflow}px`,
            offset: endDelayOffset,
          },
          {
            textIndent: `-${textOverflow}px`,
          },
        ],
        {
          duration,
          iterations: Infinity,
        }
      )
    }
  }
}

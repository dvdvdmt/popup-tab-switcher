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
  let tabTextElement: HTMLDivElement
  let tabTextContentElement: HTMLElement

  createEffect(() => {
    if (props.isSelected) {
      scrollLongTextOfSelectedTab()
      tabElement.focus()
    } else {
      tabTextContentElement.getAnimations().forEach((animation) => animation.cancel())
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
      <div ref={tabTextElement!} class="tab__text">
        <span class="tab__textContent" ref={tabTextContentElement!}>
          {props.tab.title}
        </span>
      </div>
    </div>
  )

  function scrollLongTextOfSelectedTab() {
    const textOverflow = tabTextContentElement.scrollWidth - tabTextElement.clientWidth
    const pixelsPerSecond = 90
    if (textOverflow > 0) {
      const scrollTimeMs = (textOverflow / pixelsPerSecond) * 1000
      const durationMs = scrollTimeMs + 2 * props.textScrollDelay
      const startDelayOffset = props.textScrollDelay / durationMs
      const endDelayOffset = 1 - startDelayOffset
      tabTextContentElement.animate(
        [
          {
            transform: 'initial',
            offset: 0,
          },
          {
            transform: 'initial',
            offset: startDelayOffset,
          },
          {
            transform: `translateX(-${textOverflow}px)`,
            offset: endDelayOffset,
          },
          {
            transform: `translateX(-${textOverflow}px)`,
            offset: 1,
          },
        ],
        {
          duration: durationMs,
          direction: 'normal',
          iterations: Infinity,
        }
      )
    }
  }
}

import {For, onMount} from 'solid-js'
// eslint-disable-next-line import/no-extraneous-dependencies
import {MDCTabBar} from '@material/tab-bar/index'

export interface IPageTab {
  id: string
  icon: string
}

interface IMTabBarProps {
  tabs: IPageTab[]
  onTabActivated: (tabId: string) => void
  initialTabId: string
}

export function MTabBar(props: IMTabBarProps) {
  let rootRef: HTMLDivElement
  onMount(() => {
    const mdcTabBar = MDCTabBar.attachTo(rootRef)
    const initialTabIdx = props.tabs.findIndex((tab) => tab.id === props.initialTabId)
    mdcTabBar.activateTab(initialTabIdx)
  })
  return (
    <div ref={rootRef!} class="mdc-tab-bar" role="tablist">
      <div class="mdc-tab-scroller">
        <div class="mdc-tab-scroller__scroll-area">
          <div class="mdc-tab-scroller__scroll-content">
            <For each={props.tabs}>
              {(tab) => (
                <button
                  class="mdc-tab"
                  role="tab"
                  aria-selected="true"
                  tabindex="0"
                  data-test="id"
                  onClick={() => {
                    props.onTabActivated(tab.id)
                  }}
                >
                  <span class="mdc-tab__content">
                    <span class="mdc-tab__icon material-icons" aria-hidden="true">
                      {tab.icon}
                    </span>
                    <span class="mdc-tab__text-label">{tab.id}</span>
                  </span>
                  <span class="mdc-tab-indicator">
                    <span class="mdc-tab-indicator__content mdc-tab-indicator__content--underline"></span>
                  </span>
                  <span class="mdc-tab__ripple"></span>
                </button>
              )}
            </For>
          </div>
        </div>
      </div>
    </div>
  )
}

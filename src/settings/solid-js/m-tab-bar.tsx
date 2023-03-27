import {For} from 'solid-js'

export interface IPageTab {
  id: string
  icon: string
}

interface IMTabBarProps {
  tabs: IPageTab[]
  onTabActivated: (tabId: string) => void
}

export function MTabBar(props: IMTabBarProps) {
  // const {store} = createMTabBarStore(props)
  return (
    // <div class="mdc-tab-bar" role="tablist" @MDCTabBar:activated="onActivated">
    <div class="mdc-tab-bar" role="tablist">
      <div class="mdc-tab-scroller">
        <div class="mdc-tab-scroller__scroll-area">
          <div class="mdc-tab-scroller__scroll-content">
            {/* // <m-tab v-for="(tab, index) in tabs" :key="index" :id="tab.id"> */}
            {/* // <template slot="icon">{{ tab.icon }}</template> */}
            {/* </m-tab> */}
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
                      {/* <slot name="icon"></slot> */}
                      {tab.icon}
                    </span>
                    <span class="mdc-tab__text-label">
                      {/* <slot></slot> */}
                      {tab.id}
                    </span>
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

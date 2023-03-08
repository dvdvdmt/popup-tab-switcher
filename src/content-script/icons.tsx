import {createMemo} from 'solid-js'
import {Show} from 'solid-js/web'

function getFaviconUrl(url: string) {
  const faviconUrl = new URL(`chrome-extension://${chrome.runtime.id}/_favicon/`)
  faviconUrl.searchParams.set('pageUrl', url)
  faviconUrl.searchParams.set('size', '64')
  return faviconUrl.href
}

function NoFaviconIcon() {
  return (
    <svg
      class="tab__icon tab__icon_noFavIcon"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fill-rule="evenodd"
        clip-rule="evenodd"
        d="M12 2C17.52 2 22 6.48 22 12C22 17.52 17.52 22 12 22C6.48 22 2 17.52 2 12C2 6.48 6.48 2 12 2ZM4 12H8.4C11.81 12.02 13.32 13.73 12.94 17.13H9.49V19.6C10.7311 20.011 12.054 20.1115 13.3429 19.8928C14.6318 19.6741 15.8475 19.1429 16.8836 18.3456C17.9197 17.5483 18.7446 16.5093 19.2861 15.3193C19.8277 14.1294 20.0693 12.8249 19.99 11.52C19.33 12.5 18.33 13 17 13C14.86 13 13.79 12.08 13.79 10.25H10.04C9.77 7.52 10.72 6.16 12.91 6.16C12.91 5.19 13.24 4.56 13.72 4.19C12.5516 3.93277 11.3404 3.94089 10.1755 4.21374C9.01062 4.4866 7.92178 5.01725 6.98915 5.76662C6.05651 6.51599 5.30383 7.465 4.78652 8.54377C4.2692 9.62254 4.00044 10.8036 4 12V12Z"
      />
    </svg>
  )
}

export function TabCornerIcon(props: {type: 'top' | 'bottom'}) {
  const tabCornerType = props.type === 'top' ? 'tab__cornerIcon_top' : 'tab__cornerIcon_bottom'
  return (
    <svg
      class={`tab__cornerIcon ${tabCornerType}`}
      viewBox="0 0 8 8"
      preserveAspectRatio="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M0 0C0 4.41828 3.58172 8 8 8H0V0Z" />
    </svg>
  )
}

export function TabIcon(props: {url: string | undefined}) {
  const url = createMemo(() => {
    if (!props.url) {
      return ''
    }
    return getFaviconUrl(props.url)
  })
  return (
    <Show when={url()} keyed fallback={<NoFaviconIcon />}>
      <img src={url()} class="tab__icon" />
    </Show>
  )
}

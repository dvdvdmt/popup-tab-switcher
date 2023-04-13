import {MButton} from '../components/m-button/m-button'
import styles from './contribute.module.scss'
import {CopyLinkButton} from './copy-link-button'

export function Contribute() {
  return (
    <div class={`${styles.contribute} mdc-typography mdc-typography--body1`}>
      <p class={styles.callToAction}>You can say thanks or help me one of the following ways:</p>
      <div class={styles.actions}>
        <MButton
          href="https://github.com/dvdvdmt/popup-tab-switcher/issues"
          target="_blank"
          icon="announcement"
          text="Report an issue"
          outlined
        />
        <MButton
          href="mailto:dvdvdmt@gmail.com?subject=Popup Tab Switcher. <Your question>"
          target="_blank"
          icon="email"
          text="Contact me"
          outlined
        />
        <MButton href="extensionUrl" target="_blank" icon="star" text="Give me 5 stars" raised />
      </div>
      <div class={styles.shareActions}>
        <p class={styles.callToAction}>or share with others</p>
        <div class={styles.shareLinks}>
          <CopyLinkButton class={styles.iconButton} textToCopy="test 23334" />
          {/* <copy-link-button :link="extensionUrl" /> */}
          <a
            class={styles.iconButton}
            //* :href='shareOnFacebookUrl' */
            target="_blank"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              {/* facebook icon */}
              <path
                fill-rule="evenodd"
                clip-rule="evenodd"
                d="M5 2C3.3431 2 2 3.3431 2 5V19C2 20.6569 3.3431 22 5 22H12.1297V14.1177H10.0909V11.4442H12.1297V9.4185C12.1297 7.5322 13.2679 5.6364 16.1729 5.6364C17.0621 5.6364 17.7061 5.6986 18.0204 5.7289C18.1218 5.7388 18.1889 5.7452 18.2188 5.7452L18.2727 8.5334C18.2727 8.5334 17.3857 8.5251 16.4178 8.5251C15.3703 8.5251 15.2025 8.9919 15.2025 9.7669V9.8984V11.4442H18.2188V14.1177H15.2025V22H19C20.6569 22 22 20.6569 22 19V5C22 3.3431 20.6569 2 19 2H5Z"
              />
            </svg>
          </a>
          <a
            class={styles.iconButton}
            // :href="shareOnTwitterUrl"
            target="_blank"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              {/* twitter icon */}
              <path
                fill-rule="evenodd"
                clip-rule="evenodd"
                d="M19.5256 5.7188C20.397 5.6138 21.2274 5.3805 22 5.0353C21.4224 5.9057 20.692 6.6701 19.8501 7.282C19.8585 7.4682 19.8627 7.6555 19.8627 7.8436C19.8627 13.5792 15.5291 20.1931 7.6044 20.1931C5.1713 20.1931 2.9067 19.4744 1 18.2428C1.337 18.283 1.68 18.3035 2.0277 18.3035C4.0464 18.3035 5.9041 17.6097 7.3785 16.4455C5.4933 16.4106 3.9021 15.1556 3.3539 13.4313C3.6169 13.4819 3.8868 13.5092 4.1645 13.5092C4.5574 13.5092 4.938 13.4561 5.2996 13.357C3.3286 12.9581 1.8434 11.2039 1.8434 9.1009C1.8434 9.0826 1.8434 9.0645 1.8439 9.0464C2.4247 9.3714 3.0891 9.5667 3.7953 9.5892C2.6393 8.8109 1.8787 7.4824 1.8787 5.9765C1.8787 5.1811 2.0912 4.4355 2.462 3.7945C4.5869 6.4205 7.7616 8.1484 11.3423 8.3295C11.2688 8.0117 11.2307 7.6804 11.2307 7.3403C11.2307 4.9433 13.1599 3 15.5391 3C16.7783 3 17.8981 3.5271 18.6839 4.3706C19.6653 4.1761 20.5873 3.8148 21.4199 3.3174C21.0981 4.3309 20.4149 5.1815 19.5256 5.7188Z"
              />
            </svg>
          </a>
          <a
            class={styles.iconButton}
            // :href="shareOnVkontakteUrl"
            target="_blank"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              {/* vkontakte icon */}
              <path
                fill-rule="evenodd"
                clip-rule="evenodd"
                d="M21.0737 6C21.7422 6 21.8826 6.3442 21.7422 6.8126C21.4612 8.1006 18.7679 11.8944 18.7679 11.8944C18.5338 12.2691 18.4401 12.4565 18.7679 12.878C18.8834 13.0397 19.1298 13.281 19.4117 13.5572C19.7016 13.8411 20.029 14.1618 20.2902 14.4705C21.2397 15.5388 21.9553 16.4399 22.1547 17.061C22.3369 17.6842 22.0211 18 21.3895 18H19.179C18.5869 18 18.2887 17.6684 17.6445 16.9517C17.3714 16.6479 17.0362 16.275 16.59 15.8288C15.2785 14.5642 14.7165 14.4003 14.3886 14.4003C13.9436 14.4003 13.8105 14.5263 13.775 15.1579V17.1403C13.8105 17.6842 13.6367 18 12.2316 18C9.8897 18 7.3161 16.5782 5.4894 13.9553C2.7494 10.1146 2 7.2107 2 6.6252C2 6.2973 2.1263 6 2.7579 6H4.9684C5.5334 6 5.7459 6.2473 5.9578 6.8594C7.0389 10.0087 8.8618 12.761 9.6111 12.761C9.8922 12.761 10.0211 12.6316 10.025 11.9179V8.6626C9.9719 7.7366 9.6476 7.3358 9.4076 7.039C9.2591 6.8555 9.1428 6.7117 9.1428 6.5081C9.1428 6.2609 9.354 6 9.7053 6H13.179C13.6474 6 13.775 6.2505 13.775 6.8126V11.1919C13.8031 11.6602 14.0139 11.8242 14.1544 11.8242C14.4354 11.8242 14.6696 11.6602 15.1848 11.145C16.7773 9.3652 17.9015 6.6252 17.9015 6.6252C18.042 6.2973 18.3011 6 18.8632 6H21.0737Z"
              />
            </svg>
          </a>
        </div>
      </div>
    </div>
  )
}

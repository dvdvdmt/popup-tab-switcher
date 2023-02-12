import {createPopupStore} from './popup-store'

export function PopupRoot() {
  const store = createPopupStore()
  return (
    <div class="overlay">
      <div class="card"></div>
    </div>
  )
}

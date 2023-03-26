import {render} from 'solid-js/web'
import styles from './settings.module.scss'
import {ServiceFactory} from '../service-factory'
import {ISettings} from '../utils/settings'

interface ISettingsProps {
  settings: ISettings
}

export function Settings(props: ISettingsProps) {
  const {settings} = props
  return (
    <div
      class={`${styles.settings} mdc-typography`}
      classList={{[styles.settings_dark]: settings.isDarkTheme}}
    >
      Test SolidJS
    </div>
  )
}

export async function initSettings() {
  const settings = await ServiceFactory.getSettings()
  window.settings = settings
  // TODO: Render the app right into the body element
  const appRootElement = document.createElement('div')
  render(() => <Settings settings={settings} />, appRootElement)

  document.body.appendChild(appRootElement)
}

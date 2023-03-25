import {render} from 'solid-js/web'
import {Settings} from './settings'

// TODO: Render the app right into the body element
const appRootElement = document.createElement('div')
render(Settings, appRootElement)

document.body.appendChild(appRootElement)

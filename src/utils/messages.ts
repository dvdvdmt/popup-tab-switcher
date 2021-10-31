/* eslint-disable no-console */
import {DefaultSettings} from './settings'
import {Command} from './constants'
import {ITab} from './check-tab'

export enum Message {
  APPLY_NEW_SETTINGS = 'APPLY_NEW_SETTINGS',
  APPLY_NEW_SETTINGS_SILENTLY = 'APPLY_NEW_SETTINGS_SILENTLY',
  UPDATE_SETTINGS = 'UPDATE_SETTINGS',
  UPDATE_ZOOM_FACTOR = 'UPDATE_ZOOM_FACTOR',
  CLOSE_POPUP = 'CLOSE_POPUP',
  SELECT_TAB = 'SELECT_TAB',
  SWITCH_TAB = 'SWITCH_TAB',
  COMMAND = 'COMMAND',
  E2E_SET_ZOOM = 'E2E_SET_ZOOM',
}

export function updateSettings(newSettings: DefaultSettings) {
  return {type: Message.UPDATE_SETTINGS, newSettings} as const
}

export function updateZoomFactor(zoomFactor: number) {
  return {type: Message.UPDATE_ZOOM_FACTOR, zoomFactor} as const
}

export function applyNewSettings(newSettings: DefaultSettings, tabsData: ITab[]) {
  return {type: Message.APPLY_NEW_SETTINGS, newSettings, tabsData} as const
}

export function applyNewSettingsSilently(newSettings: DefaultSettings) {
  return {type: Message.APPLY_NEW_SETTINGS_SILENTLY, newSettings} as const
}

export function switchTab(selectedTab: ITab) {
  return {type: Message.SWITCH_TAB, selectedTab} as const
}

export function selectTab(tabsData: ITab[], increment: number, zoomFactor = 1) {
  return {
    type: Message.SELECT_TAB,
    tabsData,
    increment,
    zoomFactor,
  } as const
}

export function closePopup() {
  return {type: Message.CLOSE_POPUP} as const
}

export function command(cmd: Command) {
  return {type: Message.COMMAND, command: cmd} as const
}

export function e2eSetZoom(zoomFactor: number) {
  return {type: Message.E2E_SET_ZOOM, zoomFactor} as const
}

interface IMessageTypeToObjectMap {
  [Message.UPDATE_SETTINGS]: ReturnType<typeof updateSettings>
  [Message.UPDATE_ZOOM_FACTOR]: ReturnType<typeof updateZoomFactor>
  [Message.APPLY_NEW_SETTINGS]: ReturnType<typeof applyNewSettings>
  [Message.APPLY_NEW_SETTINGS_SILENTLY]: ReturnType<typeof applyNewSettingsSilently>
  [Message.SWITCH_TAB]: ReturnType<typeof switchTab>
  [Message.SELECT_TAB]: ReturnType<typeof selectTab>
  [Message.CLOSE_POPUP]: ReturnType<typeof closePopup>
  [Message.COMMAND]: ReturnType<typeof command>
  [Message.E2E_SET_ZOOM]: ReturnType<typeof e2eSetZoom>
}

export type IHandlers = {
  [key in Message]: (message: IMessageTypeToObjectMap[key]) => void
}

type IMessage =
  | ReturnType<typeof updateSettings>
  | ReturnType<typeof updateZoomFactor>
  | ReturnType<typeof applyNewSettings>
  | ReturnType<typeof applyNewSettingsSilently>
  | ReturnType<typeof switchTab>
  | ReturnType<typeof selectTab>
  | ReturnType<typeof closePopup>
  | ReturnType<typeof command>
  | ReturnType<typeof e2eSetZoom>

function hasOwnProperty<X extends {}, Y extends PropertyKey>(
  obj: X,
  prop: Y
): obj is X & Record<Y, unknown> {
  return Object.prototype.hasOwnProperty.call(obj, prop)
}

function isTypedObject(object: unknown): object is {type: string} {
  return (
    typeof object === 'object' &&
    object !== null &&
    hasOwnProperty(object, 'type') &&
    typeof object.type === 'string'
  )
}

function isMessage(message: {type: string}): message is IMessage {
  return message.type in Message
}

export function handleMessage(handlers: Partial<IHandlers>) {
  return (message: unknown) => {
    if (!isTypedObject(message)) {
      console.error("Message must have the 'type' property of string value.", message)
      return
    }
    if (!isMessage(message)) {
      console.error('There is no message of such type in registry.', message)
      return
    }
    const handler = handlers[message.type]
    if (!handler) {
      console.error(`There is no handler for the message.type = ${message.type}`, message)
      return
    }
    // @ts-expect-error
    // TODO: How to guarantee correspondence of a message and handler types?
    handler(message)
  }
}

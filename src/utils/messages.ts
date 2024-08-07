import {Command} from './constants'
import {ISettings} from './settings'
import {log} from './logger'

type MessageSender = chrome.runtime.MessageSender
type Port = chrome.runtime.Port
type ChromeTab = chrome.tabs.Tab

// TODO: Rename Message entries to consistent PascalCase
export enum Message {
  CLOSE_POPUP = 'CLOSE_POPUP',
  COMMAND = 'COMMAND',
  ContentScriptStarted = 'ContentScriptStarted',
  ContentScriptStopped = 'ContentScriptStopped',
  DEMO_SETTINGS = 'DEMO_SETTINGS',
  E2E_IS_MESSAGING_READY = 'E2E_IS_MESSAGING_READY',
  E2E_IS_PAGE_ACTIVE = 'E2E_IS_PAGE_ACTIVE',
  E2E_RELOAD_EXTENSION = 'E2E_RELOAD_EXTENSION',
  E2E_RELOAD_EXTENSION_FINISHED = 'E2E_RELOAD_EXTENSION_FINISHED',
  SetSettings = 'SetSettings',
  GetSettings = 'GetSettings',
  E2E_SET_ZOOM = 'E2E_SET_ZOOM',
  GET_MODEL = 'GET_MODEL',
  SELECT_TAB = 'SELECT_TAB',
  SWITCH_TAB = 'SWITCH_TAB',
  PopupShown = 'PopupShown',
  GetRenderingTime = 'GetRenderingTime',
}

export function demoSettings() {
  return {type: Message.DEMO_SETTINGS} as const
}

export function switchTab(selectedTab: ChromeTab) {
  return {type: Message.SWITCH_TAB, selectedTab} as const
}

export function popupShown() {
  return {type: Message.PopupShown} as const
}

export function getRenderingTime() {
  return {type: Message.GetRenderingTime} as const
}

export function selectTab(increment: number) {
  return {
    type: Message.SELECT_TAB,
    increment,
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

export function setSettings(settings?: Partial<ISettings>) {
  return {type: Message.SetSettings, settings} as const
}

export function getSettings() {
  return {type: Message.GetSettings} as const
}

export function e2eIsPageActive() {
  return {type: Message.E2E_IS_PAGE_ACTIVE} as const
}

export function e2eIsMessagingReady() {
  return {type: Message.E2E_IS_MESSAGING_READY} as const
}

export function e2eReloadExtension() {
  return {type: Message.E2E_RELOAD_EXTENSION} as const
}

export function e2eReloadExtensionFinished() {
  return {type: Message.E2E_RELOAD_EXTENSION_FINISHED} as const
}

export function contentScriptStarted() {
  return {type: Message.ContentScriptStarted} as const
}

export function contentScriptStopped() {
  return {type: Message.ContentScriptStopped} as const
}

export function getModel() {
  return {type: Message.GET_MODEL} as const
}

interface IMessageTypeToObjectMap {
  [Message.CLOSE_POPUP]: ReturnType<typeof closePopup>
  [Message.COMMAND]: ReturnType<typeof command>
  [Message.ContentScriptStarted]: ReturnType<typeof contentScriptStarted>
  [Message.ContentScriptStopped]: ReturnType<typeof contentScriptStopped>
  [Message.DEMO_SETTINGS]: ReturnType<typeof demoSettings>
  [Message.E2E_IS_MESSAGING_READY]: ReturnType<typeof e2eIsMessagingReady>
  [Message.E2E_IS_PAGE_ACTIVE]: ReturnType<typeof e2eIsPageActive>
  [Message.E2E_RELOAD_EXTENSION]: ReturnType<typeof e2eReloadExtension>
  [Message.E2E_RELOAD_EXTENSION_FINISHED]: ReturnType<typeof e2eReloadExtensionFinished>
  [Message.SetSettings]: ReturnType<typeof setSettings>
  [Message.GetSettings]: ReturnType<typeof getSettings>
  [Message.E2E_SET_ZOOM]: ReturnType<typeof e2eSetZoom>
  [Message.GET_MODEL]: ReturnType<typeof getModel>
  [Message.SELECT_TAB]: ReturnType<typeof selectTab>
  [Message.SWITCH_TAB]: ReturnType<typeof switchTab>
  [Message.PopupShown]: ReturnType<typeof popupShown>
  [Message.GetRenderingTime]: ReturnType<typeof getRenderingTime>
}

export type IMessage = IMessageTypeToObjectMap[keyof IMessageTypeToObjectMap]

export interface IGetModelResponse {
  settings: ISettings
  tabs: chrome.tabs.Tab[]
  zoomFactor: number
}

export type IMessageResponse<Message extends IMessage> = Message extends ReturnType<typeof getModel>
  ? IGetModelResponse
  : Message extends ReturnType<typeof e2eIsPageActive>
  ? boolean
  : Message extends ReturnType<typeof e2eIsMessagingReady>
  ? boolean
  : Message extends ReturnType<typeof getSettings>
  ? ISettings
  : Message extends ReturnType<typeof getRenderingTime>
  ? number
  : void

export type IHandlers = {
  [key in Message]: (
    message: IMessageTypeToObjectMap[key],
    sender: MessageSender
  ) => IMessageResponse<IMessageTypeToObjectMap[key]> extends void
    ? void
    : Promise<IMessageResponse<IMessageTypeToObjectMap[key]>>
}

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

function getSender(senderOrPort: MessageSender | Port): MessageSender {
  if (hasOwnProperty(senderOrPort, 'sender')) {
    return senderOrPort.sender as MessageSender
  }
  return senderOrPort as MessageSender
}

export function handleMessage(handlers: Partial<IHandlers>) {
  return (
    message: unknown,
    sender: MessageSender | Port,
    sendResponse: (response?: any) => void
  ) => {
    if (!isTypedObject(message)) {
      console.error("Message must have the 'type' property of string value.", message)
      return
    }
    if (!isMessage(message)) {
      if (DEVELOPMENT && message.type.startsWith('SIGN')) {
        // Ignore messages that came from webpack-chrome-extension-reloader
        return
      }
      console.error('There is no message of such type in registry.', message)
      return
    }
    const handler = handlers[message.type]
    if (!handler) {
      console.error(`There is no handler for the message.type = ${message.type}`, message)
      return
    }
    log(`[Message received]`, message)
    // @ts-expect-error
    // TODO: How to guarantee correspondence of a message and handler types?
    const response = handler(message, getSender(sender))
    if (response) {
      Promise.resolve(response).then(sendResponse)
      return true // indicates that response will be sent asynchronously
    }
  }
}

/**
 * Sends message and returns a promise that resolves with the response.
 * Note, that simple promise resolution from chrome.runtime.sendMessage is not enough,
 * because it resolves with undefined if there were no synchronous listeners which send a response
 * instantly.
 */
export function sendMessageAndGetResponse<Message extends IMessage>(
  message: Message
): Promise<IMessageResponse<Message>> {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(message, (response) => {
      resolve(response)
    })
  })
}

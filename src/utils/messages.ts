/* eslint-disable no-console */
import {Runtime} from 'webextension-polyfill'
import {Command} from './constants'
import {ITab} from './check-tab'
import {IModel} from '../popup-tab-switcher'

import MessageSender = Runtime.MessageSender
import Port = Runtime.Port

export enum Message {
  DEMO_SETTINGS = 'DEMO_SETTINGS',
  CLOSE_POPUP = 'CLOSE_POPUP',
  SELECT_TAB = 'SELECT_TAB',
  SWITCH_TAB = 'SWITCH_TAB',
  COMMAND = 'COMMAND',
  E2E_SET_ZOOM = 'E2E_SET_ZOOM',
  INITIALIZED = 'INITIALIZED',
  GET_MODEL = 'GET_MODEL',
  E2E_RELOAD_EXTENSION = 'E2E_RELOAD_EXTENSION',
  E2E_RELOAD_EXTENSION_FINISHED = 'E2E_RELOAD_EXTENSION_FINISHED',
  E2E_IS_PAGE_ACTIVE = 'E2E_IS_PAGE_ACTIVE',
  E2E_IS_MESSAGING_READY = 'E2E_IS_MESSAGING_READY',
}

export function demoSettings() {
  return {type: Message.DEMO_SETTINGS} as const
}

export function switchTab(selectedTab: ITab) {
  return {type: Message.SWITCH_TAB, selectedTab} as const
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

export function initialized() {
  return {type: Message.INITIALIZED} as const
}

export function getModel() {
  return {type: Message.GET_MODEL} as const
}

interface IMessageTypeToObjectMap {
  [Message.DEMO_SETTINGS]: ReturnType<typeof demoSettings>
  [Message.SWITCH_TAB]: ReturnType<typeof switchTab>
  [Message.SELECT_TAB]: ReturnType<typeof selectTab>
  [Message.CLOSE_POPUP]: ReturnType<typeof closePopup>
  [Message.COMMAND]: ReturnType<typeof command>
  [Message.E2E_SET_ZOOM]: ReturnType<typeof e2eSetZoom>
  [Message.E2E_IS_PAGE_ACTIVE]: ReturnType<typeof e2eIsPageActive>
  [Message.E2E_IS_MESSAGING_READY]: ReturnType<typeof e2eIsMessagingReady>
  [Message.E2E_RELOAD_EXTENSION]: ReturnType<typeof e2eReloadExtension>
  [Message.E2E_RELOAD_EXTENSION_FINISHED]: ReturnType<typeof e2eReloadExtensionFinished>
  [Message.INITIALIZED]: ReturnType<typeof initialized>
  [Message.GET_MODEL]: ReturnType<typeof getModel>
}

export type IMessage = IMessageTypeToObjectMap[keyof IMessageTypeToObjectMap]

export type IMessageResponse<Message extends IMessage> = Message extends ReturnType<typeof getModel>
  ? IModel
  : Message extends ReturnType<typeof e2eIsPageActive>
  ? boolean
  : Message extends ReturnType<typeof e2eIsMessagingReady>
  ? boolean
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
  return (message: unknown, sender: MessageSender | Port) => {
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
    // @ts-expect-error
    // TODO: How to guarantee correspondence of a message and handler types?
    return handler(message, getSender(sender))
  }
}

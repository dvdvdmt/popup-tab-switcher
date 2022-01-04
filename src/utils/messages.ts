/* eslint-disable no-console */
import {Runtime} from 'webextension-polyfill'
import {DefaultSettings} from './settings'
import {Command} from './constants'
import {ITab} from './check-tab'
import {IModel} from '../popup-tab-switcher'

import MessageSender = Runtime.MessageSender
import Port = Runtime.Port

export enum Message {
  DEMO_SETTINGS = 'DEMO_SETTINGS',
  UPDATE_SETTINGS = 'UPDATE_SETTINGS',
  UPDATE_ZOOM_FACTOR = 'UPDATE_ZOOM_FACTOR',
  CLOSE_POPUP = 'CLOSE_POPUP',
  SELECT_TAB = 'SELECT_TAB',
  SWITCH_TAB = 'SWITCH_TAB',
  COMMAND = 'COMMAND',
  E2E_SET_ZOOM = 'E2E_SET_ZOOM',
  INITIALIZED = 'INITIALIZED',
  GET_MODEL = 'GET_MODEL',
}

export function updateSettings(newSettings: DefaultSettings) {
  return {type: Message.UPDATE_SETTINGS, newSettings} as const
}

export function updateZoomFactor(zoomFactor: number) {
  return {type: Message.UPDATE_ZOOM_FACTOR, zoomFactor} as const
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

export function initialized() {
  return {type: Message.INITIALIZED} as const
}

export function getModel() {
  return {type: Message.GET_MODEL} as const
}

interface IMessageTypeToObjectMap {
  [Message.UPDATE_SETTINGS]: {message: ReturnType<typeof updateSettings>; response: void}
  [Message.UPDATE_ZOOM_FACTOR]: {message: ReturnType<typeof updateZoomFactor>; response: void}
  [Message.DEMO_SETTINGS]: {message: ReturnType<typeof demoSettings>; response: void}
  [Message.SWITCH_TAB]: {message: ReturnType<typeof switchTab>; response: void}
  [Message.SELECT_TAB]: {message: ReturnType<typeof selectTab>; response: void}
  [Message.CLOSE_POPUP]: {message: ReturnType<typeof closePopup>; response: void}
  [Message.COMMAND]: {message: ReturnType<typeof command>; response: void}
  [Message.E2E_SET_ZOOM]: {message: ReturnType<typeof e2eSetZoom>; response: void}
  [Message.INITIALIZED]: {message: ReturnType<typeof e2eSetZoom>; response: void}
  [Message.GET_MODEL]: {message: ReturnType<typeof getModel>; response: Promise<IModel>}
}

export type IHandlers = {
  [key in Message]: (
    message: IMessageTypeToObjectMap[key]['message'],
    sender: MessageSender
  ) => IMessageTypeToObjectMap[key]['response']
}

type IMessage = IMessageTypeToObjectMap[keyof IMessageTypeToObjectMap]['message']

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

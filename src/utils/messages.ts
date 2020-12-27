/* eslint-disable no-console */
import {Tabs} from 'webextension-polyfill-ts';
import {DefaultSettings} from './settings';
import {Command} from './constants';

import Tab = Tabs.Tab;

export enum Message {
  APPLY_NEW_SETTINGS = 'APPLY_NEW_SETTINGS',
  APPLY_NEW_SETTINGS_SILENTLY = 'APPLY_NEW_SETTINGS_SILENTLY',
  UPDATE_SETTINGS = 'UPDATE_SETTINGS',
  UPDATE_ZOOM_FACTOR = 'UPDATE_ZOOM_FACTOR',
  CLOSE_POPUP = 'CLOSE_POPUP',
  SELECT_TAB = 'SELECT_TAB',
  SWITCH_TAB = 'SWITCH_TAB',
  COMMAND = 'COMMAND',
}

export function updateSettings(newSettings: DefaultSettings) {
  return {type: Message.UPDATE_SETTINGS, newSettings} as const;
}

export function updateZoomFactor(zoomFactor: number) {
  return {type: Message.UPDATE_ZOOM_FACTOR, zoomFactor} as const;
}

export function applyNewSettings(newSettings: DefaultSettings, tabsData: Tab[]) {
  return {type: Message.APPLY_NEW_SETTINGS, newSettings, tabsData} as const;
}

export function applyNewSettingsSilently(newSettings: DefaultSettings) {
  return {type: Message.APPLY_NEW_SETTINGS_SILENTLY, newSettings} as const;
}

export function switchTab(selectedTab: Tab) {
  return {type: Message.SWITCH_TAB, selectedTab} as const;
}

export function selectTab(tabsData: Tab[], increment: number, zoomFactor = 1) {
  return {type: Message.SELECT_TAB, tabsData, increment, zoomFactor} as const;
}

export function closePopup() {
  return {type: Message.CLOSE_POPUP} as const;
}

export function command(cmd: Command) {
  return {type: Message.COMMAND, command: cmd} as const;
}

export interface Handlers {
  [key: string]: (message?: unknown) => void;
  [Message.UPDATE_SETTINGS]?: (message: ReturnType<typeof updateSettings>) => void;
  [Message.UPDATE_ZOOM_FACTOR]?: (message: ReturnType<typeof updateZoomFactor>) => void;
  [Message.APPLY_NEW_SETTINGS]?: (message: ReturnType<typeof applyNewSettings>) => void;
  [Message.APPLY_NEW_SETTINGS_SILENTLY]?: (
    message: ReturnType<typeof applyNewSettingsSilently>
  ) => void;
  [Message.SWITCH_TAB]?: (message: ReturnType<typeof switchTab>) => void;
  [Message.SELECT_TAB]?: (message: ReturnType<typeof selectTab>) => void;
  [Message.CLOSE_POPUP]?: () => void;
  [Message.COMMAND]?: (message: ReturnType<typeof command>) => void;
}

export function handleMessage(handlers: Handlers, typeKey = 'type') {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (message: any) => {
    const messageType = message[typeKey];
    if (!messageType || typeof messageType !== 'string') {
      console.error(`Message must have key '${typeKey}' of string value.`, message);
      return;
    }
    const handler = handlers[messageType];
    if (!handler) {
      console.error(`There is no handler for the message['${typeKey}'] = ${messageType}`);
      return;
    }
    handler(message);
  };
}

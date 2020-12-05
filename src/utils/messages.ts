/* eslint-disable no-console */
import {Tabs} from 'webextension-polyfill-ts';
import {DefaultSettings} from './settings';
import {Command} from './constants';

import Tab = Tabs.Tab;

export enum Message {
  APPLY_NEW_SETTINGS = 'APPLY_NEW_SETTINGS',
  APPLY_NEW_SETTINGS_SILENTLY = 'APPLY_NEW_SETTINGS_SILENTLY',
  UPDATE_SETTINGS = 'UPDATE_SETTINGS',
  CLOSE_POPUP = 'CLOSE_POPUP',
  SELECT_TAB = 'SELECT_TAB',
  SWITCH_TAB = 'SWITCH_TAB',
  COMMAND = 'COMMAND',
}

interface CommandMessage {
  type: Message.COMMAND;
  command: Command;
}

export interface Handlers {
  [key: string]: (message?: unknown) => void;
  [Message.COMMAND]?: (message: CommandMessage) => void;
}

export interface UpdateSettingsPayload {
  newSettings: DefaultSettings;
}

export function updateSettings(payload: UpdateSettingsPayload) {
  return {type: Message.UPDATE_SETTINGS, ...payload};
}

export interface ApplyNewSettingsPayload {
  newSettings: DefaultSettings;
  tabsData: Tab[];
}

export function applyNewSettings(payload: ApplyNewSettingsPayload) {
  return {type: Message.APPLY_NEW_SETTINGS, ...payload};
}

export interface ApplyNewSettingsSilentlyPayload {
  newSettings: DefaultSettings;
}

export function applyNewSettingsSilently(payload: ApplyNewSettingsSilentlyPayload) {
  return {type: Message.APPLY_NEW_SETTINGS_SILENTLY, ...payload};
}

export interface SwitchTabPayload {
  selectedTab: Tab;
}

export function switchTab(payload: SwitchTabPayload) {
  return {type: Message.SWITCH_TAB, ...payload};
}

export interface SelectTabPayload {
  tabsData: Tab[];
  increment: number;
}

export function selectTab(payload: SelectTabPayload) {
  return {type: Message.SELECT_TAB, ...payload};
}

export function closePopup() {
  return {type: Message.CLOSE_POPUP};
}

export function command(cmd: Command): CommandMessage {
  return {type: Message.COMMAND, command: cmd};
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

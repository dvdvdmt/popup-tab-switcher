import {ITab} from './check-tab';

export default function isCodeExecutionForbidden(tab: ITab) {
  return /^(chrome:|view-source:|https?:\/\/chrome.google.com)/.test(tab.url);
}

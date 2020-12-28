// eslint-disable import/prefer-default-export
import path from 'path';
import {LaunchOptions} from 'puppeteer';

const pathToExtension = path.join(__dirname, '../../build-e2e');

export const config: LaunchOptions = {
  executablePath: process.env.PUPPETEER_EXEC_PATH,
  headless: false,
  slowMo: process.env.CI ? 100 : 20,
  defaultViewport: null,
  args: [
    `--disable-extensions-except=${pathToExtension}`,
    `--load-extension=${pathToExtension}`,
    '--no-sandbox',
    '--allow-file-access',
    '--allow-file-access-from-files',
    // '--auto-open-devtools-for-tabs',
  ],
};

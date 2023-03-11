import path from 'path'
import puppeteer from 'puppeteer'

const pathToExtension = path.join(__dirname, '../../build-e2e')

export const config: Parameters<typeof puppeteer.launch>[0] = {
  executablePath: process.env.PUPPETEER_EXEC_PATH,
  headless: false,
  slowMo: process.env.CI ? 120 : 20,
  defaultViewport: {width: 1280, height: 720, deviceScaleFactor: 1},
  args: [
    `--disable-extensions-except=${pathToExtension}`,
    `--load-extension=${pathToExtension}`,
    '--no-sandbox',
    '--allow-file-access',
    '--allow-file-access-from-files',
    // '--auto-open-devtools-for-tabs',
  ],
}

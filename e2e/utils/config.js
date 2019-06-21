import path from 'path';

const pathToExtension = path.join(__dirname, '../../build-e2e');
export const launchOptions = {
  headless: false,
  slowMo: 20,
  args: [
    `--disable-extensions-except=${pathToExtension}`,
    `--load-extension=${pathToExtension}`,
  ],
};

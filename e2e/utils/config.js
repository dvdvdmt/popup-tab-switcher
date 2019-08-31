import path from 'path';

const pathToExtension = path.join(__dirname, '../../build-e2e');
// eslint-disable-next-line import/prefer-default-export
export const launchOptions = {
  headless: false,
  slowMo: 20,
  args: [
    `--disable-extensions-except=${pathToExtension}`,
    `--load-extension=${pathToExtension}`,
  ],
};

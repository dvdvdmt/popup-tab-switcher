// eslint-disable import/prefer-default-export
import path from 'path';

const pathToExtension = path.join(__dirname, '../../build-e2e');

export default {
  headless: false,
  slowMo: 20,
  args: [
    `--disable-extensions-except=${pathToExtension}`,
    `--load-extension=${pathToExtension}`,
  ],
};

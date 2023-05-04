import { downloadURI } from '@vcmap/ui';
import { sleep } from '../common/util.js';
import { renderScreenshot } from './screenshotCreator.js';

/**
 * Function that creates a screenshot and applies the blobCreator function on the canvas which is returned by the screenshotCreator.
 * @param {import('@vcmap/ui').VcsUiApp} app The VcsUiApp instance
 * @param {import('vue').Ref<boolean>} runState State of plugin if a calculation is currently running
 * @param {number} width The width of the screenshot in pixels
 * @param {Function} createBlob Function for creating a blob.
 * @param {string} fileName Name of the file that is downloaded.
 */
export default async function createAndHandleBlob(
  app,
  runState,
  width,
  createBlob,
  fileName,
) {
  runState.value = true;
  await sleep();
  const canvas = await renderScreenshot(app, width);
  const blob = await createBlob(canvas);

  const url = URL.createObjectURL(blob);

  downloadURI(url, fileName);
  // release object URL since it is no longer needed -> can't be open in new tab.
  URL.revokeObjectURL(url);
  runState.value = false;
}

import { downloadURI, VcsUiApp } from '@vcmap/ui';
import { renderScreenshot } from '@vcmap/core';

/**
 * Function that creates a screenshot and applies the blobCreator function on the canvas which is returned by the screenshotCreator.
 * @param  app The VcsUiApp instance
 * @param  width The width of the screenshot in pixels
 * @param  createBlob Function for creating a blob.
 * @param  fileName Name of the file that is downloaded.
 */
export default async function createAndHandleBlob(
  app: VcsUiApp,
  width: number,
  createBlob: (canvas: HTMLCanvasElement) => Promise<Blob | null>,
  fileName: string,
): Promise<void> {
  const canvas = await renderScreenshot(app, width);
  const blob = await createBlob(canvas);
  const url = URL.createObjectURL(blob!);

  downloadURI(url, fileName);
  // release object URL since it is no longer needed -> can't be open in new tab.
  URL.revokeObjectURL(url);
}

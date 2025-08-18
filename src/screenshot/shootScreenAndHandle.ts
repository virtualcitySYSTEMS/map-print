import type { VcsUiApp } from '@vcmap/ui';
import { downloadURI } from '@vcmap/ui';
import { renderScreenshot } from '@vcmap/core';
import type { CanvasAndPlacement } from '../pdf/pdfCreator.js';

/**
 * Adds elements as overlays on the main Map canvas.
 * @param mapCanvas The canvas of the Map.
 * @param overlays The elements to overlay on the Map.
 * @returns The Map canvas with the elements overlaying it.
 */
function addOverlayCanvasToMap(
  mapCanvas: HTMLCanvasElement,
  overlays: CanvasAndPlacement[],
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = mapCanvas.width;
  canvas.height = mapCanvas.height;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(mapCanvas, 0, 0, mapCanvas.width, mapCanvas.height);
  overlays.forEach((overlay) => {
    ctx.drawImage(
      overlay.canvas,
      overlay.placement.coords.x * canvas.width,
      overlay.placement.coords.y * canvas.height,
      overlay.placement.size.width * canvas.width,
      overlay.placement.size.height * canvas.height,
    );
  });
  return canvas;
}

/**
 * Function that creates a screenshot and applies the blobCreator function on the canvas which is returned by the screenshotCreator.
 * @param app The VcsUiApp instance
 * @param width The width of the screenshot in pixels
 * @param createBlob Function for creating a blob.
 * @param fileName Name of the file that is downloaded.
 * @param overlays The elements to overlay on the Map canvas..
 */
export default async function createAndHandleBlob(
  app: VcsUiApp,
  width: number,
  createBlob: (
    canvas: HTMLCanvasElement,
    translate: (s: string) => string,
  ) => Promise<Blob | null>,
  fileName: string,
  overlays?: CanvasAndPlacement[],
): Promise<void> {
  let canvas = await renderScreenshot(app, width);
  if (overlays) {
    canvas = addOverlayCanvasToMap(canvas, overlays);
  }
  const blob = await createBlob(canvas, (s) => app.vueI18n.t(s));
  const url = URL.createObjectURL(blob!);

  downloadURI(url, fileName);
  // release object URL since it is no longer needed -> can't be open in new tab.
  URL.revokeObjectURL(url);
}

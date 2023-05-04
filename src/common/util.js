import { CesiumMap, ObliqueMap, OpenlayersMap } from '@vcmap/core';

/**
 * Helps when ui freezes
 * @returns {Promise} Promise that is immediately resolved
 */
export async function sleep() {
  return new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
}

/**
 * Convert svg image to png.
 * @param {string} svgPath The path to the svg image.
 * @param {number} height Height in pixels of the resulting png.
 * @returns {Promise<string>} png as base64 string.
 */
export async function svgToPng(svgPath, height) {
  // might need to be extended by the firefox handling mentioned here
  // https://stackoverflow.com/questions/3975499/convert-svg-to-image-jpeg-png-etc-in-the-browser/64800570#64800570
  const img = new Image();
  img.src = svgPath;
  await img.decode();
  const aspectRatio = img.width / img.height;
  const width = height * aspectRatio;
  // draw svg on canvas
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const canvasCtx = canvas.getContext('2d');
  canvasCtx.drawImage(img, 0, 0, width, height);
  // clean up
  img.remove();
  // convert canvas to png and return
  return canvas.toDataURL('image/png');
}

/**
 * Calculates aspect ratio.
 * @param {import("@vcmap/core").VcsMap} map A VcsMap instance
 * @returns {number} The aspect ratio (width/height) of the map
 */
export function getMapAspectRatio(map) {
  let width;
  let height;
  if (map instanceof CesiumMap) {
    ({ width, height } = map.getCesiumWidget().scene.canvas);
  } else if (map instanceof OpenlayersMap || map instanceof ObliqueMap) {
    ({ width, height } = Array.from(
      map.olMap.getViewport().querySelectorAll('.ol-layer canvas'),
    ).reduce((acc, val) => (acc.width > val.width ? val : acc)));
  } else {
    throw new Error('map not supported');
  }
  return width / height;
}

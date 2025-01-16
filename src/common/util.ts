import { CesiumMap, ObliqueMap, OpenlayersMap, VcsMap } from '@vcmap/core';

/**
 * Convert svg image to png.
 * @param svgPath The path to the svg image.
 * @param height Height in pixels of the resulting png.
 * @returns png as base64 string.
 */
export async function svgToPng(
  svgPath: string,
  height: number,
): Promise<string> {
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
  const canvasCtx = canvas.getContext('2d')!;
  canvasCtx.drawImage(img, 0, 0, width, height);
  // clean up
  img.remove();
  // convert canvas to png and return
  return canvas.toDataURL('image/png');
}

/**
 * Calculates aspect ratio.
 * @param map A VcsMap instance
 * @returns The aspect ratio (width/height) of the map
 */
export function getMapAspectRatio(map: VcsMap): number {
  let width;
  let height;
  if (map instanceof CesiumMap) {
    ({ width, height } = map.getCesiumWidget()!.scene.canvas);
  } else if (map instanceof OpenlayersMap || map instanceof ObliqueMap) {
    const canvas = Array.from(
      map
        .olMap!.getViewport()
        .querySelectorAll<HTMLCanvasElement>('.ol-layer canvas'),
    );
    ({ width, height } = canvas.reduce((acc, val) =>
      acc.width > val.width ? val : acc,
    ));
  } else {
    throw new Error('map not supported');
  }
  return width / height;
}

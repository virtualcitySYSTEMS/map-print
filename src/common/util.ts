import { CesiumMap, ObliqueMap, OpenlayersMap, VcsMap } from '@vcmap/core';
import DOMPurify from 'dompurify';
import { Size } from '../pdf/pdfCreator.js';

/**
 * @param input The SVG path.
 * @returns The SVG string.
 */
async function getSvgString(input: string): Promise<string> {
  if (input.startsWith('data:image/svg+xml;base64')) {
    const base64Data = input.split('base64,')[1];
    return atob(base64Data);
  } else if (input.startsWith('data:image/svg+xml,')) {
    return decodeURIComponent(input.slice(19));
  } else if (input.startsWith('<svg')) {
    return input;
  } else {
    // Assume file path
    const response = await fetch(input);
    return response.text();
  }
}

/**
 * @param svgPath The path of the SVG.
 * @returns The image size.
 * @throws If the SVG has no viewbox.
 */
async function getSizeFromViewBox(svgPath: string): Promise<Size> {
  const svgString = await getSvgString(svgPath);
  const cleanSvg = DOMPurify.sanitize(svgString);
  const parser = new DOMParser();
  const svgDoc = parser.parseFromString(cleanSvg, 'image/svg+xml');
  const viewBox = svgDoc.documentElement.getAttribute('viewBox');
  if (viewBox) {
    const [, , width, height] = viewBox.split(' ').map(Number);
    return { width, height };
  } else {
    // no width/height, no viewbox, not possible to determine dimensions
    throw new Error('Impossible to determine image dimensions');
  }
}

/**
 * Convert svg image to png.
 * @param svgPath The path to the svg image.
 * @param maxHeight Optional, the maximum height in pixels of the resulting png. If not set, the naturalHeight of the image will be used.
 * @returns png as base64 string.
 * @throws If the SVG aspect ratio cannot be determined.
 */
export async function svgToPng(
  svgPath: string,
  maxHeight?: number,
): Promise<string> {
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.src = svgPath;
  await img.decode();
  let aspectRatio;
  let imgHeight;
  if (img.width && img.height) {
    // use width and height for aspect ratio, if available
    aspectRatio = img.width / img.height;
    imgHeight = img.height;
  } else {
    // if not, read viewBox (in Firefox if no width and height in svg tag)
    const { height, width } = await getSizeFromViewBox(svgPath);
    imgHeight = height;
    aspectRatio = width / height;
  }
  const height = maxHeight ?? imgHeight;
  const width = height * aspectRatio;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0, width, height);
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

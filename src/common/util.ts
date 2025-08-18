import type { VcsMap } from '@vcmap/core';
import { CesiumMap, ObliqueMap, OpenlayersMap, PanoramaMap } from '@vcmap/core';
import { getLogger } from '@vcsuite/logger';
import DOMPurify from 'dompurify';
import type { Size } from '../pdf/pdfCreator.js';
import { name } from '../../package.json';

/** PPI of JSPDF for calculaing e.g. fontsize */
export const JSPDF_PPI = 72;

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
 * @param src The src of the image to be created.
 * @param maxHeight Optional - the maximum height of the image, for SVG files. If not set, the natural height of the image will be used.
 * @returns The created image, or undefined if the SVG conversion fails.
 */
export async function createImageFromSrc(
  src: string,
  maxHeight?: number,
): Promise<HTMLImageElement | undefined> {
  try {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    // .svg file extension, <svg tag OR image/svg as in base64 encoded svg files.
    if (/([.<]|%3C)svg/gi.test(src) || /image\/svg/i.test(src)) {
      img.src = src;
      await img.decode();
      let aspectRatio;
      let imgHeight;
      if (img.width && img.height) {
        // use width and height for aspect ratio, if available
        aspectRatio = img.width / img.height;
        imgHeight = img.height;
      } else {
        // if not, read viewBox (in Firefox if no width and height in svg tag)
        const { height, width } = await getSizeFromViewBox(src);
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
      img.src = canvas.toDataURL('image/png');
      await img.decode();
      return img;
    }
    img.src = src;
    await img.decode();
    return img;
  } catch (error) {
    getLogger(name).error('Error while creating image: ', error);
    return undefined;
  }
}

/**
 * Calculates map size.
 * @param map A VcsMap instance
 * @returns The map size (width, height) of the map
 */
export function getMapSize(map: VcsMap): Size {
  let width;
  let height;
  if (map instanceof CesiumMap || map instanceof PanoramaMap) {
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
  return { width, height };
}

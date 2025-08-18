import { PanoramaMap } from '@vcmap/core';
import type {
  ImageLegendItem,
  LegendEntry,
  LegendItem,
  StyleLegendItem,
  VcsUiApp,
} from '@vcmap/ui';
import {
  getAttributions,
  LegendType,
  NotificationType,
  // @ts-expect-error {no exported member VcsDefaultLogo because of bug in UI. Issue 664}
  VcsDefaultLogo,
} from '@vcmap/ui';
import { getLogger } from '@vcsuite/logger';
import html2canvas from 'html2canvas';
import { createImageFromSrc } from '../common/util.js';
import type { ContactInfo } from '../common/configManager.js';
import type {
  CanvasAndPlacement,
  PrintableLegendItems,
  Size,
  TextWithHeader,
} from './pdfCreator.js';
import { name } from '../../package.json';

/**
 * Adds prefixes to mail, phone and fax information.
 * @param app VcsUiApp instance.
 * @param contactInfo The contact informations.
 * @returns The fomratted contact information to be printed on the pdf file.
 */
export function formatContactInfo(
  app: VcsUiApp,
  contactInfo: ContactInfo,
): TextWithHeader {
  return {
    header: app.vueI18n.t('print.pdf.content.contact.header'),
    text: Object.keys(contactInfo)
      .filter((key) => contactInfo[key as keyof ContactInfo])
      .map((key) => {
        const value = contactInfo[key as keyof ContactInfo]!;
        switch (key) {
          case 'mail':
            return `${app.vueI18n.t('print.pdf.content.contact.mail')}: ${value}`;
          case 'phone':
            return `${app.vueI18n.t('print.pdf.content.contact.phone')}: ${value}`;
          case 'fax':
            return `${app.vueI18n.t('print.pdf.content.contact.fax')}: ${value}`;
          default:
            return value;
        }
      }),
  };
}

/**
 * Gets the logo to be printed on the PDF.
 * @param app VcsUiApp instance.
 * @returns Either the logo defined in the config or the default VCS logo.
 * @throws Will throw error if decoding failes.
 */
export async function getLogo(app: VcsUiApp): Promise<HTMLImageElement> {
  const mapLogo = app.uiConfig?.config?.logo ?? VcsDefaultLogo;
  // 120 px is the height of the logo in 300 dpi in portrait mode.
  const logo = await createImageFromSrc(mapLogo, 120);
  if (!logo) {
    throw new Error('Failed to decode logo');
  }
  return logo;
}

/**
 * Get informations about the current map view.
 * @param app The vcs ui app.
 * @returns Information about the map that can be displayed in mapInfo text element.
 */
export async function getMapInfo(
  app: VcsUiApp,
): Promise<TextWithHeader | undefined> {
  const header = app.vueI18n.t('print.pdf.content.mapInfo');
  const viewpoint = await app.maps.activeMap?.getViewpoint();
  const groundPosition = viewpoint?.groundPosition;
  const cameraPosition = viewpoint?.cameraPosition;

  if (groundPosition) {
    const coordinates = `${app.vueI18n.t(
      'print.pdf.content.centerCoordinate',
    )}: ${groundPosition[0].toFixed(4)}, ${groundPosition[1].toFixed(4)}`;
    // text can be extended by other informations like layers
    return { header, text: [coordinates] };
  } else if (cameraPosition && app.maps.activeMap instanceof PanoramaMap) {
    const coordinates = `${app.vueI18n.t(
      'print.pdf.content.cameraCoordinate',
    )}: ${cameraPosition[0].toFixed(4)}, ${cameraPosition[1].toFixed(4)}`;
    return { header, text: [coordinates] };
  } else {
    getLogger(name).error('Map center cannot be determined');
    return undefined;
  }
}

/**
 * Get all unique tuples of provider and year for all sources.
 * @param app The vcs ui app.
 * @returns A string containing unique tuples of provider and year for all sources.
 */
export function getCopyright(app: VcsUiApp): string | undefined {
  const copyrightEntries = getAttributions(app).entries;
  if (copyrightEntries) {
    const copyright = copyrightEntries
      .map((entry) => {
        let provider;
        let year;
        if (Array.isArray(entry.attributions)) {
          ({ provider, year } = entry.attributions[0] || {});
        } else {
          ({ provider, year } = entry.attributions);
        }
        if (provider) {
          return year ? `@ ${provider} ${year}` : `@ ${provider}`;
        }
        return '';
      })
      .filter(Boolean);

    let filtered = [...new Set(copyright)].join(' | ');
    if (filtered[filtered.length - 1] === '| ') {
      filtered = filtered.slice(0, filtered.length - 2);
    }
    return filtered;
  }
  return undefined;
}
/**
 * Creates a canvas and its placement (as a ration of the mapSize) for the given `windowId`.
 * @param windowId The `id` of the window to return as a canvas.
 * @param mapSize The Size of the map to be rendered.
 * @param resolution The user-selected resolution.
 * @returns An object, containing the canvas and its placement.
 *  /!\ The returned coords and size are a ratio based on the mapSize.
 */
export async function getWindowsCanvas(
  windowId: string,
  mapSize: Size,
  resolution: number,
): Promise<CanvasAndPlacement | undefined> {
  const elementId = `window-component--${windowId}`;
  const infoElement = document.getElementById(elementId);
  if (infoElement) {
    const {
      // Height with the bottom arrow of a balloon
      scrollHeight: hTot,
      // Height without the arrow
      offsetHeight: h,
      scrollWidth: w,
      style,
    } = infoElement;
    const { right: r, bottom: b, left: l, top: t } = style;

    const size = { width: w / mapSize.width, height: hTot / mapSize.height };
    const left = +l.slice(0, -2);
    const bottom = +b.slice(0, -2);
    const right = +r.slice(0, -2);
    const top = +t.slice(0, -2);

    let coords;
    if (Number.isFinite(left) && Number.isFinite(top)) {
      coords = {
        x: left / mapSize.width,
        y: top / mapSize.height,
      };
    } else if (Number.isFinite(left) && Number.isFinite(bottom)) {
      coords = {
        x: left / mapSize.width,
        y: (mapSize.height - (bottom + h)) / mapSize.height,
      };
    } else if (Number.isFinite(right) && Number.isFinite(top)) {
      coords = {
        x: (mapSize.width - (w + right)) / mapSize.width,
        y: top / mapSize.height,
      };
    } else {
      return undefined;
    }
    const canvas = await html2canvas(infoElement, {
      logging: false,
      scale: resolution / 96,
      height: hTot,
      width: w,
      backgroundColor: null,
    });
    return { canvas, placement: { size, coords } };
  }
  getLogger(name).warning(
    `An error occured while getting window with id "${windowId}"`,
  );
  return undefined;
}

export function isImageLegendItem(item: LegendItem): item is ImageLegendItem {
  return item.type === LegendType.Image;
}
export function isStyleLegendItem(item: LegendItem): item is StyleLegendItem {
  return item.type === LegendType.Style;
}

/**
 * Adds a notification letting the user know that the iframe legend is not supported.
 * @param app The VcsUiApp.
 * @param title The title of the layer for which to add a notification.
 */
function notifyIframeNotSupported(app: VcsUiApp, title: string): false {
  app.notifier.add({
    type: NotificationType.INFO,
    title: app.vueI18n.t(title),
    message: app.vueI18n.t('print.pdf.iframeNotSupported'),
  });
  return false;
}

/**
 * Parses the passed legend entries to return the printable legend items.
 * @param app The VcsUiApp.
 * @param entries The LegendEntries.
 * @returns An array of object, with the layer title and its legend items.
 */
export function parseLegend(
  app: VcsUiApp,
  entries: LegendEntry[],
): PrintableLegendItems {
  return entries
    .map(({ title, legend }) => ({
      title: app.vueI18n.t(title),
      legends: legend
        .filter(
          (l) =>
            isImageLegendItem(l) ||
            isStyleLegendItem(l) ||
            notifyIframeNotSupported(app, title),
        )
        .map((l) =>
          isImageLegendItem(l) ? { ...l, src: app.vueI18n.t(l.src) } : l,
        ),
    }))
    .filter((item) => !!item.legends.length);
}

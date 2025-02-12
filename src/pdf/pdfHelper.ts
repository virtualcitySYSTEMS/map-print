import {
  getAttributions,
  ImageLegendItem,
  LegendEntry,
  LegendItem,
  LegendType,
  NotificationType,
  StyleLegendItem,
  // @ts-expect-error {no exported member VcsDefaultLogo because of bug in UI. Issue 664}
  VcsDefaultLogo,
  VcsUiApp,
} from '@vcmap/ui';
import { getLogger } from '@vcsuite/logger';
import { createImageFromSrc } from '../common/util.js';
import { ContactInfo } from '../common/configManager.js';
import { PrintableLegendItems, TextWithHeader } from './pdfCreator.js';
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
            return `${app.vueI18n.t(
              'print.pdf.content.contact.mail',
            )}: ${value}`;
          case 'phone':
            return `${app.vueI18n.t(
              'print.pdf.content.contact.phone',
            )}: ${value}`;
          case 'fax':
            return `${app.vueI18n.t(
              'print.pdf.content.contact.fax',
            )}: ${value}`;
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
  const coordinatesTitle = app.vueI18n.t('print.pdf.content.centerCoordinate');
  const viewpoint = await app.maps.activeMap?.getViewpoint();
  const groundPosition = viewpoint?.groundPosition;
  if (groundPosition) {
    const coordinates = `${coordinatesTitle}: ${groundPosition[0].toFixed(4)}, ${groundPosition[1].toFixed(4)}`;
    return {
      header: app.vueI18n.t('print.pdf.content.mapInfo'),
      // text can be extended by other informations like layers
      text: [coordinates],
    };
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

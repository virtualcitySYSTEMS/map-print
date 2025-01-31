import {
  getAttributions,
  ImageLegendItem,
  LegendType,
  NotificationType,
  // @ts-expect-error {no exported member VcsDefaultLogo because of bug in UI. Issue 664}
  VcsDefaultLogo,
  VcsUiApp,
} from '@vcmap/ui';
import { getLogger } from '@vcsuite/logger';
import { FeatureLayer, Layer } from '@vcmap/core';
import { svgToPng } from '../common/util.js';
import { ContactInfo } from '../common/configManager.js';
import { LegendEntries, LegendItems, TextWithHeader } from './pdfCreator.js';
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
  const logo = new Image();
  logo.crossOrigin = 'anonymous';
  const mapLogo = app.uiConfig?.config?.logo ?? VcsDefaultLogo;
  // .svg file extension, <svg tag OR image/svg as in base64 encoded svg files.
  if (/([.<]|%3C)svg/gi.test(mapLogo) || /image\/svg/i.test(mapLogo)) {
    // 120 px is the height of the logo in 300 dpi in portrait mode.
    logo.src = await svgToPng(mapLogo, 120);
  } else {
    logo.src = mapLogo;
  }
  await logo.decode();
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

/**
 * @param app The VcsUiApp.
 * @returns The active layers with a legend.
 */
export function getActiveLegends(app: VcsUiApp): Layer[] {
  return [...app.layers].filter(
    (l) =>
      l.active &&
      l.isSupported(app.maps.activeMap!) &&
      (l.properties?.legend ||
        (l instanceof FeatureLayer && l.style?.properties?.legend)),
  );
}

/**
 * Get all legend items from active and supported layers.
 * @param app The VcsUiApp.
 * @returns An array of object, with the layer title and its legend.
 */
export function getLegendItems(app: VcsUiApp): LegendItems | undefined {
  const activeLayersWithLegend = getActiveLegends(app);
  if (activeLayersWithLegend.length) {
    return activeLayersWithLegend.map((l) => {
      const layerTitle = app.vueI18n.t(
        (l.properties?.title ?? l.name) as string,
      );
      const legends = (
        l instanceof FeatureLayer && l.style?.properties?.legend
          ? l.style?.properties?.legend
          : l.properties?.legend
      ) as LegendEntries;
      const localizedLegends = legends
        .filter((legend) => {
          if (legend.type === LegendType.Iframe) {
            app.notifier.add({
              type: NotificationType.INFO,
              title: layerTitle,
              message: app.vueI18n.t('print.pdf.iframeNotSupported'),
            });
            return false;
          }
          return true;
        })
        .map((legend) => {
          let src;
          if (legend.type === LegendType.Image) {
            src = app.vueI18n.t((legend as ImageLegendItem).src);
          }
          return {
            ...legend,
            ...(src && { src }),
          };
        });

      return {
        title: layerTitle,
        legends: localizedLegends as LegendEntries,
      };
    });
  }
  return undefined;
}

import defaultLogo from '@vcmap/ui/src/assets/logo.svg';
import { svgToPng } from '../common/util.js';

/**
 * Adds prefixes to mail, phone and fax information.
 * @param {import("@vcmap/ui").VcsUiApp} app VcsUiApp instance.
 * @param {import("@vcmap/ui").VcsPlugin} plugin The print plugin.
 * @param {import("../common/configManager").ContactInfo} contactInfo The contact informations.
 * @returns {import("../pdf/pdfCreator").TextWithHeader} The fomratted contact information to be printed on the pdf file.
 */
export function formatContactInfo(app, plugin, contactInfo) {
  return {
    header: plugin.i18n[app.locale].print.pdf.content.contact.header,
    text: Object.keys(contactInfo)
      .filter((key) => contactInfo[key])
      .map((key) => {
        const value = contactInfo[key];
        switch (key) {
          case 'mail':
            return `${
              plugin.i18n[app.locale].print.pdf.content.contact.mail
            }: ${value}`;
          case 'phone':
            return `${
              plugin.i18n[app.locale].print.pdf.content.contact.phone
            }: ${value}`;
          case 'fax':
            return `${
              plugin.i18n[app.locale].print.pdf.content.contact.fax
            }: ${value}`;
          default:
            return value;
        }
      }),
  };
}

/**
 * Gets the logo to be printed on the PDF.
 * @param {import("@vcmap/ui").VcsUiApp} app VcsUiApp instance.
 * @returns {Promise<HTMLImageElement>} Either the logo defined in the config or the default VCS logo.
 */
export async function getLogo(app) {
  const logo = new Image();
  const mapLogo = app.uiConfig?.config?.value?.logo;
  const logoSrc = mapLogo || defaultLogo;
  // .svg file extension, <svg tag OR image/svg as in base64 encoded svg files.
  if (/([.<]|%3C)svg/gi.test(logoSrc) || /image\/svg/i.test(logoSrc)) {
    // 120 px is the height of the logo in 300 dpi in portrait mode.
    logo.src = await svgToPng(logoSrc, 120);
  } else {
    logo.src = mapLogo;
  }
  await logo.decode();
  return logo;
}

/**
 * Get informations about the current map view.
 * @param {import("@vcmap/core").VcsApp} app The vcs ui app.
 * @param {import("@vcmap/ui").VcsPlugin} plugin The print plugin.
 * @returns {Promise<import("./pdfCreator").TextWithHeader>} Information about the map that can be displayed in mapInfo text element.
 */
export async function getMapInfo(app, plugin) {
  const coordinatesTitle =
    plugin.i18n[app.locale].print.pdf.content.centerCoordinate;
  const viewpoint = await app.maps.activeMap.getViewpoint();
  const { groundPosition } = viewpoint;
  const coordinates = `${coordinatesTitle}: ${groundPosition[0].toFixed(
    4,
  )}, ${groundPosition[1].toFixed(4)}`;
  return {
    header: plugin.i18n[app.locale].print.pdf.content.mapInfo,
    text: [
      coordinates,
      // can be extended by other informations like layers
    ],
  };
}

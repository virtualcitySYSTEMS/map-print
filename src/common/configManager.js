import { parseBoolean, parseEnumValue } from '@vcsuite/parsers';
import { check, maybe, ofEnum, oneOf, strict } from '@vcsuite/check';
import { reactive } from 'vue';
import { getLogger } from '@vcsuite/logger';
import standardPageSizes from '../pdf/standardPageSizes.js';
import getDefaultOptions from '../defaultOptions.js';

/**
 * Enumeration of allowed orientations.
 * @enum {string}
 * @property {string} LANDSCAPE - Always landscape orientation.
 * @property {string} PORTRAIT - Always portrait orientation.
 * @property {string} BOTH - User can select between landscape and portrait.
 * @export
 */
export const OrientationOptions = {
  LANDSCAPE: 'landscape',
  PORTRAIT: 'portrait',
  BOTH: 'both',
};

/**
 * @typedef {Object} ContactInfo Contact information printed on pdf.
 * @property {string} department - The department
 * @property {string} name - Name of company or city administration
 * @property {string} streetAddress - Name of street and number
 * @property {string} zipAndCity - Postal code and city
 * @property {string} country - Name of Country
 * @property {string} mail - Mail address
 * @property {string} phone - Phone number
 * @property {string} fax - Fax number
 */

/**
 * Possible contact keys with corresponding type
 * @type {Record<string, import("@vcsuite/check").Pattern>}
 */
export const contactKeysPattern = {
  department: maybe(String),
  name: maybe(String),
  streetAddress: maybe(String),
  zipAndCity: maybe(String),
  country: maybe(String),
  mail: maybe(String),
  phone: maybe(String),
  fax: maybe(String),
};

/**
 * @typedef {Object} PrintConfig Configuration options of the print plugin.
 * @property {Array<string>} formatList List of page formates the user can select from.
 * @property {string} formatDefault The default format. Needs to be in formatList.
 * @property {Array<number>} ppiList List of ppi values the user can select from.
 * @property {number} ppiDefault The default ppi value. Needs to be in ppiList.
 * @property {string} orientationOptions "landscape", "portrait" or both. If both, user can select from portrait and landscape. Otherwise the selected option is always used.
 * @property {string} orientationDefault The default orientation if orientationOptions is "both". Either "landscape" or "portrait".
 * @property {boolean} allowTitle Whether user can insert title or not.
 * @property {boolean} allowDescription Whether user can insert description or not.
 * @property {boolean} printLogo Whether map logo should be printed in header.
 * @property {boolean} printMapInfo Whether map info should be printed on pdf.
 * @property {Array<number>} resolutionList List of resolution the user can choose from for image/jpg creation.
 * @property {number} resolutionDefault The default resolution. Needs to be in resolutionList.
 * @property {ContactInfo} [contactDetails] The contact information to be printed on pdf.
 * @property {boolean} printCopyright Whether copyright should be printed on pdf or not.
 */

/**
 * @typedef {Object} PrintState
 * @property {string} selectedFormat
 * @property {number} selectedPpi
 * @property {string} selectedOrientation
 * @property {string} title
 * @property {string} description
 * @property {number} selectedResolution
 */

/**
 * Parses the default config as well as the custom map plugin config and merges them.
 * @param {PrintConfig} pluginConfig The config which is defined when setting up the map.
 * @param {PrintConfig} defaultOptions The default plugin config inside the source code of the plugin.
 * @returns {{pluginConfig: PrintConfig, pluginState: PrintState}} Setup config and state of the plugin.
 */
export function getConfigAndState(pluginConfig, defaultOptions) {
  /**
   * available format list;
   * @type {Array<string>}
   * @example ['A2', 'A3', 'A4', 'A5']
   * @api
   */
  const formatList = pluginConfig.formatList || defaultOptions.formatList;

  /**
   * The default page format
   * @type {string}
   * @example 'A4'
   */
  const formatDefault =
    pluginConfig.formatDefault || defaultOptions.formatDefault;

  /**
   * available values for pixel per inch (PPI)
   * @type {Array<number>}
   * @example [75, 150, 300, 450, 600]
   */
  const ppiList = pluginConfig.ppiList || defaultOptions.ppiList;

  /**
   * The default value for pixel per inch (PPI)
   * @type {number}
   * @example 300
   */
  const ppiDefault = pluginConfig.ppiDefault || defaultOptions.ppiDefault;

  /**
   * @type {string}
   * @example "both"
   */
  const orientationOptions = parseEnumValue(
    pluginConfig.orientationOptions,
    OrientationOptions,
    defaultOptions.orientationOptions,
  );

  /**
   * @type {string}
   * @example "landscape"
   */
  const orientationDefault =
    orientationOptions !== OrientationOptions.BOTH
      ? // if the OrientationOption is not BOTH, the default orientation equals the OrientationOption
        orientationOptions
      : parseEnumValue(
          pluginConfig.orientationDefault,
          OrientationOptions,
          defaultOptions.orientationDefault,
        );

  /**
   * Whether the user should be able to add title or not.
   * @type {boolean}
   */
  const allowTitle = parseBoolean(
    pluginConfig.allowTitle,
    defaultOptions.allowTitle,
  );

  /**
   * Whether the user should be able to add description or not.
   * @type {boolean}
   */
  const allowDescription = parseBoolean(
    pluginConfig.allowDescription,
    defaultOptions.allowDescription,
  );

  /**
   * Whether logo should be printed on pdf or not.
   * @type {boolean}
   */
  const printLogo = parseBoolean(
    pluginConfig.printLogo,
    defaultOptions.printLogo,
  );

  /**
   * Whether copyright should be printed on pdf or not.
   * @type {boolean}
   */
  const printCopyright = parseBoolean(
    pluginConfig.printCopyright,
    defaultOptions.printCopyright,
  );

  /**
   * Whether map information should be printed on pdf or not.
   * @type {boolean}
   */
  const printMapInfo = parseBoolean(
    pluginConfig.printMapInfo,
    defaultOptions.printMapInfo,
  );

  // screenshot
  /**
   * Available resolutions for screenshot. The value is always the longest side of the image.
   * @type {Array<number>}
   */
  const resolutionList =
    pluginConfig.resolutionList || defaultOptions.resolutionList;

  /**
   * The default resolution
   * @type {number}
   * @example 1920
   */
  const resolutionDefault =
    pluginConfig.resolutionDefault || defaultOptions.resolutionDefault;

  /**
   * The contact information to be printed on pdf
   * @type {ContactInfo}
   * @example ['Virtual City Systems', 'Tauentzienstr. 7 b/c', '10789 Berlin', 'Germany', 'Tel.: +49 30 89048710']
   */
  const contactDetails =
    pluginConfig.contactDetails || defaultOptions.contactDetails;

  return {
    // setup configuration of the plugin
    pluginConfig: {
      formatList,
      formatDefault,
      ppiList,
      ppiDefault,
      orientationOptions,
      orientationDefault,
      allowTitle,
      allowDescription,
      printLogo,
      printCopyright,
      printMapInfo,
      contactDetails,
      // screenshot
      resolutionList,
      resolutionDefault,
    },
    // initial and reactive state of the plugin.
    pluginState: reactive({
      selectedFormat: formatDefault,
      selectedPpi: ppiDefault,
      selectedOrientation: orientationDefault,
      title: '',
      description: '',
      // screenshot
      selectedResolution: resolutionDefault,
    }),
  };
}

/**
 * @param {PrintConfig} options
 */
export function validate(options) {
  const defaultOptions = getDefaultOptions();
  try {
    check(
      options.formatList,
      maybe([oneOf(...Object.keys(standardPageSizes))]),
    );
    const formatList = options.formatList || defaultOptions.formatList;
    check(options.formatDefault, maybe(oneOf(...formatList)));
    check(options.ppiList, maybe([Number]));
    const ppiList = options.ppiList || defaultOptions.ppiList;
    check(options.ppiDefault, maybe(oneOf(...ppiList)));
    check(options.orientationOptions, maybe(ofEnum(OrientationOptions)));
    check(
      options.orientationDefault,
      maybe(oneOf(OrientationOptions.LANDSCAPE, OrientationOptions.PORTRAIT)),
    );
    check(options.allowTitle, maybe(Boolean));
    check(options.allowDescription, maybe(Boolean));
    check(options.printLogo, maybe(Boolean));
    check(options.printCopyright, maybe(Boolean));
    check(options.printMapInfo, maybe(Boolean));
    check(options.resolutionList, maybe([Number]));
    const resolutionList =
      options.resolutionList || defaultOptions.resolutionList;
    check(options.resolutionDefault, maybe(oneOf(...resolutionList)));
    check(options.contactDetails, maybe(strict(contactKeysPattern)));
  } catch (err) {
    getLogger('@vcmap/print').error('Invalid config', err);
  }
}

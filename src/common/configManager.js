import { parseBoolean, parseEnumValue } from '@vcsuite/parsers';
import { check, checkMaybe } from '@vcsuite/check';
import { reactive } from 'vue';
import standardPageSizes from '../pdf/standardPageSizes.js';

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
 * @type {Object<string,Array<StringConstructor|undefined>>}
 */
export const contactKeysPattern = {
  department: [String, undefined],
  name: [String, undefined],
  streetAddress: [String, undefined],
  zipAndCity: [String, undefined],
  country: [String, undefined],
  mail: [String, undefined],
  phone: [String, undefined],
  fax: [String, undefined],
};

/**
 * @typedef {Object} printConfig Configuration options of the print plugin.
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
 */

/**
 * Parses the default config as well as the custom map plugin config and merges them.
 * @param {printConfig} pluginConfig The config which is defined when setting up the map.
 * @param {printConfig} defaultConfig The default plugin config inside the source code of the plugin.
 * @returns {Object<string,Object<string,*>>} Setup config and state of the plugin.
 */
export function getSetupAndState(pluginConfig, defaultConfig) {
  // perform validation
  pluginConfig.formatList?.every((value) =>
    check(value, Object.keys(standardPageSizes)),
  );
  checkMaybe(
    pluginConfig.formatDefault,
    pluginConfig.formatList || defaultConfig.formatList,
  );
  pluginConfig.ppiList?.every((value) => check(value, Number));
  checkMaybe(
    pluginConfig.ppiDefault,
    pluginConfig.ppiList || defaultConfig.ppiList,
  );
  checkMaybe(
    pluginConfig.orientationOptions,
    Object.values(OrientationOptions),
  );
  checkMaybe(
    pluginConfig.orientationDefault,
    Object.values(OrientationOptions).filter((value) => value !== 'both'),
  );
  checkMaybe(pluginConfig.allowTitle, Boolean);
  checkMaybe(pluginConfig.allowDescription, Boolean);
  checkMaybe(pluginConfig.printLogo, Boolean);
  checkMaybe(pluginConfig.printMapInfo, Boolean);
  pluginConfig.resolutionList?.every((value) => check(value, Number));
  checkMaybe(
    pluginConfig.resolutionDefault || defaultConfig.resolutionDefault,
    pluginConfig.resolutionList || defaultConfig.resolutionList,
  );
  checkMaybe(pluginConfig.contactDetails, contactKeysPattern, true);

  /**
   * available format list;
   * @type {Array<string>}
   * @example ['A2', 'A3', 'A4', 'A5']
   * @api
   */
  const formatList = pluginConfig.formatList || defaultConfig.formatList;

  /**
   * The default page format
   * @type {string}
   * @example 'A4'
   */
  const formatDefault =
    pluginConfig.formatDefault || defaultConfig.formatDefault;

  /**
   * available values for pixel per inch (PPI)
   * @type {Array<number>}
   * @example [75, 150, 300, 450, 600]
   */
  const ppiList = pluginConfig.ppiList || defaultConfig.ppiList;

  /**
   * The default value for pixel per inch (PPI)
   * @type {number}
   * @example 300
   */
  const ppiDefault = pluginConfig.ppiDefault || defaultConfig.ppiDefault;

  /**
   * @type {string}
   * @example "both"
   */
  const orientationOptions = parseEnumValue(
    pluginConfig.orientationOptions,
    OrientationOptions,
    defaultConfig.orientationOptions,
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
          defaultConfig.orientationDefault,
        );

  /**
   * Whether the user should be able to add title or not.
   * @type {boolean}
   */
  const allowTitle = parseBoolean(
    pluginConfig.allowTitle,
    defaultConfig.allowTitle,
  );

  /**
   * Whether the user should be able to add description or not.
   * @type {boolean}
   */
  const allowDescription = parseBoolean(
    pluginConfig.allowDescription,
    defaultConfig.allowDescription,
  );

  /**
   * Whether logo should be printed on pdf or not.
   * @type {boolean}
   */
  const printLogo = parseBoolean(
    pluginConfig.printLogo,
    defaultConfig.printLogo,
  );

  /**
   * Whether map information should be printed on pdf or not.
   * @type {boolean}
   */
  const printMapInfo = parseBoolean(
    pluginConfig.printMapInfo,
    defaultConfig.printMapInfo,
  );

  // screenshot
  /**
   * Available resolutions for screenshot. The value is always the longest side of the image.
   * @type {Array<number>}
   */
  const resolutionList =
    pluginConfig.resolutionList || defaultConfig.resolutionList;

  /**
   * The default resolution
   * @type {number}
   * @example 1920
   */
  const resolutionDefault =
    pluginConfig.resolutionDefault || defaultConfig.resolutionDefault;

  /**
   * The contact information to be printed on pdf
   * @type {ContactInfo}
   * @example ['Virtual City Systems', 'Tauentzienstr. 7 b/c', '10789 Berlin', 'Germany', 'Tel.: +49 30 89048710']
   */
  const contact = pluginConfig.contactDetails || undefined;

  return {
    // setup configuration of the plugin
    pluginSetup: {
      formatList,
      ppiList: ppiList.map((value) => ({ value, text: `${value} ppi` })),
      orientationOptions,
      allowTitle,
      allowDescription,
      printLogo,
      printMapInfo,
      contact,
      // screenshot
      resolutionList,
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

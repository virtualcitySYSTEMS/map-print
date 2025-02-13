import { parseBoolean, parseEnumValue } from '@vcsuite/parsers';
import { check, maybe, ofEnum, oneOf, Pattern, strict } from '@vcsuite/check';
import { reactive } from 'vue';
import { getLogger } from '@vcsuite/logger';
import standardPageSizes from '../pdf/standardPageSizes.js';
import getDefaultOptions from '../defaultOptions.js';
import { name } from '../../package.json';

/** Enumeration of allowed orientations. */
export enum OrientationOptions {
  /** Always landscape orientation. */
  LANDSCAPE = 'landscape',
  /** Always portrait orientation. */
  PORTRAIT = 'portrait',
  /** User can select between landscape and portrait. */
  BOTH = 'both',
}

/** Enumeration of allowed orientations for the legend. */
export enum LegendOrientationOptions {
  /** Always same orientation as the one choosed by the user. */
  SAME_AS_MAP = 'sameAsMap',
  /** Always landscape orientation. */
  LANDSCAPE = 'landscape',
  /** Always portrait orientation. */
  PORTRAIT = 'portrait',
}

export type LegendFormatOptions = keyof typeof standardPageSizes | 'sameAsMap';

/** Contact information printed on pdf. */
export type ContactInfo = {
  /** The department */
  department?: string;
  /** Name of company or city administration */
  name?: string;
  /** Name of street and number */
  streetAddress?: string;
  /** Postal code and city */
  zipAndCity?: string;
  /** Name of Country */
  country?: string;
  /** Mail address */
  mail?: string;
  /** Phone number */
  phone?: string;
  /** Phone number */
  fax?: string;
};

/** Possible contact keys with corresponding type */
export const contactKeysPattern: Record<string, Pattern> = {
  department: maybe(String),
  name: maybe(String),
  streetAddress: maybe(String),
  zipAndCity: maybe(String),
  country: maybe(String),
  mail: maybe(String),
  phone: maybe(String),
  fax: maybe(String),
};

/** Configuration options of the print plugin. */
export type PrintConfig = {
  /** List of page formates the user can select from. */
  formatList?: Array<keyof typeof standardPageSizes>;
  /** The default format. Needs to be in formatList. */
  formatDefault?: keyof typeof standardPageSizes;
  /** List of ppi values the user can select from. */
  ppiList?: Array<number>;
  /** The default ppi value. Needs to be in ppiList. */
  ppiDefault?: number;
  /** "landscape", "portrait" or both. If both, user can select from portrait and landscape. Otherwise the selected option is always used. */
  orientationOptions?: OrientationOptions;
  /** The default orientation if orientationOptions is "both". Either "landscape" or "portrait". */
  orientationDefault?:
    | OrientationOptions.LANDSCAPE
    | OrientationOptions.PORTRAIT;
  /** Whether user can insert title or not. */
  allowTitle?: boolean;
  /** Whether user can insert description or not. */
  allowDescription?: boolean;
  /** Whether map logo should be printed in header. */
  printLogo?: boolean;
  /** Whether map info should be printed on pdf. */
  printMapInfo?: boolean;
  /** List of resolution the user can choose from for image/jpg creation. */
  resolutionList?: Array<number>;
  /** The default resolution. Needs to be in resolutionList. */
  resolutionDefault?: number;
  /**  The contact information to be printed on PDF. */
  contactDetails?: ContactInfo;
  /** Whether copyright should be printed on pdf or not. */
  printCopyright?: boolean;
  /** Whether FeatureInfo windows should be printed on pdf or not. */
  printFeatureInfo?: boolean;
  /** Whether legend should be printed on pdf or not. */
  printLegend?: boolean;
  /** The page orienation for the legend entries. */
  legendOrientation?: LegendOrientationOptions;
  /** The page format for the legend entries. */
  legendFormat?: LegendFormatOptions;
};

export type PrintState = {
  selectedFormat: keyof typeof standardPageSizes;
  selectedPpi: number;
  selectedOrientation:
    | OrientationOptions.LANDSCAPE
    | OrientationOptions.PORTRAIT;
  title: string;
  description: string;
  selectedResolution: number;
};

/**
 * Parses the default config as well as the custom map plugin config and merges them.
 * @param  config The config which is defined when setting up the map.
 * @param  defaultOptions The default plugin config inside the source code of the plugin.
 * @returns Setup config and state of the plugin.
 */
export function getConfigAndState(
  config: PrintConfig,
  defaultOptions: Required<PrintConfig>,
): { config: Required<PrintConfig>; state: PrintState } {
  /**
   * available format list;
   * @example ['A2', 'A3', 'A4', 'A5']
   * @api
   */
  const formatList: Array<keyof typeof standardPageSizes> =
    config.formatList || defaultOptions.formatList;

  /**
   * The default page format
   * @example 'A4'
   */
  const formatDefault: keyof typeof standardPageSizes =
    config.formatDefault || defaultOptions.formatDefault;

  /**
   * available values for pixel per inch (PPI)
   * @example [75, 150, 300, 450, 600]
   */
  const ppiList: Array<number> = config.ppiList || defaultOptions.ppiList;

  /**
   * The default value for pixel per inch (PPI)
   * @example 300
   */
  const ppiDefault: number = config.ppiDefault || defaultOptions.ppiDefault;

  /**
   * @example "both"
   */
  const orientationOptions: OrientationOptions = parseEnumValue(
    config.orientationOptions,
    OrientationOptions,
    defaultOptions.orientationOptions,
  );

  /**
   * @example "landscape"
   */
  const orientationDefault:
    | OrientationOptions.LANDSCAPE
    | OrientationOptions.PORTRAIT =
    orientationOptions !== OrientationOptions.BOTH
      ? // if the OrientationOption is not BOTH, the default orientation equals the OrientationOption
        orientationOptions
      : (parseEnumValue(
          config.orientationDefault,
          OrientationOptions,
          defaultOptions.orientationDefault,
        ) as OrientationOptions.LANDSCAPE | OrientationOptions.PORTRAIT);

  /**
   * Whether the user should be able to add title or not.
   */
  const allowTitle: boolean = parseBoolean(
    config.allowTitle,
    defaultOptions.allowTitle,
  );

  /**
   * Whether the user should be able to add description or not.
   */
  const allowDescription: boolean = parseBoolean(
    config.allowDescription,
    defaultOptions.allowDescription,
  );

  /**
   * Whether logo should be printed on pdf or not.
   */
  const printLogo: boolean = parseBoolean(
    config.printLogo,
    defaultOptions.printLogo,
  );

  /**
   * Whether copyright should be printed on pdf or not.
   */
  const printCopyright: boolean = parseBoolean(
    config.printCopyright,
    defaultOptions.printCopyright,
  );

  /** Whether FeatureInfo windows should be printed on pdf or not. */
  const printFeatureInfo: boolean = parseBoolean(
    config.printFeatureInfo,
    defaultOptions.printFeatureInfo,
  );

  /**
   * Whether legend should be printed on pdf or not.
   */
  const printLegend: boolean = parseBoolean(
    config.printLegend,
    defaultOptions.printLegend,
  );

  /**
   * @example "sameAsMap"
   */
  const legendOrientation: LegendOrientationOptions = parseEnumValue(
    config.legendOrientation,
    LegendOrientationOptions,
    defaultOptions.legendOrientation,
  );

  /**
   * @example "sameAsMap"
   */
  const legendFormat: LegendFormatOptions =
    config.legendFormat || defaultOptions.legendFormat;

  /**
   * Whether map information should be printed on pdf or not.
   */
  const printMapInfo: boolean = parseBoolean(
    config.printMapInfo,
    defaultOptions.printMapInfo,
  );

  // screenshot
  /**
   * Available resolutions for screenshot. The value is always the longest side of the image.
   */
  const resolutionList: Array<number> =
    config.resolutionList || defaultOptions.resolutionList;

  /**
   * The default resolution
   * @example 1920
   */
  const resolutionDefault: number =
    config.resolutionDefault || defaultOptions.resolutionDefault;

  /**
   * The contact information to be printed on pdf
   * @example ['Virtual City Systems', 'Tauentzienstr. 7 b/c', '10789 Berlin', 'Germany', 'Tel.: +49 30 89048710']
   */
  const contactDetails: ContactInfo =
    config.contactDetails || defaultOptions.contactDetails;

  return {
    // setup configuration of the plugin
    config: {
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
      printFeatureInfo,
      printLegend,
      legendOrientation,
      legendFormat,
      printMapInfo,
      contactDetails,
      // screenshot
      resolutionList,
      resolutionDefault,
    },
    // initial and reactive state of the plugin.
    state: reactive({
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

export function validate(options: PrintConfig): void {
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
    check(options.printFeatureInfo, maybe(Boolean));
    check(options.printLegend, maybe(Boolean));
    check(
      options.legendFormat,
      maybe(oneOf(...Object.keys(standardPageSizes), 'sameAsMap')),
    );
    check(options.legendOrientation, maybe(ofEnum(LegendOrientationOptions)));
    check(options.printMapInfo, maybe(Boolean));
    check(options.resolutionList, maybe([Number]));
    const resolutionList =
      options.resolutionList || defaultOptions.resolutionList;
    check(options.resolutionDefault, maybe(oneOf(...resolutionList)));
    check(options.contactDetails, maybe(strict(contactKeysPattern)));
  } catch (err) {
    getLogger(name).error('Invalid config', err);
  }
}

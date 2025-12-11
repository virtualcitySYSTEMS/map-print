import type {
  LegendOrientationOptions,
  OrientationOptions,
  PrintConfig,
} from './common/configManager.js';

export default (): Required<PrintConfig> => {
  return {
    formatList: ['A5', 'A4', 'A3'],
    formatDefault: 'A4',
    ppiList: [150, 300, 450],
    ppiDefault: 300,
    orientationOptions: 'both' as OrientationOptions,
    orientationDefault: 'portrait' as OrientationOptions.PORTRAIT,
    allowTitle: true,
    allowDescription: true,
    printLogo: true,
    printMapInfo: true,
    printObliqueLink: '',
    printObliqueName: true,
    printCoordinates: true,
    coordinatesProj: { type: 'Projection', epsg: 'EPSG:4326' },
    resolutionList: [500, 720, 1280, 1920, 3840],
    resolutionDefault: 1280,
    contactDetails: {},
    printCopyright: true,
    printFeatureInfo: true,
    printLegend: true,
    legendOrientation: 'sameAsMap' as LegendOrientationOptions,
    legendFormat: 'sameAsMap',
  };
};

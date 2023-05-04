export default () => {
  return {
    formatList: ['A5', 'A4', 'A3'],
    formatDefault: 'A4',
    ppiList: [150, 300, 450],
    ppiDefault: 300,
    orientationOptions: 'both',
    orientationDefault: 'portrait',
    allowTitle: true,
    allowDescription: true,
    printLogo: true,
    printMapInfo: true,
    resolutionList: [500, 720, 1280, 1920, 3840],
    resolutionDefault: 1280,
  };
};

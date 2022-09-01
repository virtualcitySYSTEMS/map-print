import { ButtonLocation, createToggleAction, WindowSlot } from '@vcmap/ui';
import { version, name } from '../package.json';
import PdfWindow, { pdfWindowId } from './pdf/pdfWindow.vue';
import ScreenshotWindow, { screenshotWindowId } from './screenshot/screenshotWindow.vue';
import { getSetupAndState } from './common/configManager.js';
import getDefaultConfig from './defaultConfig.js';

/**
 * @param {Object} config - the configuration of this plugin instance, passed in from the app.
 * @returns {Object}
 */
export default (config) => {
  const { pluginSetup, pluginState } = getSetupAndState(config, getDefaultConfig());

  return {
    get name() { return name; },
    get version() { return version; },
    config: pluginSetup,
    state: pluginState,
    onVcsAppMounted: async (vcsUiApp) => {
      let { action } = createToggleAction(
        {
          name: 'print.pdf.header',
          icon: '$vcsPdf',
          title: 'print.pdf.tooltip',
        },
        {
          id: pdfWindowId,
          component: PdfWindow,
          slot: WindowSlot.DYNAMIC_RIGHT,
          state: {
            headerTitle: 'print.pdf.header',
            styles: { width: '280px', height: 'auto' },
          },
        },
        vcsUiApp.windowManager,
        name,
      );
      vcsUiApp.navbarManager.add(
        { id: pdfWindowId, action },
        name,
        ButtonLocation.SHARE,
      );
      ({ action } = createToggleAction(
        {
          name: 'print.image.header',
          icon: '$vcsScreenshot',
          title: 'print.image.tooltip',
        },
        {
          id: screenshotWindowId,
          component: ScreenshotWindow,
          slot: WindowSlot.DYNAMIC_RIGHT,
          state: {
            headerTitle: 'print.image.header',
            styles: { width: '280px', height: 'auto' },
          },
        },
        vcsUiApp.windowManager,
        name,
      ));
      vcsUiApp.navbarManager.add(
        { id: screenshotWindowId, action },
        name,
        ButtonLocation.SHARE,
      );
    },
    i18n: {
      de: {
        print: {
          pdf: {
            tooltip: 'PDF mit der aktuellen Ansicht erstellen.',
            header: 'PDF Erstellen',
            format: 'Papierformat',
            resolution: 'Auflösung',
            portrait: 'Hochformat',
            landscape: 'Querformat',
            titlePlaceholder: 'Hier Titel einfügen',
            descriptionPlaceholder: 'Hier Beschreibung einfügen, kann mehrzeilig sein',
            createButton: 'Erstellen',
            content: {
              contact: {
                header: 'Kontakt',
                mail: 'E-Mail',
                phone: 'Tel.',
                fax: 'Fax',
              },
              mapInfo: 'Karten Information',
              coordinates: 'Koordinaten',
            },
          },
          image: {
            tooltip: 'JPG mit der aktuellen Ansicht erstellen.',
            header: 'JPG Erstellen',
            resolution: 'Auflösung',
            createButton: 'Erstellen',
          },
        },
      },
      en: {
        print: {
          pdf: {
            tooltip: 'Create PDF of current view.',
            header: 'Create PDF',
            format: 'Paper Size',
            resolution: 'Resolution',
            portrait: 'Portrait',
            landscape: 'Landscape',
            titlePlaceholder: 'Insert title here',
            descriptionPlaceholder: 'Insert description here, can be multiline',
            createButton: 'Create',
            content: {
              contact: {
                header: 'Contact',
                mail: 'E-Mail',
                phone: 'Tel.',
                fax: 'Fax',
              },
              mapInfo: 'Map Information',
              coordinates: 'Coordinates',
            },
          },
          image: {
            tooltip: 'Create JPG of current view.',
            header: 'Create JPG',
            resolution: 'Resolution',
            createButton: 'Create',
          },
        },
      },
    },
  };
};

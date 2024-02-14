import { ButtonLocation, createToggleAction, WindowSlot } from '@vcmap/ui';
import { name, version, mapVersion } from '../package.json';
import PdfWindow, { pdfWindowId } from './pdf/pdfWindow.vue';
import ScreenshotWindow, {
  screenshotWindowId,
} from './screenshot/screenshotWindow.vue';
import { getConfigAndState, validate } from './common/configManager.js';
import getDefaultOptions from './defaultOptions.js';
import PrintConfigEditor from './PrintConfigEditor.vue';

/**
 * @param {Object} config - the configuration of this plugin instance, passed in from the app.
 * @returns {Object}
 */
export default (config) => {
  return {
    get name() {
      return name;
    },
    get version() {
      return version;
    },
    get mapVersion() {
      return mapVersion;
    },
    /**
     * @returns {PrintConfig}
     */
    get config() {
      return this._pluginConfig;
    },
    /**
     * @returns {PrintState}
     */
    get state() {
      return this._pluginState;
    },
    initialize() {
      validate(config);
      const { pluginConfig, pluginState } = getConfigAndState(
        config,
        getDefaultOptions(),
      );
      this._pluginConfig = pluginConfig;
      this._pluginState = pluginState;
    },
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
            headerIcon: '$vcsPdf',
            infoUrlCallback: vcsUiApp.getHelpUrlCallback(
              '/components/genericFunctions.html#id_viewShare',
            ),
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
            headerIcon: '$vcsScreenshot',
            infoUrlCallback: vcsUiApp.getHelpUrlCallback(
              '/components/genericFunctions.html#id_viewShare',
            ),
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
    /**
     * @returns {PrintConfig}
     */
    toJSON() {
      const defaultOptions = getDefaultOptions();
      const options = {};
      if (this.config.formatList !== defaultOptions.formatList) {
        options.formatList = this.config.formatList;
      }
      if (this.config.formatDefault !== defaultOptions.formatDefault) {
        options.formatDefault = this.config.formatDefault;
      }
      if (this.config.ppiList !== defaultOptions.ppiList) {
        options.ppiList = this.config.ppiList;
      }
      if (this.config.ppiDefault !== defaultOptions.ppiDefault) {
        options.ppiDefault = this.config.ppiDefault;
      }
      if (
        this.config.orientationOptions !== defaultOptions.orientationOptions
      ) {
        options.orientationOptions = this.config.orientationOptions;
      }
      if (
        this.config.orientationDefault !== defaultOptions.orientationDefault
      ) {
        options.orientationDefault = this.config.orientationDefault;
      }
      if (this.config.allowTitle !== defaultOptions.allowTitle) {
        options.allowTitle = this.config.allowTitle;
      }
      if (this.config.allowDescription !== defaultOptions.allowDescription) {
        options.allowDescription = this.config.allowDescription;
      }
      if (this.config.printLogo !== defaultOptions.printLogo) {
        options.printLogo = this.config.printLogo;
      }
      if (this.config.printMapInfo !== defaultOptions.printMapInfo) {
        options.printMapInfo = this.config.printMapInfo;
      }
      if (this.config.resolutionList !== defaultOptions.resolutionList) {
        options.resolutionList = this.config.resolutionList;
      }
      if (this.config.resolutionDefault !== defaultOptions.resolutionDefault) {
        options.resolutionDefault = this.config.resolutionDefault;
      }
      if (this.config.contactDetails) {
        options.contactDetails = this.config.contactDetails;
      }
      return options;
    },
    /**
     * @returns {PrintConfig}
     */
    getDefaultOptions,
    getConfigEditors() {
      return [{ component: PrintConfigEditor }];
    },
    i18n: {
      de: {
        print: {
          pdf: {
            tooltip: 'PDF der aktuellen Ansicht erstellen',
            header: 'PDF erstellen',
            format: 'Papierformat',
            resolution: 'Auflösung',
            portrait: 'Hochformat',
            landscape: 'Querformat',
            titlePlaceholder: 'Hier Titel einfügen',
            descriptionPlaceholder:
              'Hier Beschreibung einfügen, kann mehrzeilig sein',
            createButton: 'Erstellen',
            content: {
              contact: {
                header: 'Kontakt',
                mail: 'E-Mail',
                phone: 'Tel.',
                fax: 'Fax',
              },
              mapInfo: 'Karteninformation',
              centerCoordinate: 'Mittelpunkt (WGS84)',
            },
          },
          image: {
            tooltip: 'Bilddatei (JPG) der aktuellen Ansicht erstellen',
            header: 'Bild erstellen',
            resolution: 'Auflösung',
            createButton: 'Erstellen',
          },
          editor: {
            formatList: 'Verfügbare Papierformate',
            formatDefault: 'Standard Papierformat',
            ppiList: 'Verfügbare Auflösungen (PPI)',
            ppiDefault: 'Standard Auflösung',
            orientationOptions: 'Verfügbare Orientierungen',
            orientationDefault: 'Standard Orientierung',
            orientation: {
              portrait: 'Hochformat',
              landscape: 'Querformat',
              both: 'Hochformat & Querformat',
            },
            allowTitle: 'Eingabefeld Titel anzeigen',
            allowDescription: 'Eingabefeld Beschreibung anzeigen',
            printLogo: 'Logo anzeigen',
            printMapInfo: 'Karteninformation anzeigen',
            printContactDetails: 'Kontaktinformationen anzeigen',
            contactDetails: {
              department: 'Abteilung',
              name: 'Name',
              streetAddress: 'Straße und Hausnummer',
              zipAndCity: 'Postleitzahl',
              country: 'Land',
              mail: 'E-Mail Adresse',
              phone: 'Telefon Nummer',
              fax: 'Fax Nummer',
            },
            resolutionList: 'Verfügbare Auflösungen (px)',
            resolutionDefault: 'Standard Auflösung',
          },
        },
      },
      en: {
        print: {
          pdf: {
            tooltip: 'Create PDF of current view',
            header: 'Create PDF',
            format: 'Paper size',
            resolution: 'Resolution',
            portrait: 'Portrait',
            landscape: 'Landscape',
            titlePlaceholder: 'Insert title here',
            descriptionPlaceholder: 'Insert description here, can be multiline',
            createButton: 'Create',
            content: {
              contact: {
                header: 'Contact',
                mail: 'Email',
                phone: 'Phone',
                fax: 'Fax',
              },
              mapInfo: 'Map information',
              centerCoordinate: 'Center (WGS84)',
            },
          },
          image: {
            tooltip: 'Create image file (JPG) of current view',
            header: 'Create JPG',
            resolution: 'Resolution',
            createButton: 'Create',
          },
          editor: {
            formatList: 'Available paper sizes',
            formatDefault: 'Default paper size',
            ppiList: 'Available resolutions (PPI)',
            ppiDefault: 'Default resolution',
            orientationOptions: 'Available orientations',
            orientationDefault: 'Default orientation',
            orientation: {
              portrait: 'Portrait',
              landscape: 'Landscape',
              both: 'Portrait & Landscape',
            },
            allowTitle: 'Show title input',
            allowDescription: 'Show description input',
            printLogo: 'Show logo',
            printMapInfo: 'Show map information',
            printContactDetails: 'Show contact details',
            contactDetails: {
              department: 'Department',
              name: 'Name',
              streetAddress: 'Street und house number',
              zipAndCity: 'ZIP-Code',
              country: 'Country',
              mail: 'E-Mail address',
              phone: 'Phone number',
              fax: 'Fax number',
            },
            resolutionList: 'Available resolutions (px)',
            resolutionDefault: 'Default resolution',
          },
        },
      },
    },
  };
};

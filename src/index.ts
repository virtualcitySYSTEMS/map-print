import {
  ButtonLocation,
  createToggleAction,
  PluginConfigEditor,
  VcsPlugin,
  VcsUiApp,
  WindowSlot,
} from '@vcmap/ui';
import deepEqual from 'fast-deep-equal';
import PdfWindow, { pdfWindowId } from './pdf/pdfWindow.vue';
import ScreenshotWindow, {
  screenshotWindowId,
} from './screenshot/screenshotWindow.vue';
import {
  getConfigAndState,
  validate,
  PrintConfig,
  PrintState,
} from './common/configManager.js';
import getDefaultOptions from './defaultOptions.js';
import PrintConfigEditor from './PrintConfigEditor.vue';
import { name, version, mapVersion } from '../package.json';

export type PrintPlugin = VcsPlugin<PrintConfig, PrintState> & {
  readonly config: Required<PrintConfig>;
  readonly state: PrintState;
};

export default function plugin(options: PrintConfig): PrintPlugin {
  let app: VcsUiApp | undefined;
  let config: Required<PrintConfig>;
  let state: PrintState;
  let destroy = (): void => {};
  return {
    get name(): string {
      return name;
    },
    get version(): string {
      return version;
    },
    get mapVersion(): string {
      return mapVersion;
    },
    get config(): Required<PrintConfig> {
      return config;
    },
    get state(): PrintState {
      return state;
    },
    initialize(vcsUiApp: VcsUiApp): Promise<void> {
      app = vcsUiApp;
      validate(options);
      ({ config, state } = getConfigAndState(options, getDefaultOptions()));
      return Promise.resolve();
    },
    onVcsAppMounted(vcsUiApp: VcsUiApp): void {
      const { action: pdfAction, destroy: pdfDestroy } = createToggleAction(
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
        { id: pdfWindowId, action: pdfAction },
        name,
        ButtonLocation.SHARE,
      );
      const { action: screenshotAction, destroy: screenshotDestroy } =
        createToggleAction(
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
        );
      vcsUiApp.navbarManager.add(
        { id: screenshotWindowId, action: screenshotAction },
        name,
        ButtonLocation.SHARE,
      );
      destroy = (): void => {
        pdfDestroy();
        screenshotDestroy();
      };
    },
    getDefaultOptions,
    toJSON(): PrintConfig {
      const defaultOptions = getDefaultOptions();
      const serial: PrintConfig = {};

      (Object.keys(options) as Array<keyof PrintConfig>).forEach((key) => {
        if (!deepEqual(this.config[key], defaultOptions[key])) {
          serial[key] = structuredClone(this.config[key]);
        }
      });
      return serial;
    },
    getConfigEditors(): PluginConfigEditor<object>[] {
      return [
        {
          component: PrintConfigEditor,
          title: 'print.editorTitle',
          infoUrlCallback: app?.getHelpUrlCallback(
            '/components/plugins/printToolConfig.html',
            'app-configurator',
          ),
        },
      ];
    },
    i18n: {
      de: {
        print: {
          editorTitle: 'Print Editor',
          pdf: {
            tooltip: 'PDF der aktuellen Ansicht erstellen',
            header: 'PDF erstellen',
            format: 'Papierformat',
            resolution: 'Auflösung',
            portrait: 'Hochformat',
            landscape: 'Querformat',
            printLegend: 'Legende drucken',
            titlePlaceholder: 'Titel',
            descriptionPlaceholder: 'Beschreibung (mehrzeilig möglich)',
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
            iframeNotSupported:
              'Aufgrund technischer Beschränkungen können Legendenelemente des Typs Iframe nicht gedruckt werden.',
          },
          image: {
            tooltip: 'Bilddatei (JPG) der aktuellen Ansicht erstellen',
            header: 'Bild erstellen',
            resolution: 'Auflösung',
            createButton: 'Erstellen',
          },
          editor: {
            format: 'Papierformat',
            sameFormatAsMap: 'Gleich wie Karte',
            formatList: 'Verfügbare Papierformate',
            formatDefault: 'Standard Papierformat',
            ppiList: 'Verfügbare Auflösungen (PPI)',
            ppiDefault: 'Standard Auflösung',
            orientationOptions: 'Verfügbare Orientierungen',
            orientationDefault: 'Standard Orientierung',
            orientation: {
              title: 'Orientierung',
              portrait: 'Hochformat',
              landscape: 'Querformat',
              both: 'Hochformat & Querformat',
              sameAsMap: 'Gleich wie Karte',
            },
            allowTitle: 'Eingabefeld Titel anzeigen',
            allowDescription: 'Eingabefeld Beschreibung anzeigen',
            printLogo: 'Logo anzeigen',
            printMapInfo: 'Karteninformation anzeigen',
            printContactDetails: 'Kontaktinformationen anzeigen',
            printCopyright: 'Copyright anzeigen',
            printLegend: 'Legende anzeigen',
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
          editorTitle: 'Print Editor',
          pdf: {
            tooltip: 'Create PDF of current view',
            header: 'Create PDF',
            format: 'Paper size',
            resolution: 'Resolution',
            portrait: 'Portrait',
            landscape: 'Landscape',
            printLegend: 'Print legend',
            titlePlaceholder: 'Title',
            descriptionPlaceholder: 'Description (multiline possible)',
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
            iframeNotSupported:
              'Due to technical limitations, legend items of type Iframe cannot be printed.',
          },
          image: {
            tooltip: 'Create image file (JPG) of current view',
            header: 'Create JPG',
            resolution: 'Resolution',
            createButton: 'Create',
          },
          editor: {
            format: 'Paper size',
            sameFormatAsMap: 'Same as the map',
            formatList: 'Available paper sizes',
            formatDefault: 'Default paper size',
            ppiList: 'Available resolutions (PPI)',
            ppiDefault: 'Default resolution',
            orientationOptions: 'Available orientations',
            orientationDefault: 'Default orientation',
            orientation: {
              title: 'Orientation',
              portrait: 'Portrait',
              landscape: 'Landscape',
              both: 'Portrait & Landscape',
              sameAsMap: 'Same as the map',
            },
            allowTitle: 'Show title input',
            allowDescription: 'Show description input',
            printLogo: 'Show logo',
            printMapInfo: 'Show map information',
            printContactDetails: 'Show contact details',
            printCopyright: 'Show copyright',
            printLegend: 'Show legend',
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
    destroy,
  };
}

<template>
  <div>
    <v-overlay
      :model-value="running"
      contained
      persistent
      class="d-flex justify-center align-center"
    >
      <v-icon size="x-large" color="primary"> $vcsProgress </v-icon>
    </v-overlay>
    <v-container class="py-0 px-1">
      <v-row no-gutters>
        <v-col>
          <VcsLabel html-for="sizeSelect">
            {{ $t('print.pdf.format') }}
          </VcsLabel>
        </v-col>
        <v-col>
          <VcsSelect
            id="sizeSelect"
            :items="config.formatList"
            v-model="state.selectedFormat"
          />
        </v-col>
      </v-row>
      <v-row no-gutters>
        <v-col>
          <VcsLabel html-for="ppiSelect">
            {{ $t('print.pdf.resolution') }}
          </VcsLabel>
        </v-col>
        <v-col>
          <VcsSelect
            id="ppiSelect"
            v-model="state.selectedPpi"
            :items="
              config.ppiList.map((value: number) => {
                return { value, title: `${value} ppi` };
              })
            "
          />
        </v-col>
      </v-row>
      <v-row v-if="config.orientationOptions === 'both'" no-gutters>
        <VcsRadio
          v-model="state.selectedOrientation"
          mandatory
          inline
          :items="[
            { label: $t('print.pdf.portrait'), value: 'portrait' },
            { label: $t('print.pdf.landscape'), value: 'landscape' },
          ]"
        />
      </v-row>
    </v-container>
    <v-divider />
    <v-container class="py-0 px-1">
      <v-row no-gutters>
        <v-col>
          <VcsTextField
            :placeholder="$t('print.pdf.titlePlaceholder')"
            v-model="state.title"
            v-if="config.allowTitle"
          />
        </v-col>
      </v-row>
      <v-row no-gutters>
        <v-col>
          <VcsTextArea
            :placeholder="$t('print.pdf.descriptionPlaceholder')"
            class="py-1"
            rows="2"
            v-model="state.description"
            v-if="config.allowDescription"
          />
        </v-col>
      </v-row>
      <v-row no-gutters v-if="enableLegendPrinting">
        <VcsCheckbox
          :true-value="true"
          :false-value="false"
          label="print.pdf.printLegend"
          v-model="printLegend"
        />
      </v-row>
    </v-container>
    <v-divider />
    <div class="d-flex w-full justify-end px-2 pt-2 pb-1">
      <VcsFormButton @click="createPdf" variant="filled">
        {{ $t('print.pdf.createButton') }}
      </VcsFormButton>
    </div>
  </div>
</template>

<style lang="scss" scoped></style>

<script lang="ts">
  import { computed, defineComponent, inject, onUnmounted, ref } from 'vue';
  import {
    getLegendEntries,
    getPluginAssetUrl,
    NotificationType,
    VcsCheckbox,
    VcsFormButton,
    VcsLabel,
    VcsRadio,
    VcsSelect,
    VcsTextArea,
    VcsTextField,
    VcsUiApp,
  } from '@vcmap/ui';
  import {
    VCol,
    VDivider,
    VIcon,
    VContainer,
    VOverlay,
    VRow,
  } from 'vuetify/components';
  import { getLogger } from '@vcsuite/logger';
  import { PrintPlugin } from '../index.js';
  import PDFCreator from './pdfCreator.js';
  import createAndHandleBlob from '../screenshot/shootScreenAndHandle.js';
  import {
    getLogo,
    formatContactInfo,
    getMapInfo,
    getCopyright,
    parseLegend,
  } from './pdfHelper.js';
  import {
    LegendOrientationOptions,
    OrientationOptions,
  } from '../common/configManager.js';
  import { getMapAspectRatio } from '../common/util.js';
  import { name } from '../../package.json';

  export const pdfWindowId = 'create_pdf_window_id';

  export default defineComponent({
    name: 'PdfWindow',
    components: {
      VcsCheckbox,
      VcsSelect,
      VcsTextField,
      VcsLabel,
      VcsFormButton,
      VcsTextArea,
      VcsRadio,
      VOverlay,
      VIcon,
      VContainer,
      VRow,
      VCol,
      VDivider,
    },
    setup() {
      const app = inject('vcsApp') as VcsUiApp;
      const plugin = app.plugins.getByKey(name) as PrintPlugin;
      const { config, state } = plugin;

      const { entries: legendEntries, destroy } = getLegendEntries(app);
      const enableLegendPrinting = computed(
        () => config.printLegend && !!legendEntries.length,
      );
      const printLegend = ref(true);

      // State whether calculation is running.
      const running = ref(false);

      /** Creates pdf by utilizing the PDFCreator. Handling is done by default function in shootScreenAndHandle.js */
      async function createPdf(): Promise<void> {
        running.value = true;
        let logo;
        if (config.printLogo) {
          try {
            logo = await getLogo(app);
          } catch (error) {
            getLogger(plugin.name).error(
              `Fetching logo failed with following error: ${error as string}`,
            );
          }
        }

        /** contact information that can be defined in the plugin config and is printed in the lower left corner */
        let contact;
        if (
          config.contactDetails &&
          Object.keys(config.contactDetails).length
        ) {
          contact = formatContactInfo(app, config.contactDetails);
        }

        /** information about the map that is printed next to the contact information. Generated by mapHelper.js function. */
        let mapInfo;
        if (config.printMapInfo) {
          mapInfo = await getMapInfo(app);
        }

        /**
         * information about the copyright that is rendered in
         * the bottom right corner of the screenshot. Generated by mapHelper.js function.
         */
        let copyright;
        if (config.printCopyright) {
          copyright = getCopyright(app);
        }

        /**
         * Each legend entry is rendered on a new page at the end of the PDF. Generated by pdfHelper.ts.
         */
        let legend;
        if (enableLegendPrinting.value && printLegend.value) {
          const items = parseLegend(app, legendEntries);
          if (items?.length) {
            const format =
              !config.legendFormat || config.legendFormat === 'sameAsMap'
                ? state.selectedFormat
                : config.legendFormat;
            let orientation: LegendOrientationOptions;
            if (
              config.legendOrientation &&
              config.legendOrientation !== 'sameAsMap'
            ) {
              orientation = config.legendOrientation;
            } else if (
              state.selectedOrientation === OrientationOptions.PORTRAIT
            ) {
              orientation = LegendOrientationOptions.PORTRAIT;
            } else {
              orientation = LegendOrientationOptions.LANDSCAPE;
            }
            const legendConfig = { format, orientation };
            legend = { items, config: legendConfig };
          }
        }

        // could also be put into styles.js
        const fonts: { name: string; regular: string; bold: string } = {
          name: 'RobotoSlab',
          regular: getPluginAssetUrl(
            app,
            name,
            'plugin-assets/fonts/RobotoSlab-Regular.ttf',
          )!,
          bold: getPluginAssetUrl(
            app,
            name,
            'plugin-assets/fonts/RobotoSlab-Bold.ttf',
          )!,
        };

        const mapAspectRatio = getMapAspectRatio(app.maps.activeMap!);

        const pdfCreator = new PDFCreator();
        await pdfCreator
          .setup({
            orientation: state.selectedOrientation,
            format: state.selectedFormat,
            title: state.title,
            logo,
            imgRatio: mapAspectRatio,
            description: state.description,
            contact,
            mapInfo,
            copyright,
            legend,
            fonts,
          })
          .then(async () => {
            // after setup possible to execute pdfCreator.create()
            const width =
              pdfCreator.imgPlacement!.size.width * state.selectedPpi;
            await createAndHandleBlob(
              app,
              width,
              pdfCreator.create.bind(pdfCreator),
              'map.pdf',
            );
          })
          .catch((e) => {
            app.notifier.add({
              type: NotificationType.ERROR,
              message: e.message,
            });
          })
          .finally(() => {
            running.value = false;
          });
      }

      onUnmounted(destroy);

      return {
        state,
        config,
        enableLegendPrinting,
        printLegend,
        running,
        createPdf,
      };
    },
  });
</script>

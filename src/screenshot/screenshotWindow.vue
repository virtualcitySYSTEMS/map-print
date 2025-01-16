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
        <v-col cols="5">
          <VcsLabel html-for="sizeSelect">
            {{ $t('print.image.resolution') }}
          </VcsLabel>
        </v-col>
        <v-col>
          <VcsSelect
            id="sizeSelect"
            v-model="state.selectedResolution"
            :items="calculatedResList"
          />
        </v-col>
      </v-row>
    </v-container>
    <v-divider />
    <div class="d-flex w-full justify-end px-2 pt-2 pb-1">
      <VcsFormButton @click="createJPG()" variant="filled">
        <span class="text-uppercase">
          {{ $t('print.image.createButton') }}
        </span>
      </VcsFormButton>
    </div>
  </div>
</template>

<style lang="scss" scoped></style>

<script lang="ts">
  import {
    computed,
    defineComponent,
    inject,
    onMounted,
    onUnmounted,
    ref,
  } from 'vue';
  import { VcsSelect, VcsLabel, VcsFormButton, VcsUiApp } from '@vcmap/ui';
  import {
    VOverlay,
    VIcon,
    VContainer,
    VRow,
    VCol,
    VDivider,
  } from 'vuetify/components';
  import { PrintPlugin } from '../index.js';
  import createAndHandleBlob from './shootScreenAndHandle.js';
  import { getMapAspectRatio } from '../common/util.js';
  import { name } from '../../package.json';

  export const screenshotWindowId = 'create_screenshot_window_id';

  export default defineComponent({
    name: 'ScreenshotWindow',
    components: {
      VcsSelect,
      VcsLabel,
      VcsFormButton,
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

      const running = ref(false);
      const mapAspectRatio = ref();

      /**
       * calculates the aspect ratio of the map.
       */
      function calcAspectRatio(): void {
        const map = app.maps.activeMap;
        mapAspectRatio.value = getMapAspectRatio(map!);
      }

      // calc initial aspect ratio
      calcAspectRatio();

      /** Time in ms to wait if a new resize event coming in before calculating new aspect ratio. */
      const calcRatioDelay = 100;
      let timeout: NodeJS.Timeout | undefined;
      /** Makes sure the aspect ratio is only calculated once when resizing the window by waiting unitl no new event is coming in. */
      function handleResizeEvent(): void {
        clearTimeout(timeout);
        timeout = setTimeout(calcAspectRatio, calcRatioDelay);
      }

      // Event listener for window resize events.
      // When resized then calculate the aspect ratio of map.
      onMounted(() => window.addEventListener('resize', handleResizeEvent));

      onUnmounted(() =>
        window.removeEventListener('resize', handleResizeEvent),
      );

      // calculate the possible width and heights for creating the screenshot.
      // is calculated from the config resolutionList.
      const calculatedResList = computed(
        (): { value: number; title: string }[] => {
          return config.resolutionList.map((value) => {
            let width;
            let height;
            if (mapAspectRatio.value >= 1) {
              width = value;
              height = Math.round(value / mapAspectRatio.value);
            } else {
              width = Math.round(value * mapAspectRatio.value);
              height = value;
            }
            return {
              value,
              title: `${width} x ${height} px`,
            };
          });
        },
      );

      /**
       * Utilize the shootScreenAndHandle function for creating the JPG.
       */
      async function createJPG(): Promise<void> {
        running.value = true;
        const jpgCreateFunction = (
          canvas: HTMLCanvasElement,
        ): Promise<Blob | null> => {
          return new Promise((resolve) => {
            canvas.toBlob(resolve, 'image/jpeg');
          });
        };
        const width =
          mapAspectRatio.value >= 1
            ? state.selectedResolution
            : state.selectedResolution * mapAspectRatio.value;
        await createAndHandleBlob(app, width, jpgCreateFunction, 'map.jpg');
        running.value = false;
      }

      return {
        state,
        mapAspectRatio,
        calculatedResList,
        running,
        createJPG,
      };
    },
  });
</script>

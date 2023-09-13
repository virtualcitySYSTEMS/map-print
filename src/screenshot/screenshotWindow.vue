<template>
  <div>
    <v-overlay :value="running" absolute :opacity="1" color="basic">
      <v-icon x-large color="primary"> $vcsProgress </v-icon>
    </v-overlay>
    <v-container class="py-0 px-1">
      <v-row no-gutters>
        <v-col cols="5">
          <VcsLabel html-for="sizeSelect" :dense="true">
            {{ $t('print.image.resolution') }}
          </VcsLabel>
        </v-col>
        <v-col>
          <VcsSelect
            id="sizeSelect"
            v-model="pluginState.selectedResolution"
            :items="calculatedResList"
            :dense="true"
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

<script>
  import { computed, inject, onMounted, onUnmounted, ref } from 'vue';
  import { VcsSelect, VcsLabel, VcsFormButton } from '@vcmap/ui';
  import {
    VOverlay,
    VIcon,
    VContainer,
    VRow,
    VCol,
    VDivider,
  } from 'vuetify/lib';
  import createAndHandleBlob from './shootScreenAndHandle.js';
  import { getMapAspectRatio } from '../common/util.js';

  export const screenshotWindowId = 'create_screenshot_window_id';

  export default {
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
      const app = inject('vcsApp');

      const plugin = app.plugins.getByKey('@vcmap/print');

      const pluginSetup = plugin.config;
      const pluginState = plugin.state;

      const running = ref(false);

      const mapAspectRatio = ref();

      /**
       * calculates the aspect ratio of the map.
       */
      function calcAspectRatio() {
        const map = app.maps.activeMap;
        mapAspectRatio.value = getMapAspectRatio(map);
      }

      // calc initial aspect ratio
      calcAspectRatio();

      /** Time in ms to wait if a new resize event coming in before calculating new aspect ratio. */
      const calcRatioDelay = 100;
      let timeout;
      /** Makes sure the aspect ratio is only calculated once when resizing the window by waiting unitl no new event is coming in. */
      function handleResizeEvent() {
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
      const calculatedResList = computed(() => {
        return pluginSetup.resolutionList.map((value) => {
          const resObject = {};
          let width;
          let height;
          if (mapAspectRatio.value >= 1) {
            width = value;
            height = Math.round(value / mapAspectRatio.value);
          } else {
            width = Math.round(value * mapAspectRatio.value);
            height = value;
          }
          // value can be either height or width, depending on which is longer.
          resObject.value = value;

          return {
            value,
            text: `${width} x ${height} px`,
          };
        });
      });

      /**
       * Utilize the shootScreenAndHandle function for creating the JPG.
       */
      async function createJPG() {
        const jpgCreateFunction = (canvas) => {
          return new Promise((resolve) => {
            canvas.toBlob(resolve, 'image/jpeg');
          });
        };
        const width =
          mapAspectRatio.value >= 1
            ? pluginState.selectedResolution
            : pluginState.selectedResolution * mapAspectRatio.value;
        await createAndHandleBlob(
          app,
          running,
          width,
          jpgCreateFunction,
          'map.jpg',
        );
      }

      return {
        pluginSetup,
        pluginState,
        mapAspectRatio,
        calculatedResList,
        running,
        createJPG,
      };
    },
  };
</script>

<template>
  <AbstractConfigEditor v-bind="{ ...$attrs, ...$props }" @submit="apply">
    <VcsFormSection
      v-if="localConfig"
      heading="print.pdf.header"
      expandable
      :start-open="true"
    >
      <v-container class="py-0 px-1">
        <v-row no-gutters>
          <v-col>
            <VcsLabel html-for="formatList">
              {{ $t('print.editor.formatList') }}
            </VcsLabel>
          </v-col>
          <v-col>
            <VcsSelect
              id="formatList"
              v-model="localConfig.formatList"
              multiple
              :items="['A5', 'A4', 'A3', 'A2']"
              @update:model-value="
                (v: ('A2' | 'A3' | 'A4' | 'A5')[]) =>
                  updateDefault('formatDefault', v)
              "
            />
          </v-col>
        </v-row>
        <v-row no-gutters>
          <v-col>
            <VcsLabel html-for="formatDefault">
              {{ $t('print.editor.formatDefault') }}
            </VcsLabel>
          </v-col>
          <v-col>
            <VcsSelect
              id="formatDefault"
              v-model="localConfig.formatDefault"
              :items="localConfig.formatList"
              :rules="[(v: string) => !!v || 'components.validation.required']"
            />
          </v-col>
        </v-row>
        <v-row no-gutters>
          <v-col>
            <VcsLabel html-for="ppiList">
              {{ $t('print.editor.ppiList') }}
            </VcsLabel>
          </v-col>
          <v-col>
            <VcsChipArrayInput
              id="ppiList"
              v-model="localConfig.ppiList"
              column
              type="number"
              placeholder="300"
              :rules="[
                (v: number) => v > 0 || 'components.validation.notValid',
              ]"
              @update:model-value="
                (v: number[]) => updateDefault('ppiDefault', v)
              "
            />
          </v-col>
        </v-row>
        <v-row no-gutters>
          <v-col>
            <VcsLabel html-for="ppiDefault">
              {{ $t('print.editor.ppiDefault') }}
            </VcsLabel>
          </v-col>
          <v-col>
            <VcsSelect
              id="ppiDefault"
              v-model.number="localConfig.ppiDefault"
              :items="localConfig.ppiList"
              :rules="[(v: number) => !!v || 'components.validation.required']"
            />
          </v-col>
        </v-row>
        <v-row no-gutters>
          <v-col>
            <VcsLabel html-for="orientationOptions">
              {{ $t('print.editor.orientationOptions') }}
            </VcsLabel>
          </v-col>
          <v-col>
            <VcsSelect
              id="orientationOptions"
              v-model="localConfig.orientationOptions"
              :items="orientationOptionsItems"
            />
          </v-col>
        </v-row>
        <v-row v-if="localConfig.orientationOptions === 'both'" no-gutters>
          <v-col>
            <VcsLabel html-for="orientationDefault">
              {{ $t('print.editor.orientationDefault') }}
            </VcsLabel>
          </v-col>
          <v-col>
            <VcsSelect
              id="orientationDefault"
              v-model="localConfig.orientationDefault"
              :items="
                orientationOptionsItems.filter(({ value }) => value !== 'both')
              "
            />
          </v-col>
        </v-row>
        <div v-for="key in configKeys" :key="key">
          <v-row no-gutters>
            <v-col class="pl-1">
              <VcsCheckbox
                :id="key"
                v-model="localConfig[key]"
                :true-value="true"
                :false-value="false"
                :label="`print.editor.${key}`"
              />
            </v-col>
          </v-row>
          <template v-if="key === 'printMapInfo' && localConfig.printMapInfo">
            <v-row no-gutters>
              <v-col class="pl-5">
                <VcsCheckbox
                  v-model="localConfig.printObliqueName"
                  :true-value="true"
                  :false-value="false"
                  label="print.editor.printObliqueName"
                />
              </v-col>
            </v-row>
            <v-row no-gutters>
              <v-col class="pl-5">
                <VcsCheckbox
                  v-model="localConfig.printLinkToMap"
                  label="print.editor.printLinkToMap"
                />
              </v-col>
            </v-row>
            <v-row no-gutters>
              <v-col class="pl-5">
                <VcsCheckbox
                  v-model="localConfig.printCoordinates"
                  :true-value="true"
                  :false-value="false"
                  label="print.editor.printCoordinates"
                />
              </v-col>
            </v-row>
            <v-row v-if="localConfig.printCoordinates" no-gutters>
              <v-col class="pl-9">
                <VcsProjection
                  v-model="localConfig.coordinatesProj"
                  required
                  hide-alias
                />
              </v-col>
            </v-row>
          </template>
        </div>
        <!-- Legend config -->
        <span v-if="localConfig.printLegend">
          <v-row no-gutters class="pl-5">
            <v-col>
              <VcsLabel html-for="legendOrientation">
                {{ $t('print.editor.orientation.title') }}
              </VcsLabel>
            </v-col>
            <v-col>
              <VcsSelect
                id="legendOrientation"
                v-model="localConfig.legendOrientation"
                :items="legendOrientationOptions"
              />
            </v-col>
          </v-row>
          <v-row no-gutters class="pl-5">
            <v-col>
              <VcsLabel html-for="legendFormat">
                {{ $t('print.editor.format') }}
              </VcsLabel>
            </v-col>
            <v-col>
              <VcsSelect
                id="legendFormat"
                v-model="localConfig.legendFormat"
                :items="legendFormatOptions"
              />
            </v-col>
          </v-row>
        </span>
        <v-row no-gutters>
          <v-col class="pl-1">
            <VcsCheckbox
              id="printContactDetails"
              v-model="printContactDetails"
              :true-value="true"
              :false-value="false"
              label="print.editor.printContactDetails"
            />
          </v-col>
        </v-row>
        <template v-if="printContactDetails">
          <v-row v-for="key in contactKeys" :key="key" no-gutters>
            <v-col class="pl-5">
              <VcsLabel :html-for="key">
                {{ $st(`print.editor.contactDetails.${key}`) }}
              </VcsLabel>
            </v-col>
            <v-col cols="6">
              <VcsTextField
                :id="key"
                v-model="localConfig.contactDetails![key]"
                clearable
              />
            </v-col>
          </v-row>
        </template>
      </v-container>
    </VcsFormSection>
    <VcsFormSection
      v-if="localConfig"
      heading="print.image.header"
      expandable
      :start-open="true"
    >
      <v-container class="py-0 px-1">
        <v-row no-gutters>
          <v-col>
            <VcsLabel html-for="resolutionList">
              {{ $t('print.editor.resolutionList') }}
            </VcsLabel>
          </v-col>
          <v-col>
            <VcsChipArrayInput
              id="resolutionList"
              v-model="localConfig.resolutionList"
              column
              placeholder="1920"
              type="number"
              :rules="[
                (v: number) => v > 0 || 'components.validation.notValid',
              ]"
              @update:model-value="
                (v: number[]) => updateDefault('resolutionDefault', v)
              "
            />
          </v-col>
        </v-row>
        <v-row no-gutters>
          <v-col>
            <VcsLabel html-for="resolutionDefault">
              {{ $t('print.editor.resolutionDefault') }}
            </VcsLabel>
          </v-col>
          <v-col>
            <VcsSelect
              id="resolutionDefault"
              v-model.number="localConfig.resolutionDefault"
              :items="localConfig.resolutionList"
              :rules="[(v: number) => !!v || 'components.validation.required']"
            />
          </v-col>
        </v-row>
      </v-container>
    </VcsFormSection>
  </AbstractConfigEditor>
</template>

<script lang="ts">
  import { VContainer, VRow, VCol } from 'vuetify/components';
  import {
    AbstractConfigEditor,
    VcsFormSection,
    VcsLabel,
    VcsTextField,
    VcsSelect,
    VcsCheckbox,
    VcsChipArrayInput,
    VcsProjection,
  } from '@vcmap/ui';
  import { Projection, wgs84Projection } from '@vcmap/core';
  import type { PropType } from 'vue';
  import { defineComponent, ref, toRaw } from 'vue';
  import getDefaultOptions from './defaultOptions.js';
  import type { ContactInfo, PrintConfig } from './common/configManager.js';
  import {
    LegendOrientationOptions,
    OrientationOptions,
  } from './common/configManager.js';
  import standardPageSizes from './pdf/standardPageSizes.js';

  export default defineComponent({
    name: 'PrintConfigEditor',
    components: {
      VContainer,
      VRow,
      VCol,
      AbstractConfigEditor,
      VcsCheckbox,
      VcsChipArrayInput,
      VcsFormSection,
      VcsLabel,
      VcsProjection,
      VcsSelect,
      VcsTextField,
    },
    props: {
      getConfig: {
        type: Function as PropType<() => PrintConfig>,
        required: true,
      },
      setConfig: {
        type: Function as PropType<(config: object | undefined) => void>,
        required: true,
      },
    },
    setup(props) {
      const defaultOptions = getDefaultOptions();
      const config = props.getConfig();
      const localConfig = ref<PrintConfig>(
        Object.assign(structuredClone(defaultOptions), config),
      );

      const printContactDetails = ref(
        !!(
          config.contactDetails && Object.keys(config.contactDetails).length > 0
        ),
      );
      localConfig.value.contactDetails = config.contactDetails || {};

      const orientationOptionsItems = Object.values(OrientationOptions).map(
        (value) => {
          return { value, title: `print.editor.orientation.${value}` };
        },
      );

      const legendOrientationOptions = Object.values(
        LegendOrientationOptions,
      ).map((value) => {
        return { value, title: `print.editor.orientation.${value}` };
      });

      const legendFormatOptions = [
        {
          value: 'sameAsMap',
          title: 'print.editor.sameFormatAsMap',
        },
        ...Object.keys(standardPageSizes).map((value) => {
          return { value, title: value };
        }),
      ];

      const configKeys = ref<(keyof Partial<PrintConfig>)[]>([
        'allowTitle',
        'allowDescription',
        'printLogo',
        'printCopyright',
        'printMapInfo',
        'printFeatureInfo',
        'printLegend',
      ]);

      const contactKeys = ref<(keyof ContactInfo)[]>([
        'department',
        'name',
        'streetAddress',
        'zipAndCity',
        'country',
        'mail',
        'phone',
        'fax',
      ]);

      function updateDefault<T extends keyof PrintConfig>(
        prop: T,
        array: PrintConfig[T][],
      ): void {
        if (!array.includes(localConfig.value[prop])) {
          localConfig.value[prop] = array[0];
        }
      }

      const apply = (): void => {
        if (
          !printContactDetails.value ||
          Object.keys(localConfig.value.contactDetails ?? {}).length === 0
        ) {
          delete localConfig.value.contactDetails;
        }
        if (!localConfig.value.printMapInfo) {
          localConfig.value.printObliqueName = false;
          localConfig.value.printCoordinates = false;
          delete localConfig.value.coordinatesProj;
        }
        if (
          !localConfig.value.printCoordinates &&
          !localConfig.value.printObliqueName
        ) {
          localConfig.value.printMapInfo = false;
          delete localConfig.value.coordinatesProj;
        }
        const { coordinatesProj } = localConfig.value;
        if (coordinatesProj) {
          if (
            !Projection.validateOptions(coordinatesProj) ||
            new Projection(coordinatesProj).equals(wgs84Projection)
          ) {
            delete localConfig.value.coordinatesProj;
          }
        }

        props.setConfig(structuredClone(toRaw(localConfig.value)));
      };

      return {
        localConfig,
        orientationOptionsItems,
        legendOrientationOptions,
        legendFormatOptions,
        printContactDetails,
        contactKeys,
        configKeys,
        updateDefault,
        apply,
      };
    },
  });
</script>

<style scoped></style>

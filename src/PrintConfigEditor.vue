<template>
  <AbstractConfigEditor @submit="apply" v-bind="{ ...$attrs, ...$props }">
    <VcsFormSection
      heading="print.pdf.header"
      expandable
      :start-open="true"
      v-if="localConfig"
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
              multiple
              :items="['A5', 'A4', 'A3', 'A2']"
              v-model="localConfig.formatList"
              @update:modelValue="
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
              :items="localConfig.formatList"
              v-model="localConfig.formatDefault"
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
              column
              type="number"
              placeholder="300"
              v-model="localConfig.ppiList"
              @update:modelValue="
                (v: number[]) => updateDefault('ppiDefault', v)
              "
              :rules="[
                (v: number) => v > 0 || 'components.validation.notValid',
              ]"
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
              :items="localConfig.ppiList"
              v-model.number="localConfig.ppiDefault"
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
              :items="orientationOptionsItems"
              v-model="localConfig.orientationOptions"
            />
          </v-col>
        </v-row>
        <v-row no-gutters v-if="localConfig.orientationOptions === 'both'">
          <v-col>
            <VcsLabel html-for="orientationDefault">
              {{ $t('print.editor.orientationDefault') }}
            </VcsLabel>
          </v-col>
          <v-col>
            <VcsSelect
              id="orientationDefault"
              :items="
                orientationOptionsItems.filter(({ value }) => value !== 'both')
              "
              v-model="localConfig.orientationDefault"
            />
          </v-col>
        </v-row>
        <v-row no-gutters v-for="key in configKeys" :key="key">
          <v-col class="pl-1">
            <VcsCheckbox
              :id="key"
              :true-value="true"
              :false-value="false"
              :label="`print.editor.${key}`"
              v-model="localConfig[key]"
            />
          </v-col>
        </v-row>
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
                :items="legendOrientationOptions"
                v-model="localConfig.legendOrientation"
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
                :items="legendFormatOptions"
                v-model="localConfig.legendFormat"
              />
            </v-col>
          </v-row>
        </span>
        <v-row no-gutters>
          <v-col class="pl-1">
            <VcsCheckbox
              id="printContactDetails"
              :true-value="true"
              :false-value="false"
              label="print.editor.printContactDetails"
              v-model="printContactDetails"
            />
          </v-col>
        </v-row>
        <template v-if="printContactDetails">
          <v-row no-gutters v-for="key in contactKeys" :key="key">
            <v-col class="pl-5">
              <VcsLabel :html-for="key">
                {{ $st(`print.editor.contactDetails.${key}`) }}
              </VcsLabel>
            </v-col>
            <v-col cols="6">
              <VcsTextField
                :id="key"
                clearable
                v-model="localConfig.contactDetails![key]"
              />
            </v-col>
          </v-row>
        </template>
      </v-container>
    </VcsFormSection>
    <VcsFormSection
      heading="print.image.header"
      expandable
      :start-open="true"
      v-if="localConfig"
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
              column
              placeholder="1920"
              type="number"
              v-model="localConfig.resolutionList"
              @update:modelValue="
                (v: number[]) => updateDefault('resolutionDefault', v)
              "
              :rules="[
                (v: number) => v > 0 || 'components.validation.notValid',
              ]"
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
              :items="localConfig.resolutionList"
              v-model.number="localConfig.resolutionDefault"
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
  } from '@vcmap/ui';
  import { defineComponent, PropType, ref, toRaw } from 'vue';
  import getDefaultOptions from './defaultOptions.js';
  import {
    ContactInfo,
    LegendOrientationOptions,
    OrientationOptions,
    PrintConfig,
  } from './common/configManager.js';
  import standardPageSizes from './pdf/standardPageSizes.js';

  export default defineComponent({
    name: 'PrintConfigEditor',
    components: {
      VContainer,
      VRow,
      VCol,
      AbstractConfigEditor,
      VcsFormSection,
      VcsLabel,
      VcsSelect,
      VcsTextField,
      VcsCheckbox,
      VcsChipArrayInput,
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
        'printMapInfo',
        'printCopyright',
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

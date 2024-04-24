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
              @input="(v) => updateDefault('formatDefault', v)"
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
              :rules="[(v) => !!v || 'components.validation.required']"
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
              @input="(v) => updateDefault('ppiDefault', v)"
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
              v-model="localConfig.ppiDefault"
              :rules="[(v) => !!v || 'components.validation.required']"
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
              :items="orientationOptionsItems.slice(0, 2)"
              v-model="localConfig.orientationDefault"
            />
          </v-col>
        </v-row>
        <v-row
          no-gutters
          v-for="key in [
            'allowTitle',
            'allowDescription',
            'printLogo',
            'printMapInfo',
          ]"
          :key="key"
        >
          <v-col>
            <VcsLabel :html-for="key">
              {{ $t(`print.editor.${key}`) }}
            </VcsLabel>
          </v-col>
          <v-col>
            <VcsCheckbox
              :id="key"
              :true-value="true"
              :false-value="false"
              v-model="localConfig[key]"
            />
          </v-col>
        </v-row>
        <v-row no-gutters>
          <v-col>
            <VcsLabel html-for="printContactDetails">
              {{ $t('print.editor.printContactDetails') }}
            </VcsLabel>
          </v-col>
          <v-col>
            <VcsCheckbox
              id="printContactDetails"
              :true-value="true"
              :false-value="false"
              v-model="printContactDetails"
            />
          </v-col>
        </v-row>
        <template v-if="printContactDetails">
          <v-row
            no-gutters
            v-for="key in [
              'department',
              'name',
              'streetAddress',
              'zipAndCity',
              'country',
              'mail',
              'phone',
              'fax',
            ]"
            :key="key"
          >
            <v-col>
              <VcsLabel :html-for="key">
                {{ $t(`print.editor.contactDetails.${key}`) }}
              </VcsLabel>
            </v-col>
            <v-col>
              <VcsTextField
                :id="key"
                clearable
                v-model="localConfig.contactDetails[key]"
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
              @input="(v) => updateDefault('resolutionDefault', v)"
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
              v-model="localConfig.resolutionDefault"
              :rules="[(v) => !!v || 'components.validation.required']"
            />
          </v-col>
        </v-row>
      </v-container>
    </VcsFormSection>
  </AbstractConfigEditor>
</template>

<script>
  import { VContainer, VRow, VCol } from 'vuetify/lib';
  import {
    AbstractConfigEditor,
    VcsFormSection,
    VcsLabel,
    VcsTextField,
    VcsSelect,
    VcsCheckbox,
    VcsChipArrayInput,
  } from '@vcmap/ui';
  import { ref } from 'vue';
  import getDefaultOptions from './defaultOptions.js';

  export default {
    name: 'PrintConfigEditor',
    title: 'Print Editor',
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
        type: Function,
        required: true,
      },
      setConfig: {
        type: Function,
        required: true,
      },
    },
    setup(props) {
      const localConfig = ref();
      const printContactDetails = ref(false);
      const defaultOptions = getDefaultOptions();
      props.getConfig().then((config) => {
        localConfig.value = Object.assign(
          structuredClone(defaultOptions),
          config,
        );
        printContactDetails.value =
          config.contactDetails &&
          Object.keys(config.contactDetails).length > 0;
        localConfig.value.contactDetails = config.contactDetails || {};
      });
      const orientationOptionsItems = [
        {
          value: 'landscape',
          text: 'print.editor.orientation.landscape',
        },
        {
          value: 'portrait',
          text: 'print.editor.orientation.portrait',
        },
        {
          value: 'both',
          text: 'print.editor.orientation.both',
        },
      ];

      function updateDefault(prop, array) {
        if (!array.includes(localConfig.value[prop])) {
          localConfig.value[prop] = array[0];
        }
      }

      const apply = async () => {
        if (
          !printContactDetails.value ||
          Object.keys(localConfig.value.contactDetails).length === 0
        ) {
          delete localConfig.value.contactDetails;
        }
        await props.setConfig(localConfig.value);
      };

      return {
        localConfig,
        orientationOptionsItems,
        printContactDetails,
        updateDefault,
        apply,
      };
    },
  };
</script>

<style scoped></style>

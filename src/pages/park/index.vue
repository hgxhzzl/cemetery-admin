<template>
  <div v-if="isFormShow">
    <t-form class="base-form" :data="formData" label-align="top" :label-width="100" @reset="onReset" @submit="onSubmit">
      <div class="form-basic-container">
        <div class="form-basic-item">
          <div class="form-basic-container-title">{{ $t('pages.park.title') }}</div>
          <t-form-item :label="$t('pages.park.region')" name="region">
            <t-select
              v-model="formData.region"
              :style="{ width: '322px' }"
              class="demo-select-base"
              @change="regionOnchange"
            >
              <t-option v-for="(item, index) in dataRegionList" :key="index" :value="item.value" :label="item.label">
                {{ item.label }}
              </t-option>
            </t-select>
          </t-form-item>

          <t-form-item :label="$t('pages.park.park')" name="park">
            <t-tag-input
              v-model="park"
              :placeholder="$t('pages.park.parkPlaceholder')"
              :tag-props="{ theme: 'warning' }"
              :max="20"
              :maxcharacter="12"
              excess-tags-display-type="break-line"
              @enter="onEnterPark"
            />
          </t-form-item>
        </div>
      </div>

      <div class="form-submit-container">
        <div class="form-submit-sub">
          <div class="form-submit-left">
            <t-button theme="primary" class="form-submit-confirm" type="submit">
              {{ $t('operate.confirm') }}
            </t-button>
            <t-button type="reset" class="form-submit-cancel" theme="default" variant="base">
              {{ $t('operate.cancel') }}
            </t-button>
          </div>
        </div>
      </div>
    </t-form>
  </div>
</template>
<script setup lang="ts">
import { MessagePlugin } from 'tdesign-vue-next';
import { onMounted, ref } from 'vue';

import type { ListParkModel, SelectModel } from '@/api/model/parkModel';
import { getParkList, getRegionList, insertPark } from '@/api/park';
import { i18n } from '@/locales';
import { logError } from '@/utils/logger';

import { INITIAL_DATA, INITIAL_PARKJSON } from './constants';

defineOptions({
  name: 'Park',
});

type ParkFormData = Omit<typeof INITIAL_DATA, 'region'> & {
  region: string | number;
};

interface TagInputEnterContext {
  inputValue?: string;
}

type TagInputValue = Array<string | number>;

const translate = (key: string) => String(i18n.global.t(key));

const park = ref<string[]>([]);
const dataRegionList = ref<SelectModel[]>([]);
const dataParkList = ref<ListParkModel[]>([]);
const isFormShow = ref(false);
const formData = ref<ParkFormData>({ ...INITIAL_DATA });

onMounted(async () => {
  await fetchData();
  setTimeout(() => {
    isFormShow.value = true;
  }, 280);
});

const fetchData = async () => {
  try {
    await getParkData();
    const { list } = await getRegionList();
    dataRegionList.value = list;
    onReset();
  } catch (e) {
    logError(e);
  }
};

const getParkData = async () => {
  try {
    const { list } = await getParkList();
    dataParkList.value = list;
  } catch (e) {
    logError(e);
  }
};

const syncParksByRegion = (region: string | number) => {
  park.value = dataParkList.value.filter((item) => item.region === String(region)).map((item) => item.value);
};

const regionOnchange = () => {
  syncParksByRegion(formData.value.region);
};

const onReset = () => {
  if (!dataRegionList.value.length) {
    park.value = [];
    return;
  }

  const region = dataRegionList.value[0].value;
  formData.value.region = region;
  syncParksByRegion(region);
};

const onSubmit = async () => {
  const tag = park.value.map((item) => ({
    ...INITIAL_PARKJSON,
    region: String(formData.value.region),
    park: item,
  }));

  try {
    await insertPark(tag);
    MessagePlugin.success(translate('operate.createdSuccessPrompt'));
    await getParkData();
  } catch (e) {
    logError(e);
    MessagePlugin.error(translate('operate.createdFailedPrompt'));
  }
};

const onEnterPark = (value: TagInputValue, context: TagInputEnterContext) => {
  park.value = Array.from(new Set(park.value));
  if (value.length >= 20 && context.inputValue) {
    MessagePlugin.warning(translate('pages.park.tagAtMost') + 20 + translate('pages.park.tag'));
  }
};
</script>
<style lang="less" scoped>
@import './index.less';
</style>

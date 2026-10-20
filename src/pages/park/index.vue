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
            <!-- 园区标签开启拖拽排序：拖动换位后点确认即按新顺序重建该区域园区（后端按数组序逐条 insert）20261011 新增 -->
            <t-tag-input
              v-model="park"
              :placeholder="$t('pages.park.parkPlaceholder')"
              :tag-props="{ theme: 'warning' }"
              :max="20"
              :maxcharacter="12"
              :drag-sort="true"
              excess-tags-display-type="break-line"
              @drag-sort="onDragSortPark"
              @enter="onEnterPark"
            />
          </t-form-item>
        </div>
      </div>

      <div class="form-submit-container">
        <div class="form-submit-sub">
          <div class="form-submit-left">
            <t-button theme="primary" class="form-submit-confirm" type="submit" :disabled="submitting">
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
import { useSubmitGuard } from '@/hooks';
import { translate } from '@/locales';
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

// 拖拽排序回调上下文：只回传起止下标（组件内部不自己重排数组）20261011 新增,
interface TagDragSortContext {
  currentIndex: number;
  targetIndex: number;
}

type TagInputValue = Array<string | number>;

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

// 确认提交防重复：type=submit 表单提交无锁，双击/回车会并发发出两次写接口；submitting 同步上锁并绑定按钮 :disabled 20261004 新增
const { submitting, run } = useSubmitGuard();
const onSubmit = () => run(submitCore);
const submitCore = async () => {
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

// 拖拽换位：tdesign v1.20.7 的 TagInput 拖拽只把 dragSort 透传给标签并抛出 drag-sort 事件（带 newTags 的类型声明
// 在运行时从未被填充），数组顺序全靠调用方自己改——不接这个回调的话拖动什么也不会发生，松手就回到原样 20261011 新增,
const onDragSortPark = ({ currentIndex, targetIndex }: TagDragSortContext) => {
  if (currentIndex === targetIndex) {
    return;
  }
  const list = [...park.value];
  const [moved] = list.splice(currentIndex, 1);
  if (moved === undefined) {
    return;
  }
  list.splice(targetIndex, 0, moved);
  park.value = list;
};
</script>
<style lang="less" scoped>
@import './index.less';
</style>

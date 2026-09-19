<template>
  <div v-if="isFormShow">
    <t-form
      class="base-form"
      :data="formData"
      :rules="FORM_RULES"
      label-align="top"
      :label-width="100"
      @reset="onReset"
      @submit="onSubmit"
    >
      <div class="form-basic-container">
        <div class="form-basic-item">
          <div class="form-basic-container-title">{{ $t('pages.taginfo.title') }}</div>
          <!-- 表单内容 -->

          <t-form-item :label="$t('pages.taginfo.duties')" name="duties">
            <t-tag-input
              v-model="duties"
              :placeholder="$t('pages.taginfo.dutiesPlaceholder')"
              :tag-props="{ theme: 'success' }"
              :max="tagMax.dutiesNumber"
              :maxcharacter="12"
              @enter="onEnterDuties"
            />
          </t-form-item>
          <t-form-item :label="$t('pages.taginfo.team')" name="team">
            <t-tag-input
              v-model="team"
              :placeholder="$t('pages.taginfo.teamPlaceholder')"
              :tag-props="{ theme: 'warning' }"
              :max="tagMax.teamNumber"
              :maxcharacter="12"
              @enter="onEnterTeam"
            />
          </t-form-item>
          <t-form-item :label="$t('pages.taginfo.region')" name="region">
            <t-tag-input
              v-model="region"
              :placeholder="$t('pages.taginfo.regionPlaceholder')"
              :tag-props="{ theme: 'danger' }"
              :max="tagMax.regionNumber"
              :maxcharacter="12"
              @enter="onEnterRegion"
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
<script lang="ts">
export default {
  name: 'TagInfo',
};
</script>
<script setup lang="ts">
import type { AxiosError } from 'axios';
import type { SubmitContext } from 'tdesign-vue-next';
import { MessagePlugin } from 'tdesign-vue-next';
import { onMounted, ref } from 'vue';

import { getSetList, getTagList, insertTag } from '@/api/taginfo';
import { translate } from '@/locales';
import { logError } from '@/utils/logger';

import { FORM_RULES, INITIAL_DATA, INITIAL_TAGJSON, INITIAL_TAGMAX } from './constants';

let dutiesNumber: number = 0;
let teamNumber: number = 0;
let regionNumber: number = 0;
const duties = ref<string[]>([]);
const team = ref<string[]>([]);
const region = ref<string[]>([]);

const isFormShow = ref(false);
onMounted(() => {
  fetchData();
  setTimeout(() => {
    isFormShow.value = true;
  }, 280);
});

const fetchData = async () => {
  try {
    const { list } = await getSetList();
    dutiesNumber = list[0].dutiesNumber;
    teamNumber = list[0].teamNumber;
    regionNumber = list[0].regionNumber;
    tagMax.value.dutiesNumber = dutiesNumber;
    tagMax.value.teamNumber = teamNumber;
    tagMax.value.regionNumber = regionNumber;
  } catch (e) {
    logError(e);
  }

  try {
    const { list } = await getTagList();
    duties.value.length = 0;
    team.value.length = 0;
    region.value.length = 0;
    list.forEach((item: { tagName: string; tagType: string }) => {
      if (item.tagType === 'duties') {
        duties.value.push(item.tagName);
      }
      if (item.tagType === 'team') {
        team.value.push(item.tagName);
      }
      if (item.tagType === 'region') {
        region.value.push(item.tagName);
      }
    });
  } catch (e) {
    logError(e);
  }
};

const formData = ref({ ...INITIAL_DATA });
const tagMax = ref({ ...INITIAL_TAGMAX });

const onReset = () => {
  fetchData();
};
const onSubmit = async (ctx: SubmitContext) => {
  const tag: Array<{ tagName: string; tagType: string }> = [];
  duties.value.forEach((item) => {
    const json = { ...INITIAL_TAGJSON };
    json.tagName = item;
    json.tagType = 'duties';
    tag.push(json);
  });

  team.value.forEach((item) => {
    const json = { ...INITIAL_TAGJSON };
    json.tagName = item;
    json.tagType = 'team';
    tag.push(json);
  });

  region.value.forEach((item) => {
    const json = { ...INITIAL_TAGJSON };
    json.tagName = item;
    json.tagType = 'region';
    tag.push(json);
  });

  try {
    await insertTag(tag);
    MessagePlugin.success(translate('operate.createdSuccessPrompt'));
  } catch (e) {
    logError(e);
    // 后端拒绝时展示具体原因(如无权限提示),否则回退到通用失败词条 20260918 修改
    const errMsg = (e as AxiosError<{ error?: string }>)?.response?.data?.error;
    MessagePlugin.error(errMsg || translate('operate.createdFailedPrompt'));
  }
};

const onEnterDuties = (value: Array<string | number>, { inputValue }: { inputValue: string }) => {
  duties.value = Array.from(new Set(duties.value));
  if (value.length >= dutiesNumber && inputValue) {
    MessagePlugin.warning(translate('pages.taginfo.tagAtMost') + dutiesNumber + translate('pages.taginfo.tag'));
  }
};
const onEnterTeam = (value: Array<string | number>, { inputValue }: { inputValue: string }) => {
  team.value = Array.from(new Set(team.value));
  if (value.length >= teamNumber && inputValue) {
    MessagePlugin.warning(translate('pages.taginfo.tagAtMost') + teamNumber + translate('pages.taginfo.tag'));
  }
};
const onEnterRegion = (value: Array<string | number>, { inputValue }: { inputValue: string }) => {
  region.value = Array.from(new Set(region.value));
  if (value.length >= regionNumber && inputValue) {
    MessagePlugin.warning(translate('pages.taginfo.tagAtMost') + regionNumber + translate('pages.taginfo.tag'));
  }
};
</script>
<style lang="less" scoped>
@import './index.less';
</style>

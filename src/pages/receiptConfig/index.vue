<template>
  <div v-if="isFormShow">
    <t-form class="base-form" :data="formData" label-align="top" :label-width="100" @reset="onReset" @submit="onSubmit">
      <div class="form-basic-container">
        <div class="form-basic-item">
          <div class="form-basic-container-title">{{ $t('pages.receiptConfig.title') }}</div>
          <t-form-item :label="$t('pages.receiptConfig.region')" name="region">
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

          <t-form-item :label="$t('pages.receiptConfig.prefix')" name="prefix">
            <t-input
              v-model="formData.prefix"
              :placeholder="$t('pages.receiptConfig.prefixPlaceholder')"
              :maxcharacter="40"
              show-limit-number
            />
          </t-form-item>

          <t-form-item :label="$t('pages.receiptConfig.phone')" name="phone">
            <t-input
              v-model="formData.phone"
              :placeholder="$t('pages.receiptConfig.phonePlaceholder')"
              :maxcharacter="40"
              show-limit-number
            />
          </t-form-item>

          <t-form-item :label="$t('pages.receiptConfig.address')" name="address">
            <t-input
              v-model="formData.address"
              :placeholder="$t('pages.receiptConfig.addressPlaceholder')"
              :maxcharacter="40"
              show-limit-number
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

import type { SelectModel } from '@/api/model/parkModel';
import type { ReceiptConfigModel } from '@/api/model/receiptConfigModel';
import { getRegionList } from '@/api/park';
import { getReceiptConfig, saveReceiptConfig } from '@/api/receiptConfig';
import { i18n } from '@/locales';
import { logError } from '@/utils/logger';

import { INITIAL_DATA } from './constants';

defineOptions({
  name: 'ReceiptConfig',
});

type ReceiptConfigFormData = Omit<typeof INITIAL_DATA, 'region'> & {
  region: string | number;
};

const translate = (key: string) => String(i18n.global.t(key));

const dataRegionList = ref<SelectModel[]>([]);
const isFormShow = ref(false);
const formData = ref<ReceiptConfigFormData>({ ...INITIAL_DATA });

onMounted(async () => {
  await fetchData();
  setTimeout(() => {
    isFormShow.value = true;
  }, 280);
});

const fetchData = async () => {
  try {
    const { list } = await getRegionList();
    dataRegionList.value = list;
    onReset();
  } catch (e) {
    logError(e);
  }
};

// 按当前选中区域查询收据配制：有数据回填表单，无数据清空待新增
const getReceiptData = async () => {
  try {
    const { list } = await getReceiptConfig(String(formData.value.region));
    if (list && list.length > 0) {
      const data: ReceiptConfigModel = list[0];
      formData.value.idConfig = data.idConfig;
      formData.value.prefix = data.prefix || '';
      formData.value.phone = data.phone || '';
      formData.value.address = data.address || '';
    } else {
      formData.value.idConfig = 0;
      formData.value.prefix = '';
      formData.value.phone = '';
      formData.value.address = '';
    }
  } catch (e) {
    logError(e);
  }
};

const regionOnchange = () => {
  getReceiptData();
};

// 重置：区域默认取第一个，并按默认区域回填
const onReset = () => {
  if (!dataRegionList.value.length) {
    return;
  }
  const region = dataRegionList.value[0].value;
  formData.value.region = region;
  getReceiptData();
};

// 提交：单据前缀、单位电话、单位地址为空时弹消息提示（样式与修改销售"请输入实收金额"一致）
const onSubmit = async () => {
  const { prefix, phone, address } = formData.value;
  if (prefix === undefined || String(prefix).trim() === '') {
    return MessagePlugin.warning(translate('pages.receiptConfig.prefixPlaceholder'));
  }
  if (phone === undefined || String(phone).trim() === '') {
    return MessagePlugin.warning(translate('pages.receiptConfig.phonePlaceholder'));
  }
  if (address === undefined || String(address).trim() === '') {
    return MessagePlugin.warning(translate('pages.receiptConfig.addressPlaceholder'));
  }

  const isModify = formData.value.idConfig !== 0;
  try {
    await saveReceiptConfig({
      idConfig: formData.value.idConfig,
      prefix: String(prefix).trim(),
      region: String(formData.value.region),
      phone: String(phone).trim(),
      address: String(address).trim(),
    });
    MessagePlugin.success(translate(isModify ? 'operate.modifySuccessPrompt' : 'operate.createdSuccessPrompt'));
    await getReceiptData();
  } catch (e) {
    logError(e);
    MessagePlugin.error(translate(isModify ? 'operate.modifyFailedPrompt' : 'operate.createdFailedPrompt'));
  }
};
</script>
<style lang="less" scoped>
@import './index.less';
</style>

<template>
  <div v-if="isFormShow">
    <t-form
      class="base-form"
      :data="formData"
      label-align="top"
      :label-width="100"
      required-mark-position="right"
      @reset="onReset"
      @submit="onSubmit"
    >
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

          <t-form-item :required-mark="true" :label="$t('pages.receiptConfig.prefix')" name="prefix">
            <t-input
              v-model="formData.prefix"
              :placeholder="$t('pages.receiptConfig.prefixPlaceholder')"
              :maxcharacter="40"
              :readonly="!canSetting"
              show-limit-number
            />
          </t-form-item>

          <t-form-item :required-mark="true" :label="$t('pages.receiptConfig.phone')" name="phone">
            <t-input
              v-model="formData.phone"
              :placeholder="$t('pages.receiptConfig.phonePlaceholder')"
              :maxcharacter="40"
              :readonly="!canSetting"
              show-limit-number
            />
          </t-form-item>

          <t-form-item :required-mark="true" :label="$t('pages.receiptConfig.address')" name="address">
            <t-input
              v-model="formData.address"
              :placeholder="$t('pages.receiptConfig.addressPlaceholder')"
              :maxcharacter="40"
              :readonly="!canSetting"
              show-limit-number
            />
          </t-form-item>
        </div>
      </div>

      <div class="form-submit-container">
        <div class="form-submit-sub">
          <div class="form-submit-left">
            <!-- 无“设置提交”权限时整页只读:输入框 readonly、保存与取消(重置)一并隐藏 20261023 新增, -->
            <t-button
              v-if="canSetting"
              theme="primary"
              class="form-submit-confirm"
              type="submit"
              :disabled="submitting"
            >
              {{ $t('pages.receiptConfig.submit') }}
            </t-button>
            <t-button v-if="canSetting" type="reset" class="form-submit-cancel" theme="default" variant="base">
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
import { computed, onMounted, ref } from 'vue';

import type { SelectModel } from '@/api/model/parkModel';
import type { ReceiptConfigModel } from '@/api/model/receiptConfigModel';
import { getRegionList } from '@/api/park';
import { getReceiptConfig, saveReceiptConfig } from '@/api/receiptConfig';
import { hasFunctionPower, useSubmitGuard } from '@/hooks';
import { translate } from '@/locales';
import { extractServerError } from '@/utils/apiError';
import { logError } from '@/utils/logger';

import { INITIAL_DATA } from './constants';

defineOptions({
  name: 'ReceiptConfig',
});

// 保存按钮按“功能×动作”白名单判权(单功能菜单功能键=菜单名),powerConfig=NULL 的存量操作员回退放行 20261023 补全,
// 动作键用 setting(对应“设置提交”按钮),不再复用通用的 modify 20261023 调整,
const canReceiptConfig = (action: string) => hasFunctionPower('receiptConfig', 'receiptConfig', action);
// 无“设置提交”权限时整页只读:三个输入框 readonly,保存/取消按钮隐藏;
// 服务端 /receiptConfig-save/config 同样按 setting 拦截,前端只读只为避免无效操作 20261023 新增,
const canSetting = computed(() => canReceiptConfig('setting'));

type ReceiptConfigFormData = Omit<typeof INITIAL_DATA, 'region'> & {
  region: string | number;
};

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
    // 失败必须让用户看见:此前只写控制台,界面表现为“点了没反应”(审查修复 20261021 P2),
    MessagePlugin.error(extractServerError(e) || translate('operate.listLoadFailedPrompt'));
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
// 确认提交防重复：type=submit 表单提交无锁，双击/回车会并发发出两次写接口；submitting 同步上锁并绑定按钮 :disabled 20261004 新增
const { submitting, run } = useSubmitGuard();
// 只读态下即使回车触发 form submit 也直接忽略(服务端有 functionPower 守卫,前端不发注定 403 的请求)20261023 新增,
const onSubmit = () => {
  if (!canSetting.value) {
    return;
  }
  run(submitCore);
};
const submitCore = async () => {
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

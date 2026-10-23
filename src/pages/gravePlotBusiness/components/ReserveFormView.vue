<template>
  <!-- 预定形态字段（联系人/电话/预定限期/备注）：从 gravePlotBusiness/index.vue 拆出的子视图（20261020 P2 S2 巨石拆分第四批）。
       仅渲染字段列（多个 t-col 片段，直挂父页共享 t-row），数据经 inject 共享页面 formBusinessData（联系人/电话映射
       reserve 表的 liaison/liaisonPhone 列，提交/校验仍读页面同一份数据）；字段与校验口径同原独立预定页（该页已下线）20261023 调整。 -->
  <t-col :span="6">
    <t-form-item :required-mark="true" :label="$t('pages.gravePlotBusiness.liaison')" name="payer">
      <t-input
        v-model="formBusinessData.payer"
        :maxcharacter="20"
        show-limit-number
        :style="{ width: '322px' }"
        :placeholder="$t('pages.gravePlotBusiness.liaisonPlaceholder')"
      />
    </t-form-item>
  </t-col>
  <t-col :span="6">
    <t-form-item :required-mark="true" :label="$t('pages.gravePlotBusiness.liaisonPhone')" name="payerPhone">
      <t-input
        v-model="formBusinessData.payerPhone"
        :maxcharacter="11"
        show-limit-number
        :style="{ width: '322px' }"
        :placeholder="$t('pages.gravePlotBusiness.liaisonPhonePlaceholder')"
        @change="onPhoneChange"
      />
    </t-form-item>
  </t-col>
  <t-col :span="6">
    <!-- 预定限期（reserve.reservationExpireDate）：必填，库列为 datetime，前端只取日期部分；
         最晚今天+10 天的范围校验在父页提交前完成 20261023 新增 -->
    <t-form-item
      :required-mark="true"
      :label="$t('pages.gravePlotBusiness.reservationExpireDate')"
      name="reservationExpireDate"
    >
      <t-date-picker
        v-model="formBusinessData.reservationExpireDate"
        :style="{ width: '322px' }"
        theme="primary"
        mode="date"
        separator="/"
        :placeholder="$t('pages.gravePlotBusiness.reservationExpireDatePlaceholder')"
      />
    </t-form-item>
  </t-col>
  <t-col :span="6">
    <t-form-item :label="$t('pages.gravePlotBusiness.remark')" name="remark">
      <t-input
        v-model="formBusinessData.remark"
        :maxcharacter="20"
        show-limit-number
        :style="{ width: '322px' }"
        :placeholder="$t('pages.gravePlotBusiness.remarkPlaceholder')"
      />
    </t-form-item>
  </t-col>
</template>
<script lang="ts">
export default {
  name: 'ReserveFormView',
};
</script>
<script setup lang="ts">
import { inject } from 'vue';

import { businessFormDataKey } from '../constants';

// 电话仅允许数字、最长 11 位：输入时过滤非数字字符并截断（口径同父页购墓人电话）20261023 新增
const emit = defineEmits<{ (e: 'payer-phone-change', value: string | number): void }>();

// 业务登记表单数据：由父页 provide 的 Ref（预定形态用 payer/payerPhone/reservationExpireDate/remark），
// 模板自动解包后 v-model 编辑即写回同一对象 20261020 P2 S2 拆分
const formBusinessData = inject(businessFormDataKey)!;

const onPhoneChange = (value: string | number) => {
  emit('payer-phone-change', value);
};
</script>

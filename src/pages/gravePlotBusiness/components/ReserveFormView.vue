<template>
  <!-- 预定形态字段（联系人/电话）：从 gravePlotBusiness/index.vue 拆出的子视图（20261020 P2 S2 巨石拆分第四批）。
       仅渲染字段列（多个 t-col 片段，直挂父页共享 t-row），数据经 inject 共享页面 formBusinessData（映射 graveplotbusiness 的
       payer/payerPhone 列，提交/校验仍读页面同一份数据，逻辑不变）；宽度/顺序与原内联完全一致。 -->
  <t-col :span="6">
    <t-form-item :required="true" :label="$t('pages.gravePlotBusiness.liaison')" name="payer">
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
    <t-form-item :label="$t('pages.gravePlotBusiness.liaisonPhone')" name="payerPhone">
      <t-input
        v-model="formBusinessData.payerPhone"
        :maxcharacter="11"
        show-limit-number
        :style="{ width: '322px' }"
        :placeholder="$t('pages.gravePlotBusiness.liaisonPhonePlaceholder')"
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

// 业务登记表单数据：由父页 provide 的 Ref（预定形态用 payer/payerPhone 两列），模板自动解包后 v-model 编辑即写回同一对象 20261020 P2 S2 拆分
const formBusinessData = inject(businessFormDataKey)!;
</script>

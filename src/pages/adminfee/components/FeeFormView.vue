<template>
  <!-- 管理费收款登记表单的付款人/缴费字段块（payer/payePrhone/payerIDCard/payAmount/termYears/startDate/endDate/remark）：
       从 adminfee/index.vue 拆出的页内子视图（20261020 P2 S2 巨石拆分批一）。原各列均带同一 v-if="!isDeleteMode"，
       判定统一故上提至挂载标签 v-if，本组件内不再逐列判定（口径完全等价）。数据经 inject 共享页面 formFeeData（v-model 写回同一份），
       付款人「选择」按钮与电话数字过滤经事件回本页处理（handleOpenContactsSelect / onPayePrhoneChange），提交/校验/票据仍留本页；
       字段宽度用内联 :style（322px）随模板迁入，payer-inline-input 宽度覆盖留父页 :deep（穿透深层元素照常命中），本组件无 scoped 样式。 -->
  <t-col :span="6">
    <t-form-item :required-mark="true" :label="$t('pages.adminfee.payer')" name="payer">
      <!-- 付款人输入框右侧“选择”按钮：样式/交互同墓位业务下葬页联系人选择，
           点击打开联系人选择页，选中后回填付款人+电话+身份证号 20261004 新增/调整 -->
      <div style="display: flex; gap: 8px; align-items: center">
        <!-- 输入框自适应填充剩余宽度，与“选择”按钮整体右缘对齐容器右界（宽度由本页 less 控制，同 contacts-inline-input）20261004 新增 -->
        <t-input
          v-model="formFeeData.payer"
          class="payer-inline-input"
          :maxcharacter="20"
          show-limit-number
          :placeholder="$t('pages.adminfee.payerPlaceholder')"
        />
        <t-button theme="default" variant="outline" style="margin-left: auto" @click="$emit('open-contacts')">
          {{ $t('pages.adminfee.select') }}
        </t-button>
      </div>
    </t-form-item>
  </t-col>
  <!-- 付款人电话：库列名原始拼写 payePrhone，改为必填 20261005 调整 -->
  <t-col :span="6">
    <t-form-item :required-mark="true" :label="$t('pages.adminfee.payePrhone')" name="payePrhone">
      <t-input
        v-model="formFeeData.payePrhone"
        :maxcharacter="11"
        show-limit-number
        :style="{ width: '322px' }"
        :placeholder="$t('pages.adminfee.payePrhonePlaceholder')"
        @change="(value) => $emit('paye-prone-change', value)"
      />
    </t-form-item>
  </t-col>
  <!-- 付款人身份证号：库列 payerIDCard，非必填，可由付款人“选择”回填 20261004 新增 -->
  <t-col :span="6">
    <t-form-item :label="$t('pages.adminfee.payerIDCard')" name="payerIDCard">
      <t-input
        v-model="formFeeData.payerIDCard"
        :maxcharacter="18"
        show-limit-number
        :style="{ width: '322px' }"
        :placeholder="$t('pages.adminfee.payerIDCardPlaceholder')"
      />
    </t-form-item>
  </t-col>
  <t-col :span="6">
    <t-form-item :required-mark="true" :label="$t('pages.adminfee.payAmount')" name="payAmount">
      <t-input-number
        v-model="formFeeData.payAmount"
        theme="normal"
        :min="0"
        :decimal-places="0"
        :style="{ width: '322px' }"
        :placeholder="$t('pages.adminfee.payAmountPlaceholder')"
      />
    </t-form-item>
  </t-col>
  <t-col :span="6">
    <t-form-item :required-mark="true" :label="$t('pages.adminfee.termYears')" name="termYears">
      <t-select
        v-model="formFeeData.termYears"
        :style="{ width: '322px' }"
        class="demo-select-base"
        clearable
        :placeholder="$t('pages.adminfee.termYearsPlaceholder')"
      >
        <t-option v-for="item in termYearsOptions" :key="item.value" :value="item.value" :label="item.label" />
      </t-select>
    </t-form-item>
  </t-col>
  <!-- 开始日期只读：自动取该墓位首次下葬时间，新建时后端锚定，修改时取记录原值 20260909 新增（与缴费年限互换位置 20261004 调整） -->
  <t-col :span="6">
    <t-form-item :label="$t('pages.adminfee.startDate')" name="startDate">
      <t-input
        v-model="formFeeData.startDate"
        readonly
        :style="{ width: '322px' }"
        :placeholder="$t('pages.adminfee.startDatePlaceholder')"
      />
    </t-form-item>
  </t-col>
  <!-- 结束日期只读：自动 = 开始日期顺延缴费年限年 20260909 新增 -->
  <t-col :span="6">
    <t-form-item :label="$t('pages.adminfee.endDate')" name="endDate">
      <t-input
        v-model="formFeeData.endDate"
        readonly
        :style="{ width: '322px' }"
        :placeholder="$t('pages.adminfee.endDatePlaceholder')"
      />
    </t-form-item>
  </t-col>
  <!-- 备注：改为半宽列，紧接结束日期同一行右侧 20261004 调整 -->
  <t-col :span="6">
    <t-form-item :label="$t('pages.adminfee.remark')" name="remark">
      <t-input
        v-model="formFeeData.remark"
        :maxcharacter="50"
        :height="124"
        :placeholder="$t('pages.adminfee.remarkPlaceholder')"
      />
    </t-form-item>
  </t-col>
</template>
<script lang="ts">
export default {
  name: 'FeeFormView',
};
</script>
<script setup lang="ts">
import { inject } from 'vue';

import { feeFormDataKey } from '../constants';

// 缴费年限下拉选项（父页 termYearsOptions，来自用户设置），仅展示无需回写
defineProps<{
  termYearsOptions: { value: number; label: string }[];
}>();

defineEmits<{
  (e: 'open-contacts'): void;
  (e: 'paye-prone-change', value: string | number): void;
}>();

// 管理费收款表单数据：由父页 provide 的 Ref（页面持有，提交/回填读同一份），模板自动解包后 v-model 编辑即写回 20261020 P2 S2 拆分
const formFeeData = inject(feeFormDataKey)!;
</script>

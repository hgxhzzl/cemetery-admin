<template>
  <!-- 销售形态业务登记字段网格（编号/实收金额/购墓人/购墓人电话/购墓人身份证号/收款人 + 安葬者四字段/逝者关系/备注）：
       从 gravePlotBusiness/index.vue 拆出的子视图（20261020 P2 S2 巨石拆分第三批）。本组件仅渲染字段列（多个 t-col 片段，
       直挂父页共享 t-row），数据经 inject 共享页面 formBusinessData（Ref 在模板自动解包，编辑即写回同一对象，
       提交/校验/票据仍读页面同一份数据，逻辑一字未改）；formMode 由父页传入以保留购墓人/付款人标签三元判定与安葬者子块条件；
       逝者关系下拉参考数据经 options 传入；实收金额失焦千分位、购墓人电话数字过滤两个字段级处理经事件回父页
       changeNumberFocus / onPayerPhoneChange（仍写回共享 formBusinessData）。字段宽度/顺序与原页面完全一致。 -->
  <t-col :span="6">
    <!-- 编号字段标题统一为"编号"（原"证件编号"，serialNo 字段标题全项目统一 20261003 修改）：仅销售形态；
         销售形态调整为必填：加红星并改用专用占位键（原 serialNoPlaceholder 由安葬证只读证件编号共用，不可直改）20261005 修改 -->
    <t-form-item :required-mark="true" :label="$t('pages.gravePlotBusiness.serialNo')" name="serialNo">
      <t-input
        v-model="formBusinessData.serialNo"
        :maxcharacter="6"
        show-limit-number
        :style="{ width: '312px' }"
        :placeholder="$t('pages.gravePlotBusiness.serialNoRequiredPlaceholder')"
      />
    </t-form-item>
  </t-col>
  <t-col :span="6">
    <!-- 实收金额为销售提交必校验项，补红星标记（:required 在本版本不渲染星号，用 required-mark） 20261005 新增；
         失焦千分位格式化经 price-blur 回父页 changeNumberFocus（写回共享 formBusinessData.realPriceString）20261020 拆分 -->
    <t-form-item :required-mark="true" :label="$t('pages.gravePlotBusiness.realPrice')" name="realPrice">
      <t-input-number
        v-model="formBusinessData.realPriceString"
        large-number
        max="9999999"
        min="0"
        theme="normal"
        :style="{ width: '312px' }"
        :placeholder="$t('pages.gravePlotBusiness.realPricPlaceholder')"
        @blur="$emit('price-blur')"
      />
    </t-form-item>
  </t-col>
  <t-col :span="6">
    <t-form-item
      :required-mark="true"
      :label="formMode === 'sale' ? $t('pages.room.buyer') : $t('pages.gravePlotBusiness.payer')"
      name="payer"
    >
      <t-input
        v-model="formBusinessData.payer"
        :maxcharacter="20"
        show-limit-number
        :style="{ width: '312px' }"
        :placeholder="$t('pages.gravePlotBusiness.buyerPlaceholder')"
      />
    </t-form-item>
  </t-col>
  <t-col :span="6">
    <t-form-item
      :required-mark="true"
      :label="formMode === 'sale' ? $t('pages.gravePlotBusiness.buyerPhone') : $t('pages.gravePlotBusiness.phone')"
      name="payerPhone"
    >
      <t-input
        v-model="formBusinessData.payerPhone"
        :maxcharacter="11"
        show-limit-number
        :style="{ width: '312px' }"
        :placeholder="$t('pages.gravePlotBusiness.buyerPhonePlaceholder')"
        @change="(val) => $emit('payer-phone-change', val)"
      />
    </t-form-item>
  </t-col>
  <t-col :span="6">
    <t-form-item
      :required-mark="true"
      :label="
        formMode === 'sale' ? $t('pages.gravePlotBusiness.buyerIDCard') : $t('pages.gravePlotBusiness.payerIDCard')
      "
      name="payerIDCard"
    >
      <t-input
        v-model="formBusinessData.payerIDCard"
        :maxcharacter="18"
        show-limit-number
        :style="{ width: '312px' }"
        :placeholder="$t('pages.gravePlotBusiness.buyerIDCardPlaceholder')"
      />
    </t-form-item>
  </t-col>
  <t-col :span="6">
    <t-form-item :label="$t('pages.gravePlotBusiness.payee')" name="payee">
      <t-input
        v-model="formBusinessData.payee"
        :maxcharacter="20"
        show-limit-number
        :style="{ width: '312px' }"
        :placeholder="$t('pages.gravePlotBusiness.payeePlaceholder')"
      />
    </t-form-item>
  </t-col>
  <!-- 安葬者三字段：销售形态下随开单同步 buried 表（修改时按 idSale 联查回填，无对应 buried 记录则为空）20260923 新增 -->
  <template v-if="formMode === 'sale'">
    <t-col :span="6">
      <t-form-item :required-mark="true" :label="$t('pages.gravePlotBusiness.deceased')" name="deceased">
        <t-input
          v-model="formBusinessData.deceased"
          :maxcharacter="20"
          show-limit-number
          :style="{ width: '312px' }"
          :placeholder="$t('pages.gravePlotBusiness.deceasedRequiredPlaceholder')"
        />
      </t-form-item>
    </t-col>
    <!-- 死亡日期（库列 buried.deathDate）：销售形态随开单同步 buried 表，位置在下葬日期左侧、必填加星（口径同安葬者）20261011 新增 20261017 改为必填 -->
    <t-col :span="6">
      <t-form-item :required-mark="true" :label="$t('pages.gravePlotBusiness.deathDate')" name="deathDate">
        <t-date-picker
          v-model="formBusinessData.deathDate"
          :style="{ width: '312px' }"
          theme="primary"
          mode="date"
          separator="/"
          :placeholder="$t('pages.gravePlotBusiness.deathDatePlaceholder')"
        />
      </t-form-item>
    </t-col>
    <t-col :span="6">
      <t-form-item :label="$t('pages.gravePlotBusiness.burialDate')" name="burialDate">
        <t-date-picker
          v-model="formBusinessData.burialDate"
          :style="{ width: '312px' }"
          theme="primary"
          mode="date"
          separator="/"
          :placeholder="$t('pages.gravePlotBusiness.burialDatePlaceholder')"
        />
      </t-form-item>
    </t-col>
    <t-col :span="6">
      <t-form-item :label="$t('pages.gravePlotBusiness.deceasedIDCard')" name="deceasedIDCard">
        <t-input
          v-model="formBusinessData.deceasedIDCard"
          :maxcharacter="18"
          show-limit-number
          :style="{ width: '312px' }"
          :placeholder="$t('pages.gravePlotBusiness.deceasedIDCardPlaceholder')"
        />
      </t-form-item>
    </t-col>
    <!-- 逝者关系：安葬者身份证号右侧同行，仅销售形态录入，保存到 buried.deceasedRelation 20260924 新增；
         改为可选择可输入下拉（t-select filterable+creatable），
         参考数据取 taginfo 表 tagType=deceasedRelation（选择设置页维护），经 options 由父页传入 20261003 修改；
         新增死亡日期列后销售形态字段序为 安葬者/死亡日期/下葬日期/身份证号，逝者关系与备注同行占末行左右两列 20261011 修改 -->
    <t-col :span="6">
      <t-form-item :label="$t('pages.gravePlotBusiness.deceasedRelation')" name="deceasedRelation">
        <t-select
          v-model="formBusinessData.deceasedRelation"
          filterable
          creatable
          clearable
          :options="options"
          :style="{ width: '322px' }"
          :placeholder="$t('pages.gravePlotBusiness.deceasedRelationPlaceholder')"
        />
      </t-form-item>
    </t-col>
    <!-- 备注（sale.remark）：由字段块下方的整行输入框提进字段网格，与逝者关系同行（右位），
         字数上限 30 收紧到 20（与下葬形态备注一致）；宽度同列内其它控件取 322px 20261011 修改 -->
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
</template>
<script lang="ts">
export default {
  name: 'SaleFormView',
};
</script>
<script setup lang="ts">
import { inject } from 'vue';

import type { BusinessFormMode } from '../constants';
import { businessFormDataKey } from '../constants';

// formMode 由父页传入：保留购墓人/付款人标签三元判定与安葬者子块条件（本组件挂载时恒为 sale，但按原逻辑判定不改口径）20261020 P2 S2 拆分
defineProps<{ formMode: BusinessFormMode; options: { label: string; value: string }[] }>();

// 实收金额失焦千分位、购墓人电话数字过滤两个字段级处理上抛，父页接回 changeNumberFocus / onPayerPhoneChange 20261020 P2 S2 拆分
defineEmits<{ (e: 'price-blur'): void; (e: 'payer-phone-change', value: string | number): void }>();

// 业务登记表单数据：由父页 provide 的 Ref（页面持有，提交/校验/票据读同一份），模板自动解包后按字段 v-model 编辑即写回 20261020 P2 S2 拆分
const formBusinessData = inject(businessFormDataKey)!;
</script>

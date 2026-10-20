<template>
  <!-- 下葬形态新增/修改视图字段（安葬者/身份证号/死亡日期/下葬日期/联系人三字段/逝者关系/备注）：
       从 gravePlotBusiness/index.vue 拆出的子视图（20261020 P2 S2 巨石拆分第二批）。本组件仅渲染表单字段列
       （多个 t-col 片段，直挂父页共享 t-row），数据经 inject 共享页面 formBusinessData（Ref 在模板自动解包，
       编辑即写回同一对象，提交/校验仍读页面同一份数据，逻辑一字未改）；逝者关系下拉参考数据经 options 传入；
       联系人「选择」按钮上抛 open-contacts 事件回父页 handleOpenContactsSelect。字段布局/宽度口径与原页面完全一致。 -->
  <t-col :span="6">
    <t-form-item :required-mark="true" :label="$t('pages.gravePlotBusiness.deceased')" name="deceased">
      <t-input
        v-model="formBusinessData.deceased"
        :maxcharacter="20"
        show-limit-number
        :style="{ width: '322px' }"
        :placeholder="$t('pages.gravePlotBusiness.deceasedRequiredPlaceholder')"
      />
    </t-form-item>
  </t-col>
  <t-col :span="6">
    <t-form-item :label="$t('pages.gravePlotBusiness.deceasedIDCard')" name="deceasedIDCard">
      <t-input
        v-model="formBusinessData.deceasedIDCard"
        :maxcharacter="18"
        show-limit-number
        :style="{ width: '322px' }"
        :placeholder="$t('pages.gravePlotBusiness.deceasedIDCardPlaceholder')"
      />
    </t-form-item>
  </t-col>
  <!-- 死亡日期（库列 buried.deathDate）：紧接下葬日期左侧、必填加星（口径同销售形态）20261011 新增 20261020 改为必填 -->
  <t-col :span="6">
    <t-form-item :required-mark="true" :label="$t('pages.gravePlotBusiness.deathDate')" name="deathDate">
      <t-date-picker
        v-model="formBusinessData.deathDate"
        :style="{ width: '322px' }"
        theme="primary"
        mode="date"
        separator="/"
        :placeholder="$t('pages.gravePlotBusiness.deathDatePlaceholder')"
      />
    </t-form-item>
  </t-col>
  <t-col :span="6">
    <t-form-item :required-mark="true" :label="$t('pages.gravePlotBusiness.burialDate')" name="burialDate">
      <t-date-picker
        v-model="formBusinessData.burialDate"
        :style="{ width: '322px' }"
        theme="primary"
        mode="date"
        separator="/"
        :placeholder="$t('pages.gravePlotBusiness.burialDateRequiredPlaceholder')"
      />
    </t-form-item>
  </t-col>
  <t-col :span="6">
    <t-form-item :label="$t('pages.gravePlotBusiness.contacts')" name="contacts">
      <!-- 联系人输入框右侧“选择”按钮：上抛 open-contacts 回父页打开联系人选择页，选中后回填联系人三字段（同下葬页）20260923 新增 -->
      <div style="display: flex; gap: 8px; align-items: center">
        <!-- 联系人输入框自适应填充剩余宽度，与“选择”按钮整体右缘对齐容器右界（宽度由父页 less :deep 控制）20260923 修改 -->
        <t-input
          v-model="formBusinessData.contacts"
          class="contacts-inline-input"
          :maxcharacter="20"
          show-limit-number
          :placeholder="$t('pages.gravePlotBusiness.contactsPlaceholder')"
        />
        <t-button theme="default" variant="outline" style="margin-left: auto" @click="$emit('open-contacts')">
          {{ $t('pages.gravePlotBusiness.select') }}
        </t-button>
      </div>
    </t-form-item>
  </t-col>
  <t-col :span="6">
    <t-form-item :label="$t('pages.gravePlotBusiness.contactsPhone')" name="contactsphone">
      <t-input
        v-model="formBusinessData.contactsphone"
        :maxcharacter="11"
        show-limit-number
        :style="{ width: '322px' }"
        :placeholder="$t('pages.gravePlotBusiness.contactsPhonePlaceholder')"
      />
    </t-form-item>
  </t-col>
  <t-col :span="6">
    <t-form-item :label="$t('pages.gravePlotBusiness.contactsIDCard')" name="contactsIDCard">
      <t-input
        v-model="formBusinessData.contactsIDCard"
        :maxcharacter="18"
        show-limit-number
        :style="{ width: '322px' }"
        :placeholder="$t('pages.gravePlotBusiness.contactsIDCardPlaceholder')"
      />
    </t-form-item>
  </t-col>
  <!-- 逝者关系：由字段块下方的独立行提进字段网格，跟联系人身份证号同行（右位），
       顺带补齐上一轮新增死亡日期后末行右列的空位；下拉写法与销售形态一致 20261011 修改 -->
  <t-col :span="6">
    <t-form-item :label="$t('pages.gravePlotBusiness.deceasedRelation')" name="deceasedRelation">
      <!-- 参考数据取 taginfo 表 tagType=deceasedRelation（选择设置页维护），经 options 由父页传入 20261003 新增 -->
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
  <!-- 备注：单独占满一行（span=12），输入框经 remark-fullrow-input 撑满行宽（父页 less :deep 控制）；
       字数上限 20 与原多行高度维持不动 20261011 修改 -->
  <t-col :span="12">
    <t-form-item :label="$t('pages.gravePlotBusiness.remark')" name="remark">
      <t-input
        v-model="formBusinessData.remark"
        class="remark-fullrow-input"
        :maxcharacter="20"
        show-limit-number
        :height="124"
        :placeholder="$t('pages.gravePlotBusiness.remarkPlaceholder')"
      />
    </t-form-item>
  </t-col>
</template>
<script lang="ts">
export default {
  name: 'BuriedFormView',
};
</script>
<script setup lang="ts">
import { inject } from 'vue';

import { businessFormDataKey } from '../constants';

// 逝者关系下拉参考数据（父页 loadDeceasedRelationOptions 维护，只读展示）20261020 P2 S2 拆分
defineProps<{ options: { label: string; value: string }[] }>();

// 联系人「选择」按钮点击上抛，父页接回 handleOpenContactsSelect（打开联系人选择页/回填逻辑仍留父页）20261020 P2 S2 拆分
defineEmits<{ (e: 'open-contacts'): void }>();

// 业务登记表单数据：由父页 provide 的 Ref（页面持有，提交/校验读同一份），模板自动解包后按字段 v-model 编辑即写回；
// 本组件不做任何提交/校验处理 20261020 P2 S2 拆分
const formBusinessData = inject(businessFormDataKey)!;
</script>

<template>
  <!-- 联系人形态新增/修改字段（联系人/电话/身份证号）：从 gravePlotBusiness/index.vue 拆出的子视图（20261020 P2 S2 巨石拆分第四批）。
       仅渲染字段列（多个 t-col 片段，直挂父页共享 t-row），数据经 inject 共享页面 formContactsData（contacts 表三字段，
       提交/校验仍读页面同一份数据，逻辑不变）；电话数字过滤经事件回本页 onContactsPhoneChange（仍写回共享 formContactsData）；
       宽度/顺序与原内联完全一致。 -->
  <t-col :span="6">
    <t-form-item :required-mark="true" :label="$t('pages.gravePlotBusiness.contacts')" name="contacts">
      <t-input
        v-model="formContactsData.contacts"
        :maxcharacter="20"
        show-limit-number
        :style="{ width: '322px' }"
        :placeholder="$t('pages.gravePlotBusiness.contactsRequiredPlaceholder')"
      />
    </t-form-item>
  </t-col>
  <t-col :span="6">
    <t-form-item :required-mark="true" :label="$t('pages.gravePlotBusiness.contactsPhone')" name="contactsPhone">
      <t-input
        v-model="formContactsData.contactsPhone"
        :maxcharacter="11"
        show-limit-number
        :style="{ width: '322px' }"
        :placeholder="$t('pages.gravePlotBusiness.contactsPhoneRequiredPlaceholder')"
        @change="(val) => $emit('contacts-phone-change', val)"
      />
    </t-form-item>
  </t-col>
  <t-col :span="6">
    <t-form-item :label="$t('pages.gravePlotBusiness.contactsIDCard')" name="contactsIDCard">
      <t-input
        v-model="formContactsData.contactsIDCard"
        :maxcharacter="18"
        show-limit-number
        :style="{ width: '322px' }"
        :placeholder="$t('pages.gravePlotBusiness.contactsIDCardPlaceholder')"
      />
    </t-form-item>
  </t-col>
</template>
<script lang="ts">
export default {
  name: 'ContactsFormView',
};
</script>
<script setup lang="ts">
import { inject } from 'vue';

import { contactsFormDataKey } from '../constants';

// 联系人电话数字过滤上抛，父页接回 onContactsPhoneChange（写回共享 formContactsData）20261020 P2 S2 拆分
defineEmits<{ (e: 'contacts-phone-change', value: string | number): void }>();

// 联系人表单数据：由父页 provide 的 Ref（页面持有，提交/校验读同一份），模板自动解包后按字段 v-model 编辑即写回 20261020 P2 S2 拆分
const formContactsData = inject(contactsFormDataKey)!;
</script>

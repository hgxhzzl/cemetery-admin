<template>
  <!-- 迁出登记表单的可编辑字段块（transferOutDate/destination/reason/contacts/contactsphone/contactsIDCard）：
       从 transferOut/index.vue 拆出的页内子视图（20261020 P2 S2 巨石拆分批一）。原各列均带同一 v-if="!isDeleteMode"，
       判定统一故上提至挂载标签，本组件内不再逐列判定（口径等价）。数据经 inject 共享页面 formTransferOutData（v-model 写回同一份），
       联系人「选择」按钮经事件回本页 handleOpenContactsSelect，提交/校验/回填仍留本页；字段宽度全用内联 :style，随模板 verbatim 迁入，本组件无 scoped 样式。 -->
  <t-col :span="6">
    <t-form-item :required-mark="true" :label="$t('pages.transferOut.transferOutDate')" name="transferOutDate">
      <t-date-picker
        v-model="formTransferOutData.transferOutDate"
        :style="{ width: '322px' }"
        theme="primary"
        mode="date"
        separator="/"
        :placeholder="$t('pages.transferOut.transferOutDatePlaceholder')"
      />
    </t-form-item>
  </t-col>
  <t-col :span="6">
    <t-form-item :required-mark="true" :label="$t('pages.transferOut.destination')" name="destination">
      <t-input
        v-model="formTransferOutData.destination"
        :maxcharacter="100"
        show-limit-number
        :style="{ width: '322px' }"
        :placeholder="$t('pages.transferOut.destinationPlaceholder')"
      />
    </t-form-item>
  </t-col>
  <t-col :span="6">
    <t-form-item :label="$t('pages.transferOut.reason')" name="reason">
      <t-input
        v-model="formTransferOutData.reason"
        :maxcharacter="100"
        show-limit-number
        :style="{ width: '322px' }"
        :placeholder="$t('pages.transferOut.reasonPlaceholder')"
      />
    </t-form-item>
  </t-col>
  <t-col :span="6">
    <t-form-item :label="$t('pages.transferOut.contacts')" name="contacts">
      <!-- 联系人输入框右侧“选择”按钮：打开联系人选择页，选中后回填联系人/电话/身份证号（功能与样式同墓位业务页下葬）20261005 新增 -->
      <div style="display: flex; gap: 8px; align-items: center">
        <t-input
          v-model="formTransferOutData.contacts"
          :maxcharacter="20"
          show-limit-number
          :style="{ width: '240px' }"
          :placeholder="$t('pages.transferOut.contactsPlaceholder')"
        />
        <t-button theme="default" variant="outline" style="margin-left: auto" @click="$emit('open-contacts')">
          {{ $t('pages.transferOut.select') }}
        </t-button>
      </div>
    </t-form-item>
  </t-col>
  <t-col :span="6">
    <t-form-item :label="$t('pages.transferOut.contactsphone')" name="contactsphone">
      <t-input
        v-model="formTransferOutData.contactsphone"
        :maxcharacter="11"
        show-limit-number
        :style="{ width: '322px' }"
        :placeholder="$t('pages.transferOut.contactsphonePlaceholder')"
      />
    </t-form-item>
  </t-col>
  <!-- 联系人身份证号：在联系人电话右侧同行，非必填，最长 18 位（同墓位业务页/下葬页）20261005 新增 -->
  <t-col :span="6">
    <t-form-item :label="$t('pages.transferOut.contactsIDCard')" name="contactsIDCard">
      <t-input
        v-model="formTransferOutData.contactsIDCard"
        :maxcharacter="18"
        show-limit-number
        :style="{ width: '322px' }"
        :placeholder="$t('pages.transferOut.contactsIDCardPlaceholder')"
      />
    </t-form-item>
  </t-col>
</template>
<script lang="ts">
export default {
  name: 'TransferOutFormView',
};
</script>
<script setup lang="ts">
import { inject } from 'vue';

import { transferOutFormDataKey } from '../constants';

defineEmits<{
  (e: 'open-contacts'): void;
}>();

// 迁出登记表单数据：由父页 provide 的 Ref（页面持有，提交/回填读同一份），模板自动解包后 v-model 编辑即写回 20261020 P2 S2 拆分
const formTransferOutData = inject(transferOutFormDataKey)!;
</script>

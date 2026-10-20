<template>
  <!-- 墓位备注形态字段（唯一可编辑字段备注，30 字上限）：从 gravePlotBusiness/index.vue 拆出的子视图（20261020 P2 S2 巨石拆分第五批）。
       仅渲染整行字段列（t-col span=12，直挂父页共享 t-row），数据经 inject 共享页面 formRemarkData（保存写 room.remark、返回仍读页面同一份数据，
       逻辑不变）；输入框宽度覆盖 remark-fullrow-input 仍留父页 .form-basic-container :deep（穿透深层元素照常命中），故本组件无 scoped 样式；
       字数/占位与原内联完全一致。 -->
  <t-col :span="12">
    <t-form-item :label="$t('pages.gravePlotBusiness.remark')" name="remark">
      <t-input
        v-model="formRemarkData.remark"
        class="remark-fullrow-input"
        :maxcharacter="30"
        show-limit-number
        :placeholder="$t('pages.gravePlotBusiness.remarkPlaceholder')"
      />
    </t-form-item>
  </t-col>
</template>
<script lang="ts">
export default {
  name: 'RemarkFormView',
};
</script>
<script setup lang="ts">
import { inject } from 'vue';

import { remarkFormDataKey } from '../constants';

// 备注表单数据：由父页 provide 的 Ref（页面持有，保存/返回读同一份），模板自动解包后 v-model 编辑即写回 20261020 P2 S2 拆分
const formRemarkData = inject(remarkFormDataKey)!;
</script>

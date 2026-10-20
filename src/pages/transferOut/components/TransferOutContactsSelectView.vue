<template>
  <!-- 联系人选择页（迁出登记表单联系人字段“选择”按钮进入，原页 isContactsSelectShow 分支）：从 transferOut/index.vue 拆出的页内子视图（20261020 P2 S2 巨石拆分批三）。
       纯展示 + 事件上抛：只读墓位信息行（7 列，price 经 formatPrice）+ 该墓位活动联系人列表；选中/返回逻辑留父页（onSelectContact / handleCloseContactsSelect），经 emit 回抛；
       宿主 t-form 数据模型经 formData prop 传入仅保持原表单上下文。样式随模板迁入本组件 scoped（引表单结构 mixin 子库而非全量业务库）：
       .form-basic-container/.info-block 结构 + .des span 文字色（跨组件 data-v 失配修复）+ .transferOut-record-table 竖格线，类名与原页一致以复刻视觉。 -->
  <div>
    <t-form class="base-form" :data="formData" label-align="top" :label-width="100">
      <div class="form-basic-container">
        <div class="form-basic-item">
          <div class="form-basic-container-title">
            {{ $t('pages.transferOut.selectContactTitle') }}
            <t-button class="cms-back-btn" style="float: right" theme="default" variant="text" @click="emit('back')">
              {{ $t('operate.backDetail') }}
              <rollback-icon size="16px" />
            </t-button>
          </div>

          <t-row class="info-block des" :gutter="[62, 5]">
            <t-col :span="6">
              <span>{{ $t('pages.room.park') }} : {{ room.park }}</span>
            </t-col>
            <t-col :span="6">
              <span>{{ $t('pages.room.xyNumber') }} : {{ room.xyNumber }}</span>
            </t-col>
            <t-col :span="6">
              <span>{{ $t('pages.room.roomType') }} : {{ t(room.roomType) }}</span>
            </t-col>
            <t-col :span="6">
              <span>{{ $t('pages.room.specs') }} : {{ room.specs }}</span>
            </t-col>
            <t-col :span="6">
              <span>{{ $t('pages.room.price') }} : {{ formatPrice(room.price) }}</span>
            </t-col>
            <t-col :span="6">
              <span>{{ $t('pages.room.saleStatus') }} : {{ t(room.saleStatus) }}</span>
            </t-col>
            <t-col :span="12">
              <span>{{ $t('pages.room.intoStatus') }} : {{ t(room.intoStatus) }}</span>
            </t-col>

            <!-- 该墓位活动联系人列表，操作列逐行“选择”按钮，点击回填迁出登记表单并返回 20261005 新增 -->
            <t-col :span="12">
              <t-form-item name="idContacts">
                <t-table
                  class="transferOut-record-table"
                  :data="records"
                  :columns="columns"
                  row-key="idContacts"
                  :bordered="true"
                  size="small"
                  :max-height="240"
                >
                  <template #op="{ row }">
                    <t-link theme="primary" @click="emit('select', row)">
                      {{ $t('pages.transferOut.select') }}
                    </t-link>
                  </template>
                </t-table>
              </t-form-item>
            </t-col>
          </t-row>
        </div>
      </div>
    </t-form>
  </div>
</template>
<script lang="ts">
export default {
  name: 'TransferOutContactsSelectView',
};
</script>
<script setup lang="ts">
import { RollbackIcon } from 'tdesign-icons-vue-next';
import type { PrimaryTableCol } from 'tdesign-vue-next';

import type { ContactsModel } from '@/api/model/contactsModel';
import { t } from '@/locales';
import { formatPrice } from '@/utils/format';

import type { INITIAL_ROOM_DATA } from '../constants';

// 联系人选择视图子组件：墓位信息与联系人列表由父页传入，选中/返回经事件回抛父页处理 20261020 P2 S2 拆分
defineProps<{
  // 当前墓位信息（父页 formRoomData，只读展示）
  room: typeof INITIAL_ROOM_DATA;
  // 该墓位活动联系人记录列表（父页 contactsRecords）
  records: ContactsModel[];
  // 联系人列表列定义（父页 contactsColumns）
  columns: PrimaryTableCol[];
  // 宿主 t-form 数据模型（父页 formTransferOutData，本视图无输入项、仅保持原表单上下文）
  formData?: Record<string, any>;
}>();

const emit = defineEmits<{
  (e: 'select', row: ContactsModel): void;
  (e: 'back'): void;
}>();
</script>
<style lang="less" scoped>
// 只引表单结构 mixin 子库（非全量业务库）：避开与本视图无关的裸类规则被复制成作用域内死规则 20261020
@import '../../../style/business/form-page-mixins.less';

// 表单容器：与登记表单同款紧凑骨架
.form-basic-container {
  .cms-form-basic-compact();
}

// 只读墓位信息行（两列布局）
.info-block {
  .cms-info-block();
}

// 只读信息行文字颜色：业务库 .des 裸类同规则，本视图独用时就近声明（跨组件 data-v 失配修复）
.des {
  span {
    color: var(--td-text-color-secondary);
  }
}

// 联系人记录表：外框 + 竖格线（页 index.less 同款）
.transferOut-record-table {
  .cms-record-table-vertical();
}
</style>

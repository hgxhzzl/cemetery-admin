<template>
  <!-- 联系人选择视图：从墓位业务页 index.vue 整块拆出（20261020 P2 结构梳理第 5 项），
       模板结构与类名和原页面完全一致，选择/返回逻辑留父页处理，本组件纯展示 + 事件上抛。
       由下葬形态联系人字段「选择」按钮进入，操作列逐行选中回填联系人三字段并返回下葬表单。 -->
  <div>
    <t-form class="base-form" :data="formData" label-align="top" :label-width="100">
      <div class="form-basic-container">
        <div class="form-basic-item">
          <div class="form-basic-container-title">
            {{ $t('pages.gravePlotBusiness.selectContactTitle') }}
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
              <!-- 去掉排号/序号，原排号位置改为显示编号xyNumber 20260901 修改 -->
              <span>{{ $t('pages.room.xyNumber') }} : {{ room.xyNumber }}</span>
            </t-col>
            <t-col :span="6">
              <span>{{ $t('pages.room.roomType') }} : {{ t(room.roomType) }}</span>
            </t-col>
            <t-col :span="6">
              <span>{{ $t('pages.room.specs') }} : {{ room.specs }}</span>
            </t-col>
            <t-col :span="6">
              <!-- priceString 列已删，墓位价格由数值 price 千分位格式化 20260910 修改 -->
              <span>{{ $t('pages.room.price') }} : {{ formatPrice(room.price) }}</span>
            </t-col>
            <t-col :span="6">
              <span>{{ $t('pages.room.saleStatus') }} : {{ t(room.saleStatus) }}</span>
            </t-col>
            <t-col :span="12">
              <span>{{ $t('pages.room.intoStatus') }} : {{ t(room.intoStatus) }}</span>
            </t-col>

            <!-- 该墓位活动联系人列表，操作列逐行「选择」按钮，点击回填下葬表单并返回 20260923 新增 -->
            <t-col :span="12">
              <t-form-item name="idContacts">
                <t-table
                  class="buried-record-table"
                  :data="records"
                  :columns="columns"
                  row-key="idContacts"
                  :bordered="true"
                  size="small"
                  :max-height="240"
                >
                  <template #op="{ row }">
                    <t-link theme="primary" @click="emit('select', row)">
                      {{ $t('pages.gravePlotBusiness.select') }}
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
  name: 'ContactsSelectView',
};
</script>
<script setup lang="ts">
import { RollbackIcon } from 'tdesign-icons-vue-next';
import type { PrimaryTableCol } from 'tdesign-vue-next';

import type { GravePlotBusinessContactsModel } from '@/api/gravePlotBusiness';
import { t } from '@/locales';
import { formatPrice } from '@/utils/format';

import type { INITIAL_ROOM_DATA } from '../constants';

// 联系人选择视图子组件：整块独立视图（原页 isContactsSelectShow 分支）拆出，
// 墓位信息与联系人列表由父页传入，选中/返回经事件回抛父页处理 20261020 拆分
type RoomFormData = typeof INITIAL_ROOM_DATA;

defineProps<{
  // 当前墓位信息（父页 formRoomData，只读展示）
  room: RoomFormData;
  // 该墓位活动联系人记录列表（父页 contactsRecords）
  records: GravePlotBusinessContactsModel[];
  // 联系人列表列定义（父页 contactsColumns）
  columns: PrimaryTableCol[];
  // 宿主 t-form 的数据模型（父页 formBusinessData，本视图无输入项、仅保持原表单上下文）
  formData?: Record<string, any>;
}>();

const emit = defineEmits<{
  (e: 'select', row: GravePlotBusinessContactsModel): void;
  (e: 'back'): void;
}>();
</script>
<style lang="less" scoped>
// 联系人选择视图样式：原位于页面 index.less，随模板迁入本组件 scoped 块（20261020 P2 #5 拆分）。
// 只引表单结构 mixin 子库而非全量业务库：避开与本视图无关的裸类规则（.list-common-table/.detail-base 等）
// 被复制成作用域内死规则；类名与原页面保持一致以复刻原视觉。
@import '../../../style/business/form-page-mixins.less';

// 表单容器：与业务登记表单同款紧凑骨架。页 index.less 对本类的其余 :deep 覆盖仅作用于登记表单专属
// 输入框类（contacts-inline-input/cert-*/remark-*），本视图无这些元素，故不随迁
.form-basic-container {
  .cms-form-basic-compact();
}

// 只读墓位信息行（两列布局）
.info-block {
  .cms-info-block();
}

// 只读信息行文字颜色：业务库 .des 裸类同规则，本视图独用时就近声明（不引全量库）20261020
.des {
  span {
    color: var(--td-text-color-secondary);
  }
}

// 联系人记录表：外框 + 竖格线 + 行高 6px（页 index.less 同款；--burial 变体与 .record-op-links 本视图未用，不随迁）
.buried-record-table {
  .cms-record-table-vertical();

  :deep(td) {
    padding-top: 6px;
    padding-bottom: 6px;
  }
}
</style>

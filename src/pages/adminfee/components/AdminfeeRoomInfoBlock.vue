<template>
  <!-- 管理费收款登记表单的只读墓位信息行（park/xyNumber/roomType/specs/price/saleStatus/intoStatus + 起止日期）：
       从 adminfee/index.vue 拆出的页内子视图（20261020 P2 S2 巨石拆分批二）。纯展示：数据经 props 传入页面 formRoomData，
       各列均无条件展示（本页信息行不随模式增减，与墓位业务页不同；price 按本页原口径直出数值、起止日期经 formatDate）。
       列根为多个 t-col 片段，直挂父页保留的 <t-row class="info-block des">（column-count 布局随父 row 生效）；
       文字色 .des span 原为父页 scoped 规则（编译 .des span[data-v-页]），元素迁入本组件带子 data-v 后父规则不再命中，
       故就近补同款 scoped .des span 色（后代选择器只给末位 span 加子 data-v，.des 祖先仍是父 row，照常命中）20261020 审查。 -->
  <t-col :span="6">
    <span>{{ $t('pages.room.park') }} : {{ roomData.park }}</span>
  </t-col>
  <t-col :span="6">
    <span>{{ $t('pages.room.xyNumber') }} : {{ roomData.xyNumber }}</span>
  </t-col>
  <t-col :span="6">
    <span>{{ $t('pages.room.roomType') }} : {{ t(roomData.roomType) }}</span>
  </t-col>
  <t-col :span="6">
    <span>{{ $t('pages.room.specs') }} : {{ roomData.specs }}</span>
  </t-col>
  <t-col :span="6">
    <span>{{ $t('pages.room.price') }} : {{ roomData.price }}</span>
  </t-col>
  <t-col :span="6">
    <span>{{ $t('pages.room.saleStatus') }} : {{ t(roomData.saleStatus) }}</span>
  </t-col>
  <t-col :span="6">
    <span>{{ $t('pages.room.intoStatus') }} : {{ t(roomData.intoStatus) }}</span>
  </t-col>
  <!-- 管理费起止日期：room 库列（后端在下葬/收款事务中维护），仅展示不录入；
       末项结束日期独占整行凑偶数布局 20260910 新增 -->
  <t-col :span="6">
    <span>{{ $t('pages.adminfee.startDate') }} : {{ formatDate(roomData.startDate) }}</span>
  </t-col>
  <t-col :span="12">
    <span>{{ $t('pages.adminfee.endDate') }} : {{ formatDate(roomData.endDate) }}</span>
  </t-col>
</template>
<script lang="ts">
export default {
  name: 'AdminfeeRoomInfoBlock',
};
</script>
<script setup lang="ts">
import { t } from '@/locales';
import { formatDate } from '@/utils/date';

import type { INITIAL_ROOM_DATA } from '../constants';

// 只读信息行数据：由父页传入的 formRoomData（本页持有，仅展示），price 直出、起止日期经 formatDate
defineProps<{
  roomData: typeof INITIAL_ROOM_DATA;
}>();
</script>
<style lang="less" scoped>
// 只读信息行文字颜色：就近声明（口径同父页 scoped .des span，规避跨组件 data-v 失配）
.des {
  span {
    color: var(--td-text-color-secondary);
  }
}
</style>

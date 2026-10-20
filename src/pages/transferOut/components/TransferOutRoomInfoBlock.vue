<template>
  <!-- 迁出登记页只读信息行（park/xyNumber/roomType/specs/price/saleStatus/transferOutStatus/intoStatus）：从 transferOut/index.vue 拆出的页内子视图（20261020 P2 S2 巨石拆分批二）。
       纯展示：数据经 props 传入页面 formRoomData；price 经 formatPrice 千分位、状态经 t() 翻译、迁出状态为 NULL（存量）时兑底为“未迁出”（NOT_OUT）；
       下葬状态独占整行(span=12)以让新建页首项另起一行（口径原样保留）。列根为多个 t-col 片段，直挂父页保留的 <t-row class="info-block des">（column-count 随父 row 生效）；
       文字色 .des span 原为父页 scoped（编译 .des span[data-v-页]），元素迁入本组件带子 data-v 后父规则失配，故就近补同款 scoped .des span 色 20261020 审查。 -->
  <t-col :span="6">
    <span>{{ $t('pages.room.park') }} : {{ roomData.park }}</span>
  </t-col>
  <!-- 去掉排号/序号，原排号位置改为显示编号xyNumber -->
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
    <span>{{ $t('pages.room.price') }} : {{ formatPrice(roomData.price) }}</span>
  </t-col>
  <t-col :span="6">
    <span>{{ $t('pages.room.saleStatus') }} : {{ t(roomData.saleStatus) }}</span>
  </t-col>
  <!-- 迁出状态：存量墓位该字段为 NULL，展示时兑底为“未迁出” 20260916 新增 -->
  <t-col :span="6">
    <span>{{ $t('pages.room.transferOutStatus') }} : {{ t(roomData.transferOutStatus || NOT_OUT) }}</span>
  </t-col>
  <!-- 下葬状态独占整行：强制新建页表单首项（迁出日期）另起一行排在其正下方 -->
  <t-col :span="12">
    <span>{{ $t('pages.room.intoStatus') }} : {{ t(roomData.intoStatus) }}</span>
  </t-col>
</template>
<script lang="ts">
export default {
  name: 'TransferOutRoomInfoBlock',
};
</script>
<script setup lang="ts">
import { t } from '@/locales';
import { formatPrice } from '@/utils/format';

import type { INITIAL_ROOM_DATA } from '../constants';
import { NOT_OUT } from '../constants';

// 只读信息行数据：由父页传入的 formRoomData（本页持有，仅展示），price 经 formatPrice、状态经 t() 翻译
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

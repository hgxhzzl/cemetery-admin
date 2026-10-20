<template>
  <!-- 只读墓位信息块（区域/园区/编号/墓型/规格/价格/预定状态/销售状态/下葬状态）：从 gravePlotBusiness/index.vue
       拆出的子视图（20261020 P2 S2 巨石拆分第四批）。纯展示，数据由父页以 props 传入（formRoomData/formMode）；
       本组件列（多个 t-col 片段）直挂父页保留的共享 t-row.info-block.des，文字颜色仍由全局裸类 .des span 命中（不随迁移丢失）。
       各列按 formMode 的条件与原内联完全一致。 -->
  <t-col v-if="formMode !== 'reserve' && formMode !== 'buried'" :span="6">
    <span>{{ $t('pages.room.region') }} : {{ roomData.region }}</span>
  </t-col>
  <t-col :span="6">
    <span>{{ $t('pages.room.park') }} : {{ roomData.park }}</span>
  </t-col>
  <!-- 编号（xyNumber）：各形态均在园区行右侧展示（含下葬形态，同下葬页修改页布局）20260923 修改 -->
  <t-col :span="6">
    <!-- 去掉排号/序号，原排号位置改为显示编号xyNumber 20260901 修改 -->
    <span>{{ $t('pages.room.xyNumber') }} : {{ roomData.xyNumber }}</span>
  </t-col>
  <t-col :span="6">
    <span>{{ $t('pages.room.roomType') }} : {{ t(roomData.roomType) }}</span>
  </t-col>
  <!-- 规格：联系人（业务登记）与备注形态不展示（与价格同步移除）20260924 修改 20261002 修改 -->
  <t-col v-if="formMode !== 'business' && formMode !== 'remark'" :span="6">
    <span>{{ $t('pages.room.specs') }} : {{ roomData.specs }}</span>
  </t-col>
  <!-- 价格：下葬形态与联系人（业务登记）/备注形态不展示（精简为无销售信息的纯登记信息页）20260923 修改 20260924 修改 20261002 修改 -->
  <t-col v-if="formMode !== 'buried' && formMode !== 'business' && formMode !== 'remark'" :span="6">
    <!-- priceString 列已删，墓位价格由数值 price 千分位格式化 20260910 修改 -->
    <span>{{ $t('pages.room.price') }} : {{ formatPrice(roomData.price) }}</span>
  </t-col>
  <!-- 预定形态展示预定状态（同墓位预定页），其他形态不展示 20260923 新增 -->
  <t-col v-if="formMode === 'reserve'" :span="6">
    <span>{{ $t('pages.room.reserveStatus') }} : {{ t(roomData.reserveStatus) }}</span>
  </t-col>
  <t-col :span="6">
    <span>{{ $t('pages.room.saleStatus') }} : {{ t(roomData.saleStatus) }}</span>
  </t-col>
  <!-- 下葬状态：各形态统一半宽，与销售状态同行（下葬形态上移至销售状态右侧）20260923 修改 -->
  <t-col :span="6">
    <span>{{ $t('pages.room.intoStatus') }} : {{ t(roomData.intoStatus) }}</span>
  </t-col>
</template>
<script lang="ts">
export default {
  name: 'RoomInfoBlock',
};
</script>
<script setup lang="ts">
import { t } from '@/locales';
import { formatPrice } from '@/utils/format';

import type { BusinessFormMode, INITIAL_ROOM_DATA } from '../constants';

// roomData：当前墓位只读信息（父页 formRoomData 传入）；formMode：决定区域/规格/价格/预定状态等列的显隐口径 20261020 P2 S2 拆分
defineProps<{ roomData: typeof INITIAL_ROOM_DATA; formMode: BusinessFormMode }>();
</script>
<style lang="less" scoped>
// 只读信息行文字颜色：页面 index.less 为 scoped 引入，.des span 编译为 .des span[data-v-页面]；
// 本视图 span 迁入后带子组件 data-v、不再命中父页规则，故就近独用声明同款色值（.des 祖先仍为父页 t-row，
// 后代选择器仅末位 span 带 data-v，照常命中）20261020 P2 S2 拆分
.des {
  span {
    color: var(--td-text-color-secondary);
  }
}
</style>

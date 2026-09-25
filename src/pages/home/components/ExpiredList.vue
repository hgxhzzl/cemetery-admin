<template>
  <t-row :gutter="16" class="row-container">
    <!-- 管理到期记录：样式与销售记录（RankList）一致，分区域两张卡，无日期选项；固定 span 不设响应式断点，窄视口不窜行 20260925 新增 -->
    <t-col class="dashboard-col" :span="6">
      <t-card :title="firstCardTitle" class="dashboard-expired-card" :bordered="false">
        <t-table
          :data="firstTendData"
          :columns="EXPIRED_COLUMNS"
          row-key="idRoom"
          size="small"
          :max-height="288"
          table-layout="fixed"
        >
          <template #index="{ rowIndex }">
            <span :class="getRankClass(rowIndex)">
              {{ rowIndex + 1 }}
            </span>
          </template>
        </t-table>
      </t-card>
    </t-col>
    <t-col class="dashboard-col" :span="6">
      <t-card :title="secondCardTitle" class="dashboard-expired-card" :bordered="false">
        <t-table
          :data="secondTendData"
          :columns="EXPIRED_COLUMNS"
          row-key="idRoom"
          size="small"
          :max-height="288"
          table-layout="fixed"
        >
          <template #index="{ rowIndex }">
            <span :class="getRankClass(rowIndex)">
              {{ rowIndex + 1 }}
            </span>
          </template>
        </t-table>
      </t-card>
    </t-col>
  </t-row>
</template>
<script setup lang="ts">
import type { TdBaseTableProps } from 'tdesign-vue-next';
import { computed } from 'vue';

import type { DashboardRegionModel, ExpiredRoomModel } from '@/api/dashboard';
import { t } from '@/locales';

defineOptions({
  name: 'DashboardExpiredList',
});

const props = defineProps<{
  regions?: DashboardRegionModel[];
  expiredRooms?: ExpiredRoomModel[];
}>();

// 管理到期明细行：按区域过滤（后端已按到期日期升序，最先到期在前），园区名称+编号拼一列 20260925 新增
const toRegionRows = (region: string | undefined) => {
  if (!region) return [];
  return (props.expiredRooms ?? [])
    .filter((item) => item.region === region)
    .map((item) => ({
      ...item,
      parkNumber: `${item.park ?? ''}${item.xyNumber ?? ''}`,
    }));
};

const firstTendData = computed(() => toRegionRows(props.regions?.[0]?.label));

const secondTendData = computed(() => toRegionRows(props.regions?.[1]?.label));

// 卡片标题：区域名称 + 管理到期记录（如「九泉山管理到期记录」），无区域时回退默认标题 20260925 新增
const firstCardTitle = computed(() => {
  const region = props.regions?.[0]?.label;
  return region ? `${region}${t('pages.dashboardBase.expiredList.title')}` : t('pages.dashboardBase.expiredList.title');
});

const secondCardTitle = computed(() => {
  const region = props.regions?.[1]?.label;
  return region ? `${region}${t('pages.dashboardBase.expiredList.title')}` : t('pages.dashboardBase.expiredList.title');
});

// 列：序号/园区名称+编号/到期日期/联系人（列宽总和 480，远小于最小列宽，不触发表内滚动）20260925 新增
const EXPIRED_COLUMNS = computed<TdBaseTableProps['columns']>(() => [
  {
    align: 'center',
    colKey: 'index',
    title: t('pages.dashboardBase.expiredColumns.index'),
    width: 60,
    fixed: 'left',
  },
  {
    align: 'left',
    ellipsis: true,
    colKey: 'parkNumber',
    title: t('pages.dashboardBase.expiredColumns.parkNumber'),
    width: 190,
  },
  {
    align: 'center',
    colKey: 'endDate',
    title: t('pages.dashboardBase.expiredColumns.endDate'),
    width: 110,
  },
  {
    align: 'left',
    ellipsis: true,
    colKey: 'contacts',
    title: t('pages.dashboardBase.expiredColumns.contacts'),
    width: 120,
  },
]);

const getRankClass = (index: number) => {
  return ['dashboard-rank', { 'dashboard-rank__top': index < 3 }];
};
</script>
<style lang="less" scoped>
// 卡片 100% 高度需要 t-col 建立高度链 20260925 新增
.dashboard-col {
  height: 100%;
}

// 卡片结构与销售记录（dashboard-rank-card）一致，无头部右侧日期切换 20260925 新增
.dashboard-expired-card {
  height: 100%;
  display: flex;
  flex-direction: column;
  // 固定高度内收紧卡片 padding 与标题间距，给 5 行表格留足空间 20260925 新增
  padding: var(--td-comp-paddingTB-l) var(--td-comp-paddingLR-xl);

  :deep(.t-card__header) {
    flex: none;
    padding: 0;
  }

  // TDesign Card 的 body 外层还包着 Loading 组件渲染的 div.t-loading__parent，
  // 该包装默认不是 flex 容器，会阻断高度链，需让它占满剩余空间并成为 flex 容器 20260925 新增
  :deep(.t-loading__parent) {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
  }

  :deep(.t-card__title) {
    font: var(--td-font-title-large);
    font-weight: 400;
  }

  :deep(.t-card__body) {
    flex: 1;
    min-height: 0;
    overflow: hidden;
    padding: 0;
    margin-top: var(--td-comp-margin-l);
  }
}

.dashboard-rank__cell {
  display: inline-flex;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  color: white;
  font-size: 14px;
  background-color: var(--td-gray-color-5);
  align-items: center;
  justify-content: center;
  font-weight: 700;

  &--top {
    background: var(--td-brand-color);
  }
}
</style>

<template>
  <t-row :gutter="16" class="row-container">
    <t-col class="dashboard-col" :span="6">
      <t-card :title="saleCardTitle" class="dashboard-rank-card" :bordered="false">
        <template #actions>
          <!-- 今天/昨天切换：默认今天，点击分段控件切换对应日期明细 20260921 新增 -->
          <t-radio-group v-model="saleRange" variant="default-filled" size="small">
            <t-radio-button value="today">{{ t('pages.dashboardBase.rankList.today') }}</t-radio-button>
            <t-radio-button value="yesterday">{{ t('pages.dashboardBase.rankList.yesterday') }}</t-radio-button>
          </t-radio-group>
        </template>
        <t-table
          :data="saleTendData"
          :columns="WEEK_COLUMNS"
          row-key="idSale"
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
      <t-card :title="buyCardTitle" class="dashboard-rank-card" :bordered="false">
        <template #actions>
          <!-- 今天/昨天切换：默认今天，点击分段控件切换对应日期明细 20260921 新增 -->
          <t-radio-group v-model="buyRange" variant="default-filled" size="small">
            <t-radio-button value="today">{{ t('pages.dashboardBase.rankList.today') }}</t-radio-button>
            <t-radio-button value="yesterday">{{ t('pages.dashboardBase.rankList.yesterday') }}</t-radio-button>
          </t-radio-group>
        </template>
        <t-table
          :data="buyTendData"
          :columns="WEEK_COLUMNS"
          row-key="idSale"
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
import dayjs from 'dayjs';
import type { TdBaseTableProps } from 'tdesign-vue-next';
import { computed, ref } from 'vue';

import type { DashboardRegionModel, WeeklySaleModel } from '@/api/dashboard';
import { t } from '@/locales';
import { formatPrice } from '@/utils/format';

const props = defineProps<{
  regions?: DashboardRegionModel[];
  weeklySales?: WeeklySaleModel[];
}>();

// 今天与昨天日期串：后端 createDate 为 %Y-%m-%d 字符串，直接相等过滤 20260921 新增
const todayStr = dayjs().format('YYYY-MM-DD');
const yesterdayStr = dayjs().subtract(1, 'day').format('YYYY-MM-DD');

// 两个卡片各自独立的今天/昨天选择，默认今天 20260921 新增
const saleRange = ref<'today' | 'yesterday'>('today');
const buyRange = ref<'today' | 'yesterday'>('today');

// 销售记录明细行：按区域与所选日期（今天/昨天）过滤（后端已按日期倒序），园区名称+编号拼一列、金额千分位 20260915 修改 20260921 改今天/昨天切换
const toRangeRows = (region: string | undefined, range: 'today' | 'yesterday') => {
  if (!region) return [];
  const targetDate = range === 'today' ? todayStr : yesterdayStr;
  return (props.weeklySales ?? [])
    .filter((item) => item.region === region && item.createDate === targetDate)
    .map((item) => ({
      ...item,
      parkNumber: `${item.park ?? ''}${item.xyNumber ?? ''}`,
      realPrice: `¥ ${formatPrice(Number(item.realPrice) || 0)}`,
    }));
};

const saleTendData = computed(() => toRangeRows(props.regions?.[0]?.label, saleRange.value));

const buyTendData = computed(() => toRangeRows(props.regions?.[1]?.label, buyRange.value));

// 卡片标题：区域名称 + 销售记录（如「九泉山销售记录」），无区域时回退默认标题
const saleCardTitle = computed(() => {
  const region = props.regions?.[0]?.label;
  return region ? `${region}${t('pages.dashboardBase.rankList.title')}` : t('pages.dashboardBase.rankList.title');
});

const buyCardTitle = computed(() => {
  const region = props.regions?.[1]?.label;
  return region ? `${region}${t('pages.dashboardBase.rankList.title')}` : t('pages.dashboardBase.rankList.title');
});

const WEEK_COLUMNS = computed<TdBaseTableProps['columns']>(() => [
  {
    align: 'center',
    colKey: 'index',
    title: t('pages.dashboardBase.weekColumns.index'),
    width: 60,
    fixed: 'left',
  },
  {
    align: 'left',
    ellipsis: true,
    colKey: 'parkNumber',
    title: t('pages.dashboardBase.weekColumns.parkNumber'),
    width: 170,
  },
  {
    align: 'right',
    colKey: 'realPrice',
    title: t('pages.dashboardBase.weekColumns.realPrice'),
    width: 110,
  },
  {
    align: 'left',
    ellipsis: true,
    colKey: 'payer',
    title: t('pages.dashboardBase.weekColumns.payer'),
    width: 100,
  },
  {
    align: 'center',
    colKey: 'createDate',
    title: t('pages.dashboardBase.weekColumns.date'),
    width: 110,
  },
]);

const getRankClass = (index: number) => {
  return ['dashboard-rank', { 'dashboard-rank__top': index < 3 }];
};
</script>
<style lang="less" scoped>
// 卡片 100% 高度需要 t-col 建立高度链 20260915 新增
.dashboard-col {
  height: 100%;
}

.dashboard-rank-card {
  height: 100%;
  display: flex;
  flex-direction: column;
  // 第三行固定高度内收紧卡片 padding 与标题间距，给 5 行表格留足空间 20260915 修改
  padding: var(--td-comp-paddingTB-l) var(--td-comp-paddingLR-xl);

  :deep(.t-card__header) {
    flex: none;
    padding: 0;
  }

  // TDesign Card 的 body 外层还包着 Loading 组件渲染的 div.t-loading__parent，
  // 该包装默认不是 flex 容器，会阻断高度链，需让它占满剩余空间并成为 flex 容器 20260915 修复
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

  // 卡片头部右侧「今天/昨天」选择项：小尺寸分段控件 20260921 新增
  :deep(.t-radio-group) {
    font-size: var(--td-font-size-body-small);
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

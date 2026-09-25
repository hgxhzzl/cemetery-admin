<template>
  <t-row :gutter="16" class="row-container">
    <!-- 下葬记录：样式与销售记录（RankList）一致，分区域两张卡；固定 span 不设响应式断点，窄视口不窜行 20260925 新增 -->
    <t-col class="dashboard-col" :span="6">
      <t-card :title="firstCardTitle" class="dashboard-buried-card" :bordered="false">
        <template #actions>
          <!-- 今天/明天切换：默认今天，点击分段控件切换对应日期下葬明细 20260925 新增 -->
          <t-radio-group v-model="firstRange" variant="default-filled" size="small">
            <t-radio-button value="today">{{ t('pages.dashboardBase.buriedList.today') }}</t-radio-button>
            <t-radio-button value="tomorrow">{{ t('pages.dashboardBase.buriedList.tomorrow') }}</t-radio-button>
          </t-radio-group>
        </template>
        <t-table
          :data="firstTendData"
          :columns="BURIED_COLUMNS"
          row-key="idBuried"
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
      <t-card :title="secondCardTitle" class="dashboard-buried-card" :bordered="false">
        <template #actions>
          <!-- 今天/明天切换：默认今天，与左卡各自独立 20260925 新增 -->
          <t-radio-group v-model="secondRange" variant="default-filled" size="small">
            <t-radio-button value="today">{{ t('pages.dashboardBase.buriedList.today') }}</t-radio-button>
            <t-radio-button value="tomorrow">{{ t('pages.dashboardBase.buriedList.tomorrow') }}</t-radio-button>
          </t-radio-group>
        </template>
        <t-table
          :data="secondTendData"
          :columns="BURIED_COLUMNS"
          row-key="idBuried"
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

import type { BuriedRecordModel, DashboardRegionModel } from '@/api/dashboard';
import { t } from '@/locales';

defineOptions({
  name: 'DashboardBuriedList',
});

const props = defineProps<{
  regions?: DashboardRegionModel[];
  buriedRecords?: BuriedRecordModel[];
}>();

// 今天与明天日期串：后端 burialDate 为 %Y-%m-%d 字符串，直接相等过滤 20260925 新增
const todayStr = dayjs().format('YYYY-MM-DD');
const tomorrowStr = dayjs().add(1, 'day').format('YYYY-MM-DD');

// 两个卡片各自独立的今天/明天选择，默认今天 20260925 新增
const firstRange = ref<'today' | 'tomorrow'>('today');
const secondRange = ref<'today' | 'tomorrow'>('today');

// 下葬记录明细行：按区域与所选日期（今天/明天）过滤（后端已按日期升序），园区名称+编号拼一列 20260925 新增
const toRangeRows = (region: string | undefined, range: 'today' | 'tomorrow') => {
  if (!region) return [];
  const targetDate = range === 'today' ? todayStr : tomorrowStr;
  return (props.buriedRecords ?? [])
    .filter((item) => item.region === region && item.burialDate === targetDate)
    .map((item) => ({
      ...item,
      parkNumber: `${item.park ?? ''}${item.xyNumber ?? ''}`,
    }));
};

const firstTendData = computed(() => toRangeRows(props.regions?.[0]?.label, firstRange.value));

const secondTendData = computed(() => toRangeRows(props.regions?.[1]?.label, secondRange.value));

// 卡片标题：区域名称 + 下葬记录（如「九泉山下葬记录」），无区域时回退默认标题 20260925 新增
const firstCardTitle = computed(() => {
  const region = props.regions?.[0]?.label;
  return region ? `${region}${t('pages.dashboardBase.buriedList.title')}` : t('pages.dashboardBase.buriedList.title');
});

const secondCardTitle = computed(() => {
  const region = props.regions?.[1]?.label;
  return region ? `${region}${t('pages.dashboardBase.buriedList.title')}` : t('pages.dashboardBase.buriedList.title');
});

// 列：序号/园区名称+编号/安葬者/联系人/联系人电话（列宽总和 570，与销售记录卡片 550 同量级，1320 最小内容宽下不触发表内滚动）20260925 新增
const BURIED_COLUMNS = computed<TdBaseTableProps['columns']>(() => [
  {
    align: 'center',
    colKey: 'index',
    title: t('pages.dashboardBase.buriedColumns.index'),
    width: 60,
    fixed: 'left',
  },
  {
    align: 'left',
    ellipsis: true,
    colKey: 'parkNumber',
    title: t('pages.dashboardBase.buriedColumns.parkNumber'),
    width: 170,
  },
  {
    align: 'left',
    ellipsis: true,
    colKey: 'deceased',
    title: t('pages.dashboardBase.buriedColumns.deceased'),
    width: 110,
  },
  {
    align: 'left',
    ellipsis: true,
    colKey: 'contacts',
    title: t('pages.dashboardBase.buriedColumns.contacts'),
    width: 105,
  },
  {
    align: 'center',
    colKey: 'contactsphone',
    title: t('pages.dashboardBase.buriedColumns.contactsphone'),
    width: 125,
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

// 卡片结构与销售记录（dashboard-rank-card）一致 20260925 新增
.dashboard-buried-card {
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

  // 卡片头部右侧「今天/明天」选择项：小尺寸分段控件 20260925 新增
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

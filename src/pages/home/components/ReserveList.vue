<template>
  <t-row :gutter="16" class="row-container">
    <!-- 预定记录：样式与管理到期记录一致，分区域两张卡；标题右侧显示记录条数，
         表格滚动到底自动加载下一页（每页 40 条，同管理到期/墓位销售查询的无限滚动方式）20261011 新增 -->
    <t-col class="dashboard-col" :span="6">
      <t-card :title="firstCardTitle" class="dashboard-reserve-card" :bordered="false">
        <!-- 标题靠右侧记录条数：接口返回 total，重载/翻页时刷新 20261011 新增 -->
        <template #actions>
          <span class="dashboard-reserve-count">
            {{ translate('operate.total') }}{{ firstPagination.total }}{{ translate('operate.records') }}
          </span>
        </template>
        <t-table
          ref="firstTableRef"
          :data="firstData"
          :columns="RESERVE_COLUMNS"
          row-key="idReserve"
          size="small"
          :max-height="250"
          table-layout="fixed"
          @scroll="firstHandleScroll"
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
      <t-card :title="secondCardTitle" class="dashboard-reserve-card" :bordered="false">
        <template #actions>
          <span class="dashboard-reserve-count">
            {{ translate('operate.total') }}{{ secondPagination.total }}{{ translate('operate.records') }}
          </span>
        </template>
        <t-table
          ref="secondTableRef"
          :data="secondData"
          :columns="RESERVE_COLUMNS"
          row-key="idReserve"
          size="small"
          :max-height="250"
          table-layout="fixed"
          @scroll="secondHandleScroll"
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
import { computed, ref, watch } from 'vue';

import type { DashboardRegionModel, ReserveRecordModel } from '@/api/dashboard';
import { getDashboardReserveList } from '@/api/dashboard';
import { useInfiniteScrollQuery } from '@/hooks';
import { t, translate } from '@/locales';

defineOptions({
  name: 'DashboardReserveList',
});

const props = defineProps<{
  regions?: DashboardRegionModel[];
}>();

// 表格行：接口字段 + 拼接列「园区名称+编号」（同管理到期卡片写法）20261011 新增
type ReserveRow = ReserveRecordModel & { parkNumber: string };

// 分页拉取工厂：按区域分页查询并拼接园区名称+编号列；
// 区域未就绪时返回空（total 0），待 regions 下发后由 watch 触发重置加载 20261011 新增
const makeFetchPage = (getRegion: () => string | undefined) => async (current: number, pageSize: number) => {
  const region = getRegion();
  if (!region) return { list: [] as ReserveRow[], total: 0 };
  const result = await getDashboardReserveList({ region, current, pageSize });
  return {
    total: result.total,
    list: result.list.map((item) => ({ ...item, parkNumber: `${item.park ?? ''}${item.xyNumber ?? ''}` })),
  };
};

// 两张卡各自独立的滚动加载状态机：复用公共 useInfiniteScrollQuery（同管理到期卡片）20261011 新增
const firstTableRef = ref();
const {
  data: firstData,
  pagination: firstPagination,
  onSubmit: firstOnSubmit,
  handleScroll: firstHandleScroll,
} = useInfiniteScrollQuery<ReserveRow>(
  makeFetchPage(() => props.regions?.[0]?.label),
  firstTableRef,
);

const secondTableRef = ref();
const {
  data: secondData,
  pagination: secondPagination,
  onSubmit: secondOnSubmit,
  handleScroll: secondHandleScroll,
} = useInfiniteScrollQuery<ReserveRow>(
  makeFetchPage(() => props.regions?.[1]?.label),
  secondTableRef,
);

// regions 随 summary 每次激活刷新下发（新数组引用）：首次就绪与每次切回首页均从第一页重载并滚动归零 20261011 新增
watch(
  () => props.regions,
  () => {
    if (props.regions?.[0]?.label) firstOnSubmit();
    if (props.regions?.[1]?.label) secondOnSubmit();
  },
  { immediate: true },
);

// 卡片标题：区域名称 + 预定记录（如「九泉山预定记录」），无区域时回退默认标题 20261011 新增
const firstCardTitle = computed(() => {
  const region = props.regions?.[0]?.label;
  return region ? `${region}${t('pages.dashboardBase.reserveList.title')}` : t('pages.dashboardBase.reserveList.title');
});

const secondCardTitle = computed(() => {
  const region = props.regions?.[1]?.label;
  return region ? `${region}${t('pages.dashboardBase.reserveList.title')}` : t('pages.dashboardBase.reserveList.title');
});

// 列：序号/园区名称+编号/预定限期/联系人/联系人电话（列宽总和 570，同下葬记录卡，1320 最小内容宽下不触发表内滚动）20261011 新增
const RESERVE_COLUMNS = computed<TdBaseTableProps['columns']>(() => [
  {
    align: 'center',
    colKey: 'index',
    title: t('pages.dashboardBase.reserveColumns.index'),
    width: 60,
    fixed: 'left',
  },
  {
    align: 'left',
    ellipsis: true,
    colKey: 'parkNumber',
    title: t('pages.dashboardBase.reserveColumns.parkNumber'),
    width: 170,
  },
  {
    align: 'center',
    colKey: 'reservationExpireDate',
    title: t('pages.dashboardBase.reserveColumns.reservationExpireDate'),
    width: 110,
  },
  {
    align: 'left',
    ellipsis: true,
    colKey: 'contacts',
    title: t('pages.dashboardBase.reserveColumns.contacts'),
    width: 105,
  },
  {
    align: 'center',
    colKey: 'contactsphone',
    title: t('pages.dashboardBase.reserveColumns.contactsphone'),
    width: 125,
  },
]);

const getRankClass = (index: number) => {
  return ['dashboard-rank', { 'dashboard-rank__top': index < 3 }];
};
</script>
<style lang="less" scoped>
// 列高不再给 100%：与管理到期卡同理，交叉尺寸会令父行的 align-items: stretch 失效，
// 同行两张记录数不同的卡不等高，现由行的 stretch 给列定高、卡内 height: 100% 解析到该高度 20261011 新增
.dashboard-col {
  height: auto;
}

// 卡片结构与管理到期卡（dashboard-expired-card）一致，头部右侧为记录条数 20261011 新增
.dashboard-reserve-card {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: var(--td-comp-paddingTB-l) var(--td-comp-paddingLR-xl);

  :deep(.t-card__header) {
    flex: none;
    padding: 0;
  }

  // TDesign Card 的 body 外层包着 Loading 渲染的 div.t-loading__parent，
  // 该包装默认不是 flex 容器，会阻断高度链，需让它占满剩余空间并成为 flex 容器 20261011 新增
  :deep(.t-loading__parent) {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
  }

  // 无记录时表格空状态不占额外空间，让行容器 min-height 自然兜底 20261011 新增
  :deep(.t-table__empty) {
    min-height: 0;
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

// 标题靠右侧记录条数：小字次要色，与卡片头部基线对齐 20261011 新增
.dashboard-reserve-count {
  font: var(--td-font-body-small);
  color: var(--td-text-color-secondary);
}
</style>

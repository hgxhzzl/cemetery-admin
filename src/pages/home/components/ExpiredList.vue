<template>
  <t-row :gutter="16" class="row-container">
    <!-- 管理到期记录：样式与销售记录（RankList）一致，分区域两张卡；标题右侧显示记录条数，
         表格滚动到底自动加载下一页（每页 40 条，同墓位销售查询无限滚动方式）20260925 新增 20260926 改分页加载 -->
    <t-col class="dashboard-col" :span="6">
      <t-card :title="firstCardTitle" class="dashboard-expired-card" :bordered="false">
        <!-- 标题靠右侧记录条数：接口返回 total，重载/翻页时刷新 20260926 新增 -->
        <template #actions>
          <span class="dashboard-expired-count">
            {{ translate('operate.total') }}{{ firstPagination.total }}{{ translate('operate.records') }}
          </span>
        </template>
        <t-table
          ref="firstTableRef"
          :data="firstData"
          :columns="EXPIRED_COLUMNS"
          row-key="idRoom"
          size="small"
          :max-height="288"
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
      <t-card :title="secondCardTitle" class="dashboard-expired-card" :bordered="false">
        <template #actions>
          <span class="dashboard-expired-count">
            {{ translate('operate.total') }}{{ secondPagination.total }}{{ translate('operate.records') }}
          </span>
        </template>
        <t-table
          ref="secondTableRef"
          :data="secondData"
          :columns="EXPIRED_COLUMNS"
          row-key="idRoom"
          size="small"
          :max-height="288"
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

import type { DashboardRegionModel, ExpiredRoomModel } from '@/api/dashboard';
import { getDashboardExpiredList } from '@/api/dashboard';
import { useInfiniteScrollQuery } from '@/hooks';
import { t, translate } from '@/locales';

defineOptions({
  name: 'DashboardExpiredList',
});

const props = defineProps<{
  regions?: DashboardRegionModel[];
}>();

// 表格行：接口字段 + 拼接列「园区名称+编号」20260926 新增
type ExpiredRow = ExpiredRoomModel & { parkNumber: string };

// 分页拉取工厂：按区域分页查询并拼接园区名称+编号列；
// 区域未就绪时返回空（total 0），待 regions 下发后由 watch 触发重置加载 20260926 新增
const makeFetchPage = (getRegion: () => string | undefined) => async (current: number, pageSize: number) => {
  const region = getRegion();
  if (!region) return { list: [] as ExpiredRow[], total: 0 };
  const result = await getDashboardExpiredList({ region, current, pageSize });
  return {
    total: result.total,
    list: result.list.map((item) => ({ ...item, parkNumber: `${item.park ?? ''}${item.xyNumber ?? ''}` })),
  };
};

// 两张卡各自独立的滚动加载状态机：收敛于公共 useInfiniteScrollQuery（同销售查询页）20260926 新增
const firstTableRef = ref();
const {
  data: firstData,
  pagination: firstPagination,
  onSubmit: firstOnSubmit,
  handleScroll: firstHandleScroll,
} = useInfiniteScrollQuery<ExpiredRow>(
  makeFetchPage(() => props.regions?.[0]?.label),
  firstTableRef,
);

const secondTableRef = ref();
const {
  data: secondData,
  pagination: secondPagination,
  onSubmit: secondOnSubmit,
  handleScroll: secondHandleScroll,
} = useInfiniteScrollQuery<ExpiredRow>(
  makeFetchPage(() => props.regions?.[1]?.label),
  secondTableRef,
);

// regions 随 summary 每次激活刷新下发（新数组引用）：首次就绪与每次切回首页均从第一页重载并滚动归零 20260926 新增
watch(
  () => props.regions,
  () => {
    if (props.regions?.[0]?.label) firstOnSubmit();
    if (props.regions?.[1]?.label) secondOnSubmit();
  },
  { immediate: true },
);

// 卡片标题：区域名称 + 管理到期记录（如「九泉山管理到期记录」），无区域时回退默认标题 20260925 新增
const firstCardTitle = computed(() => {
  const region = props.regions?.[0]?.label;
  return region ? `${region}${t('pages.dashboardBase.expiredList.title')}` : t('pages.dashboardBase.expiredList.title');
});

const secondCardTitle = computed(() => {
  const region = props.regions?.[1]?.label;
  return region ? `${region}${t('pages.dashboardBase.expiredList.title')}` : t('pages.dashboardBase.expiredList.title');
});

// 列：序号/园区名称+编号/到期日期/联系人（列宽总和 480，远小于最小列宽，不触发表内横向滚动）20260925 新增
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

// 卡片结构与销售记录（dashboard-rank-card）一致，头部右侧由日期切换改为记录条数 20260925 新增 20260926 修改
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

// 标题靠右侧记录条数：小字次要色，与卡片头部基线对齐 20260926 新增
.dashboard-expired-count {
  font: var(--td-font-body-small);
  color: var(--td-text-color-secondary);
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

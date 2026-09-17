<template>
  <t-row :gutter="[16, 16]">
    <!-- 响应式断点：窄屏（<992px）2 列，视口 ≥992px（md）时前两卡 4 格（金额长文案）后两卡 2 格（纯数字短文案）20260917 修改 -->
    <t-col v-for="(item, index) in PANE_LIST" :key="item.title" class="dashboard-col" :xs="6" :md="index < 2 ? 4 : 2">
      <t-card
        :title="t(item.title)"
        :bordered="false"
        class="dashboard-item"
        :class="{ 'dashboard-item--main-color': index === 0 }"
      >
        <div class="dashboard-item-top">
          <span>{{ item.number }}</span>
        </div>
        <!-- 按区域分解小字行：有几个区域就展示几行（如「九泉山：¥20,000」）20260915 新增 -->
        <div class="dashboard-item-regions">
          <div v-for="(regionText, regionIndex) in item.regionRows" :key="regionIndex" class="dashboard-item-region">
            {{ regionText }}
          </div>
        </div>
        <!-- 四张卡片统一右侧圆形图标：前两张迷你图替换为与后两张同款式图标 20260915 修改 -->
        <div class="dashboard-item-left">
          <span v-if="index === 0" :style="{ marginTop: `-24px` }">
            <money-icon />
          </span>
          <span v-else-if="index === 1" :style="{ marginTop: `-24px` }">
            <wallet-icon />
          </span>
          <span v-else-if="index === 2" :style="{ marginTop: `-24px` }">
            <usergroup-icon />
          </span>
          <span v-else :style="{ marginTop: '-24px' }">
            <file-icon />
          </span>
        </div>
      </t-card>
    </t-col>
  </t-row>
</template>
<script setup lang="ts">
import { FileIcon, MoneyIcon, UsergroupIcon, WalletIcon } from 'tdesign-icons-vue-next';
import { computed } from 'vue';

// 导入样式
import type { DashboardSummaryModel, RegionStatModel } from '@/api/dashboard';
import { t } from '@/locales';
import { formatPrice } from '@/utils/format';

defineOptions({
  name: 'DashboardBase',
});

const props = defineProps<{
  summary?: DashboardSummaryModel | null;
}>();

// 按区域分解小字行：以 regions（接口前两个区域）为基准，无数据的区域补 0，保证有几个区域就显示几行 20260915 新增
const toRegionRows = (rows: RegionStatModel[] | undefined, isAmount: boolean) => {
  const valueMap = new Map((rows ?? []).map((row) => [row.region, row.v]));
  return (props.summary?.regions ?? []).map((region) => {
    const value = valueMap.get(region.label) ?? 0;
    return isAmount ? `${region.label}：¥ ${formatPrice(value)}` : `${region.label}：${value}`;
  });
};

// 四张卡片文案与数值：金额千分位，接口未返回前显示 0 20260914 修改
// 每张卡片带区域分解小字行（有几个区域就有几行）：金额卡带 ¥ 千分位、数量卡纯数字 20260915 新增
const PANE_LIST = computed(() => [
  {
    title: 'pages.dashboardBase.topPanel.card1',
    number: `¥ ${formatPrice(props.summary?.yearSales ?? 0)}`,
    regionRows: toRegionRows(props.summary?.yearSalesByRegion, true),
  },
  {
    title: 'pages.dashboardBase.topPanel.card2',
    number: `¥ ${formatPrice(props.summary?.yearFees ?? 0)}`,
    regionRows: toRegionRows(props.summary?.yearFeesByRegion, true),
  },
  {
    title: 'pages.dashboardBase.topPanel.card3',
    number: String(props.summary?.yearBuriedCount ?? 0),
    regionRows: toRegionRows(props.summary?.yearBuriedCountByRegion, false),
  },
  {
    title: 'pages.dashboardBase.topPanel.card4',
    number: String(props.summary?.reservedBuriedCount ?? 0),
    regionRows: toRegionRows(props.summary?.reservedBuriedCountByRegion, false),
  },
]);
</script>
<style lang="less" scoped>
// 卡片 100% 高度需要 t-col 建立高度链 20260915 新增
.dashboard-col {
  height: 100%;
}

.dashboard-item {
  height: 100%;
  display: flex;
  flex-direction: column;
  // 上下 padding 收窄：卡片新增区域小字行后，固定 140px 高度内仍需容纳数值+两行小字 20260915 修改
  padding: var(--td-comp-paddingTB-s) var(--td-comp-paddingLR-xxl);

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

  :deep(.t-card__footer) {
    padding: 0;
  }

  :deep(.t-card__title) {
    font: var(--td-font-body-medium);
    color: var(--td-text-color-secondary);
  }

  :deep(.t-card__body) {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    flex: 1;
    position: relative;
    padding: 0;
    // 首行固定高度卡片内边距收窄，避免数值/装饰图溢出 20260915 修改
    margin-top: var(--td-comp-margin-s);
    margin-bottom: 0;
  }

  &:hover {
    cursor: pointer;
  }

  &-top {
    display: flex;
    flex-direction: row;
    align-items: flex-start;

    > span {
      display: inline-block;
      color: var(--td-text-color-primary);
      font-size: var(--td-font-size-headline-medium);
      line-height: var(--td-line-height-headline-medium);
    }
  }

  // 区域分解小字行：几个区域几行（如「九泉山：¥20,000」）20260915 新增
  &-regions {
    display: flex;
    flex-direction: column;
    gap: 2px;
    margin-top: var(--td-comp-margin-xs);
  }

  &-region {
    font-size: 12px;
    line-height: 16px;
    color: var(--td-text-color-secondary);
  }

  &-left {
    position: absolute;
    top: 0;
    right: 0;

    > span {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: var(--td-comp-size-xxl);
      height: var(--td-comp-size-xxl);
      background: var(--td-brand-color-light);
      border-radius: 50%;

      .t-icon {
        font-size: 20px;
        color: var(--td-brand-color);
      }
    }
  }

  /* 针对第一个卡片需要反色处理 */
  &--main-color {
    background: var(--td-brand-color);
    color: var(--td-text-color-primary);

    :deep(.t-card__title),
    .dashboard-item-top span,
    .dashboard-item-region {
      color: var(--td-text-color-anti);
    }
  }
}
</style>

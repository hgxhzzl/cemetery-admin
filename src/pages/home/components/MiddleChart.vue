<template>
  <t-row :gutter="16" class="row-container">
    <t-col class="dashboard-col" :xs="12" :xl="12">
      <t-card :title="t('pages.dashboardBase.topPanel.analysis.title')" class="dashboard-chart-card" :bordered="false">
        <div id="monitorContainer" class="dashboard-chart-container" :style="{ width: '100%', height: '100%' }" />
      </t-card>
    </t-col>
  </t-row>
</template>
<script setup lang="ts">
import { useWindowSize } from '@vueuse/core';
import { LineChart } from 'echarts/charts';
import { GridComponent, LegendComponent, TooltipComponent } from 'echarts/components';
import * as echarts from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { computed, nextTick, onActivated, onDeactivated, onMounted, watch } from 'vue';

import type { MonthlySaleModel } from '@/api/dashboard';
import type { TChartColor } from '@/config/color';
import { DARK_CHART_COLORS, LIGHT_CHART_COLORS } from '@/config/color';
import { t } from '@/locales';
import { useSettingStore } from '@/store';
import { changeChartsTheme } from '@/utils/color';

import { getMonthlySalesDataSet } from '../index';

const props = defineProps<{
  monthlySales?: MonthlySaleModel[];
}>();

echarts.use([TooltipComponent, LegendComponent, GridComponent, LineChart, CanvasRenderer]);

const store = useSettingStore();

// 图表文字/边框颜色：只按当前显示模式（含 auto 跟随系统）取主题色板，不再读取持久化的 store.chartColors。
// 水合恢复的旧数据可能与当前模式脱节（如亮色页面配上暗色色板的白色文字），造成文字与卡片背景同色、
// 问题时有时无；placeholderColor 已与首页卡片小字色（--td-text-color-secondary）对齐 20260919 修复
const chartColors = computed<TChartColor>(() =>
  store.displayMode === 'dark' ? DARK_CHART_COLORS : LIGHT_CHART_COLORS,
);

// monitorChart
let monitorContainer: HTMLElement;
let monitorChart: echarts.ECharts;
const renderMonitorChart = () => {
  if (!monitorContainer) {
    monitorContainer = document.getElementById('monitorContainer')!;
  }
  monitorChart = echarts.init(monitorContainer);
  monitorChart.setOption(getMonthlySalesDataSet({ monthlySales: props.monthlySales, ...chartColors.value }));
};

const renderCharts = () => {
  renderMonitorChart();
};

// 统计聚合数据返回后刷新折线图（父组件 onActivated 拉取 summary 下发）20260914 新增
watch(
  () => props.monthlySales,
  () => {
    if (!monitorChart) return;
    monitorChart.setOption(getMonthlySalesDataSet({ monthlySales: props.monthlySales, ...chartColors.value }));
  },
);

// 图表颜色本身变化时立即重绘（无论由模式切换、水合还是其他路径引起），
// 保证文字/边框颜色永远与当前主题一致，杜绝文字与背景同色不可见 20260915 修复
watch(chartColors, () => {
  if (!monitorChart) return;
  monitorChart.setOption(getMonthlySalesDataSet({ monthlySales: props.monthlySales, ...chartColors.value }));
});

// chartSize update：图表尺寸跟随容器（第二行动态伸缩）变化 20260915 修改
const updateContainer = () => {
  if (!monitorContainer || !monitorChart) return;
  monitorChart.resize({
    width: monitorContainer.clientWidth,
    height: monitorContainer.clientHeight,
  });
};

// 监听图表容器尺寸变化（卡片拉伸/收缩时自动 resize）20260915 新增
let resizeObserver: ResizeObserver | undefined;
const startObserver = () => {
  if (!monitorContainer || resizeObserver) return;
  resizeObserver = new ResizeObserver(() => {
    updateContainer();
  });
  resizeObserver.observe(monitorContainer);
};

const stopObserver = () => {
  resizeObserver?.disconnect();
  resizeObserver = undefined;
};

onMounted(() => {
  renderCharts();
  nextTick(() => {
    updateContainer();
    startObserver();
  });
});

const { width, height } = useWindowSize();
watch([width, height], () => {
  updateContainer();
});

onActivated(() => {
  // keep-alive 切回时重新观察容器并校准尺寸 20260915 新增
  nextTick(() => {
    // 按当前主题重新渲染图表，防止在首页外切换亮/暗模式后文字颜色与背景色相同而不可见 20260915 修复
    monitorChart.setOption(getMonthlySalesDataSet({ monthlySales: props.monthlySales, ...chartColors.value }));
    updateContainer();
    startObserver();
  });
});

onDeactivated(() => {
  stopObserver();
  // store 相关的 watch 不在此处停止：keep-alive 下组件不卸载，watch 需持续响应模式切换，
  // 否则离开首页后切换主题，回首页时图表颜色不会刷新（文字色与背景脱节）20260915 修复
});

watch(
  () => store.brandTheme,
  () => {
    changeChartsTheme([monitorChart]);
  },
);

watch(
  () => store.isSidebarCompact,
  () => {
    if (store.isSidebarCompact) {
      nextTick(() => {
        updateContainer();
      });
    } else {
      setTimeout(() => {
        updateContainer();
      }, 180);
    }
  },
);

watch(
  () => store.mode,
  () => {
    monitorChart.dispose();

    renderCharts();
    // 若在首页外（deactivated）切换模式，容器处于离屏状态尺寸为 0，
    // 等下一帧容器回到文档后重新校准尺寸 20260915 修改
    nextTick(() => {
      updateContainer();
    });
  },
);
</script>
<style lang="less" scoped>
// 卡片 100% 高度需要 t-col 建立高度链 20260915 新增
.dashboard-col {
  height: 100%;
}

.dashboard-chart-card {
  height: 100%;
  display: flex;
  flex-direction: column;
  // 上下内边距收窄到 12px、去掉 body 上间距，把高度全部让给图表容器 20260915 修改
  padding: var(--td-comp-paddingTB-m) var(--td-comp-paddingLR-xl);

  :deep(.t-card__header) {
    flex: none;
    padding: 0;
  }

  // TDesign Card 的 body 外层还包着 Loading 组件渲染的 div.t-loading__parent，
  // 该包装默认不是 flex 容器，会阻断高度链（body 的 flex:1 失效、图表容器 100% 高度解析失败），
  // 必须让它占满卡片剩余空间并成为 flex 容器 20260915 修复
  :deep(.t-loading__parent) {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
  }

  :deep(.t-card__body) {
    flex: 1;
    min-height: 0;
    padding: 0;
    margin-top: 0;
  }

  :deep(.t-card__title) {
    font: var(--td-font-title-large);
    font-weight: 400;
  }
}

.dashboard-chart-container {
  width: 100%;
  height: 100%;
}
</style>

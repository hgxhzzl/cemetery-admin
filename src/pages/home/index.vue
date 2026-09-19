<template>
  <!-- 三行布局布满一屏：第一/三行固定高度、第二行动态伸缩 20260915 修改 -->
  <div class="home-dashboard">
    <top-panel class="home-row home-row--top" :summary="summary" />
    <middle-chart class="home-row home-row--middle" :monthly-sales="summary?.monthlySales" />
    <rank-list class="home-row home-row--bottom" :regions="summary?.regions" :weekly-sales="summary?.weeklySales" />
  </div>
</template>
<script setup lang="ts">
import { onActivated, ref } from 'vue';

import type { DashboardSummaryModel } from '@/api/dashboard';
import { getDashboardSummary } from '@/api/dashboard';
import { logError } from '@/utils/logger';

import MiddleChart from './components/MiddleChart.vue';
import RankList from './components/RankList.vue';
import TopPanel from './components/TopPanel.vue';

defineOptions({
  name: 'HomeIndex',
});

const summary = ref<DashboardSummaryModel | null>(null);

// 当前页激活时刷新：keep-alive 缓存下首次进入与每次切回该 tab 均触发 20260915 修改
onActivated(async () => {
  try {
    summary.value = await getDashboardSummary();
  } catch (e) {
    logError(e);
  }
});
</script>
<style scoped>
.home-dashboard {
  display: flex;
  flex-direction: column;
  /* 与查询页一致的自适应公式，偏移从 220px 收紧至 200px：常规桌面视口下三行内容（732px 最小）恰好布满不触发内层滚动条 20260917 修改 */
  height: calc(100vh - 200px);
  /* 窄屏下内容超出一屏时允许滚动，避免首行卡片/图表被压缩裁切 20260915 修改 */
  overflow-y: auto;
  /* 裁剪 t-row gutter 负 margin（左右各 -8px）导致的 8px 横向出血：列内对称 padding 已补偿，裁剪不影响视觉；
     否则 overflow-y:auto 会把 overflow-x 隐式置为 auto，底部常显横向滚动条 20260917 修复 */
  overflow-x: hidden;
}

.home-row {
  flex: none;
  min-width: 0;
}

.home-row + .home-row {
  margin-top: 10px;
}

/* 第一行卡片：min-height 保底 124px；窄屏（<1200px）时 4 张卡片排成 2 行，允许撑高不被裁切 20260915 修改 */
.home-row--top {
  min-height: 124px;
}

/* 第二行动态伸缩：销售数量统计折线图占满剩余高度（保底 220px：echarts grid 上下边距 76px + 折线区域 90px + 卡片边距） */
.home-row--middle {
  flex: 1 1 auto;
  min-height: 260px;
}

/* 第三行固定高度：销售记录表格显示 5 条明细（超出表格内滚动） */
.home-row--bottom {
  height: 328px;
}
</style>

<template>
  <!-- 五行布局自然高度：第一/三/四/五行固定高度、第二行固定高度，不再限定一屏高，内容整体可上下滚动（外层布局层滚动承接）；
       各行均为固定 span 栅格不设响应式断点，窄视口下内容区由全局 min-width 1320px 保底，
       布局不窜行变形，超出部分由浏览器横向滚动条承接 20260925 修改 -->
  <div class="home-dashboard">
    <top-panel class="home-row home-row--top" :summary="summary" />
    <middle-chart class="home-row home-row--middle" :monthly-sales="summary?.monthlySales" />
    <rank-list class="home-row home-row--bottom" :regions="summary?.regions" :weekly-sales="summary?.weeklySales" />
    <!-- 下葬记录：销售记录下方第四行，样式同销售记录，分区域两张卡、今天/明天切换 20260925 新增 -->
    <buried-list
      class="home-row home-row--buried"
      :regions="summary?.regions"
      :buried-records="summary?.buriedRecords"
    />
    <!-- 管理到期记录：下葬记录下方第五行，样式同销售记录，分区域两张卡；
         数据走 /expired-list 独立分页接口滚动加载，标题右侧显示记录条数 20260925 新增 20260926 改分页加载 -->
    <expired-list class="home-row home-row--expired" :regions="summary?.regions" />
  </div>
</template>
<script setup lang="ts">
import { onActivated, ref } from 'vue';

import type { DashboardSummaryModel } from '@/api/dashboard';
import { getDashboardSummary } from '@/api/dashboard';
import { logError } from '@/utils/logger';

import BuriedList from './components/BuriedList.vue';
import ExpiredList from './components/ExpiredList.vue';
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
  /* 取消 calc(100vh - 200px) 一屏高限制：自然高度随内容撑开，上下滚动交给外层布局层（.tdesign-starter-layout overflow-y:auto）承接，
     不再产生内层滚动条 20260925 修改 */

  /* 裁剪 t-row gutter 负 margin（左右各 -8px）导致的 8px 横向出血：列内对称 padding 已补偿，裁剪不影响视觉 20260917 修复 */
  overflow-x: hidden;
}

.home-row {
  flex: none;
  min-width: 0;
}

.home-row + .home-row {
  margin-top: 10px;
}

/* 第一行卡片：min-height 保底 124px；固定单行四卡布局（不再因窄屏断点排成 2 行）20260925 修改 */
.home-row--top {
  min-height: 124px;
}

/* 第二行固定高度：容器不再限高一屏，flex:1 无从伸缩，改为固定高度供折线图绘制
   （原动态伸缩时常规视口下实际渲染约 360-400px，取 380px 居中值）20260925 修改 */
.home-row--middle {
  height: 380px;
}

/* 第三行固定高度：销售记录表格显示 5 条明细（超出表格内滚动） */
.home-row--bottom {
  height: 328px;
}

/* 第四行固定高度：下葬记录与销售记录同结构同高度 20260925 新增 */
.home-row--buried {
  height: 328px;
}

/* 第五行固定高度：管理到期记录与销售记录同结构同高度 20260925 新增 */
.home-row--expired {
  height: 328px;
}
</style>

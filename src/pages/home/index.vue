<template>
  <!-- 五行布局自然高度：第一行保底 124px、第二行（销售数量统计）固定 380px，下葬记录/销售记录/管理到期三行为
       150px~328px 区间自适应（无记录保底、记录不足 5 行按实际用高、超过则行内滚动），不再限定一屏高，内容整体可上下滚动（外层布局层滚动承接）；
       各行均为固定 span 栅格不设响应式断点，窄视口下内容区由全局 min-width 1320px 保底，
       布局不窜行变形，超出部分由浏览器横向滚动条承接 20260925 修改 20261004 三行改区间 -->
  <div class="home-dashboard">
    <top-panel class="home-row home-row--top" :summary="summary" />
    <!-- 下葬记录：移至销售数量统计上方第二行（用户反馈位置互换），样式同销售记录，分区域两张卡、今天/明天切换 20260925 新增 20261002 移位 -->
    <buried-list
      class="home-row home-row--buried"
      :regions="summary?.regions"
      :buried-records="summary?.buriedRecords"
    />
    <rank-list class="home-row home-row--bottom" :regions="summary?.regions" :weekly-sales="summary?.weeklySales" />
    <!-- 销售数量统计：由第二行移至下葬记录原位置第四行（用户反馈与下葬记录位置互换）20261002 移位 -->
    <middle-chart class="home-row home-row--middle" :monthly-sales="summary?.monthlySales" />
    <!-- 管理到期记录：销售数量统计下方第五行，样式同销售记录，分区域两张卡；
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

/* 折线图行固定高度（现位于第四行）：容器不再限高一屏，flex:1 无从伸缩，改为固定高度供折线图绘制
   （原动态伸缩时常规视口下实际渲染约 360-400px，取 380px 居中值）20260925 修改
   20261002 与下葬记录位置互换：由第二行移至第四行，高度不变 */
.home-row--middle {
  height: 380px;
}

/* 下葬记录 / 销售记录 / 管理到期三行：高度由“固定 328px”改为区间自适应 20261004 修改
   - 下限 150px：无记录时（表内“暂无数据”占位）卡片不至于塌成一条
   - 中间段：少于 5 行明细时由内容撑高，行高取“本行两张卡自然高度的较大值”。
     需显式写 align-items: stretch：TDesign 的 t-row 根节点默认带 t-row--align-top（align-items: flex-start），
     不覆盖则行高能拉到最大值但短卡不会被拉伸，短卡下方会多出空断层（实测：4 条 270px / 2 条 192.7px）20261004 新增
   - 上限 328px：与原固定值一致。表格自身 max-height 288 + 卡片 padding/header 占位已够 5 行以上内滚，
     所以记录 >= 5 行时的表现与改动前完全相同 */
.home-row--buried,
.home-row--bottom,
.home-row--expired {
  align-items: stretch;
  min-height: 150px;
  max-height: 328px;
}
</style>

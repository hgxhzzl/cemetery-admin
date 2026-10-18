<template>
  <!-- 六行布局自然高度：第一行保底 124px、销售数量统计行固定 380px；销售记录/管理到期/预定记录三行为
       150px~307px 区间自适应（无记录保底、每卡最多 5 行、超出走表内滚动条）；下葬记录不受 5 条上限、有多少显示多少并随行数自然增高；
       不再限定一屏高，内容整体可上下滚动（外层布局层滚动承接）；
       各行均为固定 span 栅格不设响应式断点，窄视口下内容区由全局 min-width 1320px 保底，
       布局不窜行变形，超出部分由浏览器横向滚动条承接 20260925 修改 20261004 三行改区间 20261011 增至六行 -->
  <div class="home-dashboard">
    <!-- 第一行四卡片不再显示 20261010 隐藏 -->
    <!-- <top-panel class="home-row home-row--top" :summary="summary" /> -->
    <!-- 下葬记录：首行（位于销售数量统计上方），样式同销售记录，分区域两张卡、今天/明天切换 20260925 新增 20261002 移位 -->
    <buried-list
      class="home-row home-row--buried"
      :regions="summary?.regions"
      :buried-records="summary?.buriedRecords"
    />
    <!-- 预定记录：上移至下葬记录正下方，样式同管理到期记录；
         数据走 /reserve-list 独立分页接口滚动加载（预定限期 >= 当天且墓位未售出），标题右侧显示记录条数 20261011 新增 20261017 移位 -->
    <reserve-list class="home-row home-row--reserve" :regions="summary?.regions" />
    <rank-list class="home-row home-row--bottom" :regions="summary?.regions" :weekly-sales="summary?.weeklySales" />
    <!-- 销售数量统计：位于销售记录下方，与下葬记录位置互换 20261002 移位 -->
    <middle-chart class="home-row home-row--middle" :monthly-sales="summary?.monthlySales" />
    <!-- 管理到期记录：销售数量统计下方末行，样式同销售记录，分区域两张卡；
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
import ReserveList from './components/ReserveList.vue';

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

  /* 裁剪 t-row gutter 负 margin（左右各 -8px）导致的 8px 横向出血：列内对称 padding 已补偿，裁剪不影响视觉 20260917 修复
     由 hidden 改为 clip：overflow-x:hidden 会把 overflow-y 强制算成 auto，内容自然高度略超盒子时凭空多出一条内层纵向滚动条；
     clip 同样裁剪横向溢出但不创建滚动容器，overflow-y 维持 visible → 内层滚动条消失 20261005 修改 */
  overflow-x: clip;
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

/* 销售记录 / 管理到期 / 预定记录三行：高度由“固定 328px”改为区间自适应 20261004 修改
   - 下限 150px：无记录时（表内“暂无数据”占位）卡片不至于塌成一条
   - 中间段：少于 5 行明细时由内容撑高，行高取“本行两张卡自然高度的较大值”。
     需显式写 align-items: stretch：TDesign 的 t-row 根节点默认带 t-row--align-top（align-items: flex-start），
     不覆盖则行高能拉到最大值但短卡不会被拉伸，短卡下方会多出空断层（实测：4 条 270px / 2 条 192.7px）20261004 新增
   - 上限 307px：按“每卡最多显示 5 行、超出走表内滚动条”精确反推。20261017 修改：
     小尺寸表格每行 = 上下 padding(8×2=16) + 行高(line-height 22) + 下边框 1 = 39px（表头行同高，index 列 span 未套
     dashboard-rank__cell 圆点样式不额外加高）。表格 max-height 取“表头 + 5 行 = 6×39 = 234”再收 1px 到 233 作为兜底（避免第 6 行在 234 整边界上
     露出 1px 发丝线；代价仅是可见末行下边框被裁 1px，无影响）；三处列表组件（销售/管理到期/预定）同步由 250 收窄至 233（250 会多露约 0.4 行、非整 5 行）。
     卡片自然高度 = 上下 padding(16×2=32) + header(26) + body margin-top(16) + 表格 233 = 307px，
     故本组行上限取 307；并保留 overflow: hidden 作为兜底，杜绝任何估算误差导致的溢出压行 20261017 修改 */
.home-row--bottom,
.home-row--expired,
.home-row--reserve {
  align-items: stretch;
  overflow: hidden;
  min-height: 90px;
  max-height: 307px;
}

/* 下葬记录：不受 5 条上限约束，有多少显示多少、卡片随行数自然增高（表格不再设 max-height），
   故本行不设 max-height / overflow 裁剪；仅保留 align-items: stretch 让同行两卡等高、min-height 空记录保底 20261017 新增 */
.home-row--buried {
  align-items: stretch;
  min-height: 90px;
}
</style>

import type { Ref } from 'vue';

// 进场过渡结束前的延时显示窗口：与各页 fade 过渡（Content.vue anim-duration-slow ≈350ms）对齐，
// 过渡未结束就渲染内容会造成切页内容突现 20261019 抽取
const PAGE_SHOW_ENTER_DELAY = 380;

/**
 * 延时调用视图切换函数：收敛各页 onMounted 里逐字重复的
 * `setTimeout(() => controlPageShow('list'), 380)`，魔数单点维护。
 * 本函数不依赖 usePageSwitch，自带 controlPageShow 本地实现的页（room 页带额外状态重置）也可直接传入 20261019 抽取
 */
export const delayControlPageShow = (
  controlPageShow: (name: string) => void,
  name: string,
  delay = PAGE_SHOW_ENTER_DELAY,
) => {
  setTimeout(controlPageShow, delay, name);
};

/**
 * 页面视图互斥切换 hook：views 为「视图名 → 显隐 ref」映射，
 * controlPageShow(name) 仅展示指定视图，其余视图全部隐藏。
 * 适用于列表/详情/登记（新建修改复用）等互斥视图的卡片页。
 * 20260914 从 5 个卡片页（销售/下葬/预定/管理费/联系）抽取
 */
export const usePageSwitch = (views: Record<string, Ref<boolean>>) => {
  const controlPageShow = (name: string) => {
    Object.entries(views).forEach(([key, visibleRef]) => {
      visibleRef.value = key === name;
    });
  };

  // 初始视图延时显示（绑定本 hook 的 controlPageShow）：原 7 个卡片页逐字重复的
  // setTimeout(..., 380) 收敛至此，延时口径与 room 页共用 delayControlPageShow 20261019 抽取
  const scheduleControlPageShow = (name: string, delay = PAGE_SHOW_ENTER_DELAY) => {
    delayControlPageShow(controlPageShow, name, delay);
  };

  return { controlPageShow, scheduleControlPageShow };
};

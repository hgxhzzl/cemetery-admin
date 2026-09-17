import type { Ref } from 'vue';

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

  return { controlPageShow };
};

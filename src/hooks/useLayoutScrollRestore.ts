import { ref } from 'vue';

/**
 * 查询页布局层滚动位置恢复 hook：外层滚动容器为布局层 .tdesign-starter-layout(overflow-y:scroll)，
 * 进入详情前记录其 scrollTop，返回列表时恢复，避免内容高度骤减时被浏览器钳制导致列表跳变。
 * 4 个查询页（saleQuery/buriedQuery/adminfeeQuery/contactsQuery）原逐字重复的逻辑收敛于此 20260914 抽取
 */
export const useLayoutScrollRestore = () => {
  const layoutScrollTop = ref(0);

  const getLayoutScrollEl = () => document.querySelector('.tdesign-starter-layout') as HTMLElement | null;

  // 进入详情前调用：记录当前滚动位置
  const saveScrollTop = () => {
    layoutScrollTop.value = getLayoutScrollEl()?.scrollTop ?? 0;
  };

  // 返回列表后调用：恢复滚动位置（各页配合 nextTick 与表格 refreshTable 使用）
  const restoreScrollTop = () => {
    const layoutEl = getLayoutScrollEl();
    if (layoutEl) {
      layoutEl.scrollTop = layoutScrollTop.value;
    }
  };

  return {
    saveScrollTop,
    restoreScrollTop,
  };
};

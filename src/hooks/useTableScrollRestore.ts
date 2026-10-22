import type { Ref } from 'vue';
import { nextTick, ref } from 'vue';

/** t-table 内容区选择器：keep-alive 失活时该 DOM 被移除、scrollTop 归零，切回会回到顶部 */
const TABLE_CONTENT_SELECTOR = '.t-table__content';

/**
 * 表格内滚动位置保持 hook：滚动时实时记录 t-table 内容区（.t-table__content）的 scrollTop，
 * tab 切回（onActivated）时恢复到记录值。与 useLayoutScrollRestore（外层布局容器 .tdesign-starter-layout）
 * 针对不同容器：本 hook 管 t-table 自身内容区。
 * roomQuery/adminfeeQuery/managementPeriod 等页原逐字重复的「tableScrollTop + onTableScroll + onActivated 恢复」
 * 三段逻辑收敛于此（审查修复 20261022 四轮 P2-1）。
 * @param tableRef   t-table 组件实例 ref
 * @param onLoadMore 可选：滚动同时驱动无限加载（传入 useInfiniteScrollQuery 的 handleScroll）
 */
export const useTableScrollRestore = (tableRef: Ref<any>, onLoadMore?: (params: { e: WheelEvent }) => void) => {
  const tableScrollTop = ref(0);

  const getTableContentEl = (): HTMLElement | null =>
    tableRef.value?.$el?.querySelector(TABLE_CONTENT_SELECTOR) ?? null;

  // 绑定到 t-table 的 @scroll：先透传给无限加载回调，再记录当前内层滚动位置
  const onTableScroll = (params: { e: WheelEvent }) => {
    onLoadMore?.(params);
    const el = params.e.target as HTMLElement | null;
    if (el) {
      tableScrollTop.value = el.scrollTop;
    }
  };

  // tab 切回时恢复：待下一帧 DOM 就绪后写回 scrollTop（各页在自己的 onActivated 守卫内调用）
  const restoreTableScroll = () => {
    nextTick(() => {
      const content = getTableContentEl();
      if (content) {
        content.scrollTop = tableScrollTop.value;
      }
    });
  };

  return { tableScrollTop, onTableScroll, restoreTableScroll };
};

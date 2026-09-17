import { onMounted } from 'vue';
import { useRoute } from 'vue-router';

import { useTabsRouterStore } from '@/store';

export const useTabCacheName = (componentName: string) => {
  const route = useRoute();
  const tabsRouterStore = useTabsRouterStore();

  onMounted(() => {
    tabsRouterStore.updateTabComponentName(route.path, componentName);
  });
};

// 业务公共 hook 统一出口：详情数据/卡片网格/查询页滚动恢复/卡片页筛选/查询页无限滚动/视图切换/权限对象 20260914 抽取
export type { CardRowArg } from './useCardGrid';
export { useCardGrid } from './useCardGrid';
export { useInfiniteScrollQuery } from './useInfiniteScrollQuery';
export { useLayoutScrollRestore } from './useLayoutScrollRestore';
export { usePageSwitch } from './usePageSwitch';
export { useParkRoomFilter } from './useParkRoomFilter';
export { usePermission } from './usePermission';
export { useRoomDetail } from './useRoomDetail';

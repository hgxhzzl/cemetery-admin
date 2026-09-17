import type { Ref } from 'vue';
import { computed, ref } from 'vue';

import { logError } from '@/utils/logger';

/** 查询页分页返回最小结构：totalAmount 仅销售/管理费查询接口返回，其余页忽略 */
export interface QueryPageResult<T> {
  list: T[];
  total: number;
  totalAmount?: number;
}

/**
 * 查询页无限滚动 hook：4 个查询页（销售/下葬/管理费/联系人查询）原逐字重复的
 * 滚动加载状态机（分页/防抖加载/到底自动追加/查询重置滚动归零）收敛于此。
 * fetchPage 由各页传入本业务分页查询函数，tableRef 用于查询后重置滚动位置。
 * 20260914 从 4 页抽取
 */
export const useInfiniteScrollQuery = <T>(
  fetchPage: (current: number, pageSize: number) => Promise<QueryPageResult<T>>,
  tableRef: Ref<any>,
) => {
  // 滚动加载内部分页参数：total 由接口返回，判断是否还有下一页；不再绑定表格分页器
  const pagination = ref({
    current: 0,
    // 每页 40 条：与下葬查询页统一，表格自适应变高后一次展示更多记录
    pageSize: 40,
    total: 0,
    // 金额合计：后端 SUM，查询条件变化时随接口刷新（销售/管理费查询页展示）
    totalAmount: 0,
  });
  // 加载中标记：防止滚动过程中重复请求
  const loading = ref(false);
  // 已加载的累积列表数据（声明断言为 Ref<T[]>：泛型场景下避免 UnwrapRef 推导导致 push 类型不兼容）
  const data = ref<T[]>([]) as Ref<T[]>;
  // 是否还有更多数据：已加载条数 < 总数时继续滚动加载
  const hasMore = computed(() => data.value.length < pagination.value.total);

  // 数据加载：reset=true 时从第一页重新加载，否则追加下一页；滚动到底自动触发
  const fetchData = async (reset = false) => {
    if (loading.value) {
      return;
    }
    loading.value = true;
    const current = reset ? 1 : pagination.value.current + 1;
    try {
      const result = await fetchPage(current, pagination.value.pageSize);
      if (reset) {
        data.value = result.list;
      } else {
        // 追加下一页：push 展开追加，避免每次拼接全量拷贝
        data.value.push(...result.list);
      }
      pagination.value = {
        current,
        pageSize: pagination.value.pageSize,
        total: result.total,
        totalAmount: result.totalAmount ?? 0,
      };
    } catch (e) {
      logError(e);
    } finally {
      loading.value = false;
    }
  };

  // 查询/重置后表格滚动位置归零：滚动容器为 t-table 内容区 .t-table__content，
  // 避免停留在底部时立即触发下一页自动加载
  const resetTableScroll = () => {
    const content = tableRef.value?.$el?.querySelector('.t-table__content');
    if (content) {
      content.scrollTop = 0;
    }
  };

  const onSubmit = () => {
    resetTableScroll();
    fetchData(true);
  };

  // 滚动到底部自动加载下一页：距离底部不足阈值且还有数据且未在加载中时请求下一页
  const handleScroll = (params: { e: WheelEvent }) => {
    const el = params.e.target as HTMLElement;
    if (!el || loading.value || !hasMore.value) {
      return;
    }
    const distanceToBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    if (distanceToBottom < 40) {
      fetchData(false);
    }
  };

  return {
    data,
    pagination,
    loading,
    hasMore,
    fetchData,
    onSubmit,
    resetTableScroll,
    handleScroll,
  };
};

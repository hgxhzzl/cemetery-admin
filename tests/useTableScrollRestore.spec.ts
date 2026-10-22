// 表格内滚动位置保持 hook 的口径用例（审查修复 20261022 四轮 P2-1）：
// 用最小替身（不引 jsdom，同打印流程用例的替身思路）钉住三条行为红线——
// 1) @scroll 回调先把事件透传给无限加载回调，再记录内层滚动位置；未传回调时也必须安全记录；
// 2) 恢复时（下一帧）把记录的 scrollTop 写回 t-table 内容区；
// 3) 表格实例/内容区缺失时安全跳过、不抛错。
import { describe, expect, it, vi } from 'vitest';
import { nextTick, ref } from 'vue';

import { useTableScrollRestore } from '@/hooks/useTableScrollRestore';

// 造一个带 $el.querySelector 的表格替身：querySelector 固定返回同一个“内容区”节点
function createTableStub() {
  const content = { scrollTop: 0 };
  const tableRef = ref({ $el: { querySelector: () => content } });
  return { tableRef, content };
}

describe('useTableScrollRestore', () => {
  it('onTableScroll 先透传无限加载回调，再记录内容区 scrollTop', () => {
    const { tableRef } = createTableStub();
    const onLoadMore = vi.fn();
    const { tableScrollTop, onTableScroll } = useTableScrollRestore(tableRef, onLoadMore);

    onTableScroll({ e: { target: { scrollTop: 128 } } } as any);

    expect(onLoadMore).toHaveBeenCalledTimes(1);
    expect(tableScrollTop.value).toBe(128);
  });

  it('未传 onLoadMore 时 onTableScroll 仍记录且不报错', () => {
    const { tableRef } = createTableStub();
    const { tableScrollTop, onTableScroll } = useTableScrollRestore(tableRef);

    onTableScroll({ e: { target: { scrollTop: 42 } } } as any);

    expect(tableScrollTop.value).toBe(42);
  });

  it('restoreTableScroll 下一帧把记录值写回内容区', async () => {
    const { tableRef, content } = createTableStub();
    const { onTableScroll, restoreTableScroll } = useTableScrollRestore(tableRef);

    onTableScroll({ e: { target: { scrollTop: 200 } } } as any);
    // 模拟 keep-alive 失活后内容区被移除、scrollTop 归零
    content.scrollTop = 0;
    restoreTableScroll();
    await nextTick();
    await nextTick();

    expect(content.scrollTop).toBe(200);
  });

  it('表格实例缺失时恢复安全跳过、不抛错', async () => {
    const tableRef = ref(null);
    const { restoreTableScroll } = useTableScrollRestore(tableRef as any);

    restoreTableScroll();
    await nextTick();

    // 走到这里未抛异常即通过
    expect(true).toBe(true);
  });
});

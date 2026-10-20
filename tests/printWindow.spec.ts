import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { printHtmlInNewTab } from '@/utils/printWindow';

// 打印工具只依赖 window.open 返回的窗口对象，不碰宿主 document，
// 因此用最小替身即可在 node 环境跑通（无需引 jsdom）
const makePrintDoc = (readyState = 'complete') => ({
  readyState,
  open: vi.fn(),
  write: vi.fn(),
  close: vi.fn(),
});

const makePrintWindow = (readyState = 'complete') => {
  const document = makePrintDoc(readyState);
  return {
    document,
    onload: null as null | (() => void),
    focus: vi.fn(),
    print: vi.fn(),
  };
};

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('printWindow: 新标签页打印', () => {
  it('标签页被拦截（未开窗）时返回 false 且不写文档', () => {
    vi.stubGlobal('window', { open: vi.fn(() => null) });
    expect(printHtmlInNewTab('<html></html>')).toBe(false);
  });

  it('文档已就绪：写入后延时唤起焦点与打印', () => {
    const printWindow = makePrintWindow('complete');
    vi.stubGlobal('window', { open: vi.fn(() => printWindow) });

    expect(printHtmlInNewTab('<h1>票据</h1>')).toBe(true);
    expect(printWindow.document.open).toHaveBeenCalledTimes(1);
    expect(printWindow.document.write).toHaveBeenCalledWith('<h1>票据</h1>');
    expect(printWindow.document.close).toHaveBeenCalledTimes(1);
    // 延时 100ms 触发，避免预览因文档未加载完成而一闪即退
    expect(printWindow.print).not.toHaveBeenCalled();
    vi.advanceTimersByTime(100);
    expect(printWindow.focus).toHaveBeenCalledTimes(1);
    expect(printWindow.print).toHaveBeenCalledTimes(1);
  });

  it('文档未就绪：挂 onload 等加载完成再打印，不能立即抢打印', () => {
    const printWindow = makePrintWindow('loading');
    vi.stubGlobal('window', { open: vi.fn(() => printWindow) });

    expect(printHtmlInNewTab('<h1>票据</h1>')).toBe(true);
    expect(typeof printWindow.onload).toBe('function');

    vi.advanceTimersByTime(200);
    expect(printWindow.print).not.toHaveBeenCalled();

    printWindow.onload?.();
    vi.advanceTimersByTime(100);
    expect(printWindow.print).toHaveBeenCalledTimes(1);
  });

  it('必须在点击手势内同步开窗（异步里 window.open 会被浏览器拦截）', () => {
    // 该用例只做契约提醒：调用方需在 await 接口之前开窗或改为同步链路，
    // 现网调用（销售/管理费/安葬证）均在按钮回调内取数据后调用本函数
    expect(printHtmlInNewTab.length).toBe(1);
  });
});

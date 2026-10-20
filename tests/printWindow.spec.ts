import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { openPrintTab, printHtmlInNewTab, writeAndPrint } from '@/utils/printWindow';

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
    // 写入前注入 CSP meta 兜底阻断脚本（无 head 片段前置，审查修复 20261020）
    expect(printWindow.document.write.mock.calls[0][0]).toContain('<h1>票据</h1>');
    expect(printWindow.document.write.mock.calls[0][0]).toContain('Content-Security-Policy');
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

  it('完整文档：CSP meta 注入 <head> 之后而非前置于 DOCTYPE 之前（避免怪异模式影响版式）', () => {
    const html = '<!DOCTYPE html><html><head><title>票据</title></head><body>甲</body></html>';
    const printWindow = makePrintWindow('complete');
    vi.stubGlobal('window', { open: vi.fn(() => printWindow) });

    printHtmlInNewTab(html);
    const written = printWindow.document.write.mock.calls[0][0] as string;
    expect(written.startsWith('<!DOCTYPE html><html><head><meta http-equiv="Content-Security-Policy"')).toBe(true);
  });

  it('openPrintTab + writeAndPrint：开窗与写入解耦，允许取数 await 后再写入（审查修复 20261020）', async () => {
    const printWindow = makePrintWindow('complete');
    vi.stubGlobal('window', { open: vi.fn(() => printWindow) });

    const tab = openPrintTab();
    expect(tab).toBe(printWindow as unknown as Window);
    // 模拟异步取收据配制：开窗与写入之间存在 await
    const config = await Promise.resolve({ prefix: '陵园' });
    writeAndPrint(tab!, `<h1>${config.prefix}专用票据</h1>`);
    expect(printWindow.document.write).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(100);
    expect(printWindow.print).toHaveBeenCalledTimes(1);
  });

  it('开窗入口同步契约：openPrintTab 无异步参数，须在点击手势内同步调用（异步里 window.open 会被浏览器拦截）', () => {
    expect(openPrintTab.length).toBe(0);
    expect(writeAndPrint.length).toBe(2);
  });
});

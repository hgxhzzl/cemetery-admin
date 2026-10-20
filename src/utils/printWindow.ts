// ============================================================
// 浏览器打印公共工具：空白新标签页写入打印文档并唤起打印预览 20261019 抽取
// 原销售/管理费/墓位业务三页四处逐字重复的同一流程（收据票据与安葬证套打共用）。
// 方案背景：隐藏 iframe 打印会让打印预览覆盖系统页，改为开空白新标签页（屏幕无任何内容）写入文档，
// 原系统页保持不变可随时切回；文档完全加载后再唤起打印，避免预览因页面未加载完成而一闪即关 20260922 定稿
// 拆分为 openPrintTab（须在点击手势内同步调用）+ writeAndPrint（允许在 await 取数之后调用），
// 修复三处票据打印先 await 收据配制再开窗被浏览器拦截的问题；printHtmlInNewTab 保留为同步链路便捷封装 20261020 审查修复
// ============================================================

// 打印文档 CSP：about:blank 新标签继承源站 origin，票据字段虽已逐处 escapeHtml，仍在写入前注入
// 策略兜底，阻断漏转义字段在打印文档内执行脚本读取父窗口 localStorage 的 XSS 链；
// 文档仅内联样式与系统字体，default-src 'none' + style-src 'unsafe-inline' 不影响版式 20261020 审查修复
const CSP_META = `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'">`;

// 注入到 <head> 之后（各拼装文档均为完整 HTML 且含 head）；无 head 的片段直接前置 meta，
// 不可整体前置于 <!DOCTYPE> 之前——doctype 出现在内容之后会被忽略导致文档进入怪异模式影响版式
const withCspMeta = (html: string): string => {
  return html.includes('<head')
    ? html.replace(/<head[^>]*>/i, (matched) => `${matched}${CSP_META}`)
    : `${CSP_META}${html}`;
};

/**
 * 同步打开空白打印新标签页。
 * 必须在用户点击手势内同步调用：异步回调中 window.open 会被浏览器拦截。
 * 返回 null 表示被拦截（未开窗），提示文案由调用方决定（各页 i18n key 不同）；
 * 开窗后若取数失败需自行关闭标签页，避免遗留空白页。
 */
export const openPrintTab = (): Window | null => window.open('', '_blank');

/**
 * 向 openPrintTab 打开的标签页写入 html 并唤起浏览器打印预览（可在 await 之后调用）。
 * 写入前自动注入 CSP meta 限制脚本执行。
 */
export const writeAndPrint = (printWindow: Window, html: string): void => {
  const printDoc = printWindow.document;
  printDoc.open();
  printDoc.write(withCspMeta(html));
  printDoc.close();
  // 等票据文档完全加载后再唤起打印，避免打印预览因页面加载未完成而一闪即关
  const triggerPrint = () => {
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 100);
  };
  if (printDoc.readyState === 'complete') {
    triggerPrint();
  } else {
    printWindow.onload = triggerPrint;
  }
};

/**
 * 在空白新标签页写入 html 并唤起浏览器打印预览（开窗+写入同步一气呵成）。
 * 返回 false 表示新标签页被浏览器拦截（未打开窗口），提示文案由调用方决定（各页 i18n key 不同）。
 * 须在用户点击手势内同步调用；调用方链路中存在 await 取数时，改用 openPrintTab + writeAndPrint。
 */
export const printHtmlInNewTab = (html: string): boolean => {
  const printWindow = openPrintTab();
  if (!printWindow) {
    return false;
  }
  writeAndPrint(printWindow, html);
  return true;
};

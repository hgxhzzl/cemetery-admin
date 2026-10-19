// ============================================================
// 浏览器打印公共工具：空白新标签页写入打印文档并唤起打印预览 20261019 抽取
// 原销售/管理费/墓位业务三页四处逐字重复的同一流程（收据票据与安葬证套打共用）。
// 方案背景：隐藏 iframe 打印会让打印预览覆盖系统页，改为开空白新标签页（屏幕无任何内容）写入文档，
// 原系统页保持不变可随时切回；文档完全加载后再唤起打印，避免预览因页面未加载完成而一闪即关 20260922 定稿
// ============================================================

/**
 * 在空白新标签页写入 html 并唤起浏览器打印预览。
 * 返回 false 表示新标签页被浏览器拦截（未打开窗口），提示文案由调用方决定（各页 i18n key 不同）。
 * 须在用户点击手势内同步调用：异步回调中 window.open 会被浏览器拦截。
 */
export const printHtmlInNewTab = (html: string): boolean => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    return false;
  }
  const printDoc = printWindow.document;
  printDoc.open();
  printDoc.write(html);
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
  return true;
};

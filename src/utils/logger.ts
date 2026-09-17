/**
 * 统一错误日志出口：页面与 hook 的 catch 分支统一走此函数，
 * 输出带 [cms] 前缀便于在控制台过滤，后续如需接入上报只需改这一处 20260917 新增
 */
export const logError = (...args: unknown[]): void => {
  console.error('[cms]', ...args);
};

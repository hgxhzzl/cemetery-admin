// 统一提取后端错误响应体的提示信息：后端业务校验失败以 HTTP 4xx 抛出。响应信封统一后（审查修复
// 20261021 P1-5）失败体一定带 message（与兼容位 error 同值），故优先读 message、回落历史体 error，
// 两处都读一次即可兼容旧后端未升级时的仅含 error 响应。
// 此前各页各自内联抽取或干脆只弹通用词条，收敛到此处统一复用（原 gravePlotBusiness 本地
// extractServerError 上移为公共函数 20261020 P2 C2）。
// 无后端文案时返回空串，由调用方 `extractServerError(e) || translate('operate.createdFailedPrompt')` 回退通用词条。
export const extractServerError = (e: unknown): string => {
  const data = (e as { response?: { data?: { message?: string; error?: string } } })?.response?.data;
  const text = data?.message || data?.error;
  return text ? String(text) : '';
};

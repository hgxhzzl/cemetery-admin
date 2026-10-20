// 统一提取后端错误响应体的提示信息：后端业务校验失败以 HTTP 4xx 抛出，AxiosError.response.data.error
// 为可读语义文案（如"编号已被占用""联系人重名""无权限"等）。此前各页各自内联抽取或干脆只弹通用词条，
// 收敛到此处统一复用（原 gravePlotBusiness 本地 extractServerError 上移为公共函数 20261020 P2 C2）。
// 无后端文案时返回空串，由调用方 `extractServerError(e) || translate('operate.createdFailedPrompt')` 回退通用词条。
export const extractServerError = (e: unknown): string => {
  const data = (e as { response?: { data?: { error?: string } } })?.response?.data;
  return data?.error ? String(data.error) : '';
};

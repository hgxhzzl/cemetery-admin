// 请求重试/超时的纯策略函数(审查修复 20261021 P1-4)。
// 单独抽出成模块的原因:拦截器 responseInterceptorsCatch 里耦合了 userStore / router /
// MessagePlugin / axios 实例,直接测拦截器代价极高;而“该不该重试”“超时给多少”本质是
// 只依赖 method/status/次数的纯判定,抽出来后可用普通单测把口径钉死,防止日后被改回
// “写请求也盲重试造成重复入库”或“慢事务被默认 10s 误杀”。

// 读请求超时(列表/详情/统计查询,沿用原全局值)
export const READ_TIMEOUT_MS = 10 * 1000;
// 写请求超时(墓位业务保存、取消销售等多表事务 + 费用重算级联,链路明显更长)
export const WRITE_TIMEOUT_MS = 30 * 1000;

export interface RetryDecision {
  // config.method(axios 已统一为小写)
  method?: string;
  // error.response?.status;网络错误/超时时为 undefined
  status?: number;
  // 该请求已重试次数
  retryCount: number;
  // requestOptions.retry;缺失即代表调用方未开启重试
  retry?: { count: number; delay: number };
}

// 判定一次失败请求是否应进入退避重试。口径:
// 1) 未配置 retry → 不重试;
// 2) 非 GET(即写请求) → 一律不重试。写请求即便因网络抖动/超时/5xx 失败,服务端事务
//    可能已经提交,客户端盲重试会造成重复入库(重复销售登记 / 重复下葬派生 / 重复收款),
//    故失败交由用户显式再点,不自动重放(审查修复 20261021 P1-4);
// 3) 4xx 为确定性业务/权限错误,重试无意义;
// 4) 已达次数上限 → 不再重试;
// 5) 其余(幂等 GET 的网络错误/超时/5xx)才退避重试。
export function shouldRetry({ method, status, retryCount, retry }: RetryDecision): boolean {
  if (!retry) return false;
  if (String(method || '').toLowerCase() !== 'get') return false;
  if (status && status < 500) return false;
  if (retryCount >= retry.count) return false;
  return true;
}

// 读写超时分级:调用方显式传了正数 timeout 则以显式值为准;否则 GET 用读超时、
// 其余(写请求)用更宽的写超时。写请求已取消自动重试兜底,若仍沿用 10s,慢事务会被
// 误判失败,用户重复点击反而触发双写,故放宽到 30s 与之配套(审查修复 20261021 P1-4)。
export function resolveRequestTimeout(method?: string, explicit?: number): number {
  if (typeof explicit === 'number' && explicit > 0) return explicit;
  return String(method || '').toLowerCase() === 'get' ? READ_TIMEOUT_MS : WRITE_TIMEOUT_MS;
}

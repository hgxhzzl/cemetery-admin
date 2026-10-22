// 重试/超时策略口径用例(审查修复 20261021 P1-4):把“该不该重试”“超时给多少”从
// 拦截器里抽成纯函数后,这里把两条红线钉死——
// 1) 非 GET(写请求)任何失败都不得自动重试,防止服务端已提交事务后客户端盲重放造成重复入库;
// 2) 读写超时分级(读 10s / 写 30s),且调用方显式传 timeout 时以显式值为准。
import { describe, expect, it } from 'vitest';

import { resolveRequestTimeout, shouldRetry } from '@/utils/request/retryPolicy';

const RETRY = { count: 3, delay: 1000 };

describe('shouldRetry: 非 GET 不进重试', () => {
  it('幂等 GET 在网络错误(无 status)且未超次数时退避重试', () => {
    expect(shouldRetry({ method: 'get', retryCount: 0, retry: RETRY })).toBe(true);
    expect(shouldRetry({ method: 'get', retryCount: 2, retry: RETRY })).toBe(true);
  });

  it('幂等 GET 遇 5xx 可重试', () => {
    expect(shouldRetry({ method: 'get', status: 502, retryCount: 1, retry: RETRY })).toBe(true);
  });

  it('写请求(POST)无论网络错误/超时/5xx 一律不自动重试', () => {
    expect(shouldRetry({ method: 'post', retryCount: 0, retry: RETRY })).toBe(false);
    expect(shouldRetry({ method: 'post', status: undefined, retryCount: 0, retry: RETRY })).toBe(false);
    expect(shouldRetry({ method: 'post', status: 500, retryCount: 0, retry: RETRY })).toBe(false);
  });

  it('4xx 为确定性错误不重试', () => {
    expect(shouldRetry({ method: 'get', status: 400, retryCount: 0, retry: RETRY })).toBe(false);
    expect(shouldRetry({ method: 'get', status: 404, retryCount: 0, retry: RETRY })).toBe(false);
  });

  it('未配置 retry 或达到次数上限不再重试', () => {
    expect(shouldRetry({ method: 'get', retryCount: 0 })).toBe(false);
    expect(shouldRetry({ method: 'get', retryCount: 3, retry: RETRY })).toBe(false);
  });
});

describe('resolveRequestTimeout: 读写超时分级', () => {
  it('读请求(GET)用 10s,写请求(POST)及缺省用 30s', () => {
    expect(resolveRequestTimeout('get')).toBe(10 * 1000);
    expect(resolveRequestTimeout('post')).toBe(30 * 1000);
    expect(resolveRequestTimeout(undefined)).toBe(30 * 1000);
  });

  it('调用方显式传正数 timeout 时原样保留,0/缺失视为未设置回退分级', () => {
    expect(resolveRequestTimeout('post', 60 * 1000)).toBe(60 * 1000);
    expect(resolveRequestTimeout('get', 60 * 1000)).toBe(60 * 1000);
    expect(resolveRequestTimeout('get', 0)).toBe(10 * 1000);
  });
});

// extractServerError 口径用例(审查修复 20261021 P1-5):后端响应信封统一后失败体一定带 message
// (与兼容位 error 同值),前端必须优先读 message 并回落历史体 error,两处都读不到时返回空串,
// 由调用方 `extractServerError(e) || translate(...)` 回退通用词条。
import { describe, expect, it } from 'vitest';

import { extractServerError } from '@/utils/apiError';

const errorWith = (data: unknown) => ({ response: { data } }) as unknown as Error;

describe('extractServerError', () => {
  it('优先透出统一信封的 message', () => {
    expect(extractServerError(errorWith({ code: 400, message: '编号已被占用', error: '编号已被占用' }))).toBe(
      '编号已被占用',
    );
  });

  it('message 缺失时回落历史体的 error', () => {
    expect(extractServerError(errorWith({ error: '无权限: 新建墓位' }))).toBe('无权限: 新建墓位');
  });

  it('两者皆无时返回空串,交由调用方回退通用词条', () => {
    expect(extractServerError(errorWith({ code: 500 }))).toBe('');
    expect(extractServerError(new Error('network down'))).toBe('');
  });
});

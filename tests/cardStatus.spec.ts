import { describe, expect, it, vi } from 'vitest';

import { getCardStatusClass, isSold, isUnsold } from '@/utils/cardStatus';

// 切断 cardStatus → cardTheme → @/api/cardColor → request/store/router 的模块链，
// 使状态判定可在 node 环境（不引 jsdom）下直接导入
vi.mock('@/api/cardColor', () => ({ getCardColor: vi.fn() }));

// 后端下发的状态值就是这些枚举串（见 api/model 与卡片着色口径），单列出来便于改动时一眼看全
const UNSOLD = 'statusType.saleStatusEnum.unsold';
const SOLD = 'statusType.saleStatusEnum.sold';
const RESERVE = 'statusType.saleStatusEnum.reserve';
const RESERVED = 'statusType.reserveStatusEnum.reserved';

describe('cardStatus: 销售状态判定', () => {
  it('枚举串精确匹配，空值不误判', () => {
    expect(isUnsold(UNSOLD)).toBe(true);
    expect(isUnsold(SOLD)).toBe(false);
    expect(isUnsold(undefined)).toBe(false);
    expect(isSold(SOLD)).toBe(true);
    expect(isSold(RESERVE)).toBe(false);
  });
});

describe('cardStatus: 卡片状态类名下发', () => {
  it('空行返回空串（卡片回落默认白底细灰框）', () => {
    expect(getCardStatusClass('room', null)).toBe('');
    expect(getCardStatusClass('room', undefined)).toBe('');
  });

  it('未销售是"按页开关"态，未开开关时不着色', () => {
    const row = { saleStatus: UNSOLD };
    expect(getCardStatusClass('room', row)).toBe('');
    expect(getCardStatusClass('room', row, { withUnsold: true })).toBe('room-card--unsold');
  });

  it('已预定按 reserveStatus 命中，兼容历史写成 saleStatus=reserve 的存量行', () => {
    expect(getCardStatusClass('room', { reserveStatus: RESERVED })).toBe('room-card--reserved');
    // 历史脏值归入已预定而非未销售：这类行本就非 unsold，不影响各页按钮禁用判断
    expect(getCardStatusClass('room', { saleStatus: RESERVE }, { withUnsold: true })).toBe('room-card--reserved');
  });

  it('一张卡最多一个态：按 buried > sold、expired > buried 取优先级最高者', () => {
    expect(getCardStatusClass('room', { saleStatus: SOLD })).toBe('room-card--sold');
    expect(getCardStatusClass('room', { saleStatus: SOLD, deceased: '张三' })).toBe('room-card--buried');
    expect(getCardStatusClass('room', { saleStatus: SOLD, deceased: '张三', endDate: '2020-01-01' })).toBe(
      'room-card--expired',
    );
  });

  it('管理期到期"不含当天"：当天与未来日期都不算 expired', () => {
    const today = new Date();
    const sameDay = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(
      today.getDate(),
    ).padStart(2, '0')}`;
    expect(getCardStatusClass('room', { saleStatus: SOLD, endDate: sameDay })).toBe('room-card--sold');

    const future = new Date(today.getTime() + 30 * 86400000);
    const futureDay = `${future.getFullYear()}-${String(future.getMonth() + 1).padStart(2, '0')}-${String(
      future.getDate(),
    ).padStart(2, '0')}`;
    expect(getCardStatusClass('room', { saleStatus: SOLD, endDate: futureDay })).toBe('room-card--sold');

    const past = new Date(today.getTime() - 30 * 86400000);
    const pastDay = `${past.getFullYear()}-${String(past.getMonth() + 1).padStart(2, '0')}-${String(
      past.getDate(),
    ).padStart(2, '0')}`;
    expect(getCardStatusClass('room', { saleStatus: SOLD, endDate: pastDay })).toBe('room-card--expired');
  });

  it('endDate 空值不参与到期判定', () => {
    expect(getCardStatusClass('room', { saleStatus: SOLD, endDate: null })).toBe('room-card--sold');
    expect(getCardStatusClass('room', { saleStatus: SOLD, endDate: '' })).toBe('room-card--sold');
  });
});

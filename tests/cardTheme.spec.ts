import { describe, expect, it, vi } from 'vitest';

import {
  BORDER_DARKEN_STEP,
  CARD_COLOR_STATES,
  darkenColor,
  DEFAULT_CARD_COLORS,
  isCardStateEnabled,
  isHexColor,
  normalizeCardColors,
} from '@/utils/cardTheme';

// 切断 @/api/cardColor → @/utils/request → store/router 的模块链，
// 使配色纯函数可在 node 环境（不引 jsdom）下直接导入
vi.mock('@/api/cardColor', () => ({ getCardColor: vi.fn() }));

describe('cardTheme: 色值判定', () => {
  it('isHexColor 只接受 6 位十六进制', () => {
    expect(isHexColor('#00a870')).toBe(true);
    expect(isHexColor('#ABCDEF')).toBe(true);
    // 3 位简写 / 8 位带透明度 / 命名色 / 非字符串均判非法：脏值会让整片卡片失色，必须在提交前拦下
    expect(isHexColor('#abc')).toBe(false);
    expect(isHexColor('#00a8700')).toBe(false);
    expect(isHexColor('red')).toBe(false);
    expect(isHexColor(undefined)).toBe(false);
    expect(isHexColor(null)).toBe(false);
    expect(isHexColor(123456)).toBe(false);
  });
});

describe('cardTheme: 外框派生色', () => {
  it('同色相下调亮度，灰阶结果精确可复算', () => {
    // #808080 亮度 0.502 → 减 16 个百分点 → 0.342×255≈87 → 0x57
    expect(darkenColor('#808080')).toBe('#575757');
    expect(darkenColor('#808080', 0)).toBe('#808080');
  });

  it('黑为下限，非法色值原样返回', () => {
    expect(darkenColor('#000000')).toBe('#000000');
    expect(darkenColor('not-a-color')).toBe('not-a-color');
  });

  it('派生结果仍是合法大写十六进制且不等于原色', () => {
    const derived = darkenColor('#00a870');
    expect(isHexColor(derived)).toBe(true);
    expect(derived).toBe(derived.toUpperCase());
    expect(derived).not.toBe('#00A870');
  });

  it('加深步长常量被单点引用（改这一处即全局生效）', () => {
    expect(BORDER_DARKEN_STEP).toBe(16);
  });
});

describe('cardTheme: 库值与兜底值合并', () => {
  it('无配置行时逐字回到兜底配色（与 card-color.less :root 同值）', () => {
    // 这条断言锁定"拉取失败 / 未配置 == 历史那套色"的契约：
    // 一旦兜底路径改为现算派生边框，卡片外框会比 :root 更淡，属于可感知的视觉回归
    const config = normalizeCardColors(null);
    expect(Object.keys(config).sort()).toEqual([...CARD_COLOR_STATES].sort());
    CARD_COLOR_STATES.forEach((state) => {
      expect(config[state].color).toBe(DEFAULT_CARD_COLORS[state].color);
      expect(config[state].border).toBe(DEFAULT_CARD_COLORS[state].border);
      expect(config[state].isEnabled).toBe(true);
    });
    expect(normalizeCardColors({})).toEqual(config);
  });

  it('合法库值优先保留（含手工微调过的 border）', () => {
    const config = normalizeCardColors({
      sold: { color: '#123456', border: '#abcdef', isEnabled: false },
    });
    expect(config.sold).toEqual({ color: '#123456', border: '#ABCDEF', isEnabled: false });
    // 未配置的态仍走兜底
    expect(config.buried.color).toBe(DEFAULT_CARD_COLORS.buried.color);
  });

  it('只配了 color 没配 border 时按派生值现算', () => {
    const config = normalizeCardColors({ sold: { color: '#808080' } });
    expect(config.sold.border).toBe('#575757');
  });

  it('脏字段逐项回落默认，不会半截覆盖导致失色', () => {
    const config = normalizeCardColors({ sold: { color: 'emerald', border: '#zzzzzz' } } as any);
    expect(config.sold.color).toBe(DEFAULT_CARD_COLORS.sold.color);
    expect(isHexColor(config.sold.border)).toBe(true);
  });

  it('isEnabled 缺省视为启用，仅显式 false 才关闭', () => {
    expect(normalizeCardColors({ sold: { color: '#808080' } }).sold.isEnabled).toBe(true);
    expect(normalizeCardColors({ sold: { color: '#808080', isEnabled: undefined } }).sold.isEnabled).toBe(true);
    expect(normalizeCardColors({ sold: { color: '#808080', isEnabled: false } }).sold.isEnabled).toBe(false);
  });

  it('未拉取配置时五态全部参与着色', () => {
    CARD_COLOR_STATES.forEach((state) => {
      expect(isCardStateEnabled(state)).toBe(true);
    });
  });
});

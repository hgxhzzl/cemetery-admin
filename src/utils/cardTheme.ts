import { shallowRef } from 'vue';

import { getCardColor } from '@/api/cardColor';
import type { CardColorConfig, CardColorItem, CardColorState } from '@/api/model/cardColorModel';
import { logError } from '@/utils/logger';

// ============================================================
// 卡片状态配色：库表 card_color 的 JSON 值 → html 行内 CSS 变量
// 变量默认值定义在 style/card-color.less(:root)，此处只做覆盖：行内声明优先于样式表规则，
// 故无需 !important；清掉行内变量即回到默认色 20261011 新增
// ============================================================

// 五个状态与卡片外框状态类一一对应（unsold/reserved/sold/buried/expired），页面行序与着色优先级同此序 20261017 新增 reserved
export const CARD_COLOR_STATES: CardColorState[] = ['unsold', 'reserved', 'sold', 'buried', 'expired'];

// 外框加深步长：HSL 亮度绝对值下调 16 个百分点（定值，改这一处即全局生效）
// 例：#DBD53A → #A59F1F。外框只由底色派生，用户在页面上只调一个颜色，深浅天然协调 20261011 新增,
export const BORDER_DARKEN_STEP = 16;

// 兜底配色：与 card-color.less 的 :root 默认值逐字对应，接口异常/无配置时按此渲染，
// 保证「拉取失败」与「没配置」表现一致（都是历史那套色），不出现卡片失色 20261011 新增,
export const DEFAULT_CARD_COLORS: CardColorConfig = {
  unsold: { color: '#fcf6ef', border: '#fca678', isEnabled: true },
  // 已预定：浅黄底 + 金黄框（初始黄色，与未销售浅橙/已销售浅绿区分）20261017 新增
  reserved: { color: '#fdf6cf', border: '#e8cc3e', isEnabled: true },
  sold: { color: '#f4fef9', border: '#00a870', isEnabled: true },
  buried: { color: '#f4f8fe', border: '#0052d9', isEnabled: true },
  expired: { color: '#fce5e5', border: '#d54941', isEnabled: true },
};

const HEX_PATTERN = /^#[0-9a-f]{6}$/i;

// 合法 6 位十六进制色值判定（提交前拦截，脏值会让整片卡片失色）20261011 新增
export function isHexColor(value: unknown): value is string {
  return typeof value === 'string' && HEX_PATTERN.test(value);
}

function hexToRgb(hex: string): [number, number, number] {
  const num = Number.parseInt(hex.slice(1), 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function rgbToHex(r: number, g: number, b: number): string {
  const to2 = (v: number) =>
    Math.round(Math.min(255, Math.max(0, v)))
      .toString(16)
      .padStart(2, '0');
  return `#${to2(r)}${to2(g)}${to2(b)}`.toUpperCase();
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const lightness = (max + min) / 2;
  const delta = max - min;
  if (delta === 0) {
    return [0, 0, lightness];
  }
  const saturation = lightness > 0.5 ? delta / (2 - max - min) : delta / (max + min);
  let hue = 0;
  if (max === rn) {
    hue = ((gn - bn) / delta + (gn < bn ? 6 : 0)) / 6;
  } else if (max === gn) {
    hue = ((bn - rn) / delta + 2) / 6;
  } else {
    hue = ((rn - gn) / delta + 4) / 6;
  }
  return [hue, saturation, lightness];
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  if (s === 0) {
    const gray = l * 255;
    return [gray, gray, gray];
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const channel = (t: number) => {
    let value = t;
    if (value < 0) value += 1;
    if (value > 1) value -= 1;
    if (value < 1 / 6) return p + (q - p) * 6 * value;
    if (value < 1 / 2) return q;
    if (value < 2 / 3) return p + (q - p) * (2 / 3 - value) * 6;
    return p;
  };
  return [channel(h + 1 / 3) * 255, channel(h) * 255, channel(h - 1 / 3) * 255];
}

// 同色相加深：仅下调 HSL 亮度、色相与饱和度不变，非法色值原样返回 20261011 新增
export function darkenColor(hex: string, step = BORDER_DARKEN_STEP): string {
  if (!isHexColor(hex)) {
    return hex;
  }
  const [r, g, b] = hexToRgb(hex);
  const [h, s, l] = rgbToHsl(r, g, b);
  const [nr, ng, nb] = hslToRgb(h, s, Math.max(0, l - step / 100));
  return rgbToHex(nr, ng, nb);
}

// 库值与兜底值合并：逐态取字段，缺失/非法字段回落默认，杜绝半截 JSON 让卡片整片失色 20261011 新增
export function normalizeCardColors(
  raw: Partial<Record<CardColorState, Partial<CardColorItem>>> | null | undefined,
): CardColorConfig {
  const result = {} as CardColorConfig;
  CARD_COLOR_STATES.forEach((state) => {
    const item = raw?.[state] ?? {};
    const color = isHexColor(item.color) ? item.color.toUpperCase() : DEFAULT_CARD_COLORS[state].color;
    // border 由 color 派生：库里存的 border 仅在用户没改过 color 时才等于派生值，
    // 以库值优先保留手工微调空间，缺失/非法时现算 20261011 新增,
    const border = isHexColor(item.border) ? item.border.toUpperCase() : darkenColor(color);
    result[state] = {
      color,
      border,
      isEnabled: item.isEnabled !== false,
    };
  });
  return result;
}

// 当前生效配色（响应式）：卡片页类名下发处据此跳过未勾选的态，
// 初始值为兜底配色（四态全启用），拉取失败/未建表时行为与改造前一致 20261011 新增,
const cardColorConfig = shallowRef<CardColorConfig>(normalizeCardColors(null));

// 某态是否启用着色：供类名下发方（utils/cardStatus.ts）跳过未勾选的态、也供卡片页图例过滤
// （未参与判定的态在卡面上不会出现，图例留着反而误导）20261011 新增,
export function isCardStateEnabled(state: CardColorState): boolean {
  return cardColorConfig.value[state].isEnabled;
}

// 将配色写进 html 行内样式：未启用的状态回落到「不着色」——底色同卡片默认底、外框同默认细边框；
// 现行规则下未启用的态已不下发类名（见 getCardStatusClass），此处白底仅作兼容兜底 20261011 修改,
export function applyCardColors(config: CardColorConfig) {
  cardColorConfig.value = config;
  const root = document.documentElement;
  CARD_COLOR_STATES.forEach((state) => {
    const item = config[state];
    if (item.isEnabled) {
      root.style.setProperty(`--cms-card-${state}-bg`, item.color);
      root.style.setProperty(`--cms-card-${state}-border`, item.border);
    } else {
      root.style.setProperty(`--cms-card-${state}-bg`, 'var(--td-bg-color-container)');
      root.style.setProperty(`--cms-card-${state}-border`, 'var(--td-border-level-1-color)');
    }
  });
}

// 拉取并应用：模块级缓存避免每次路由跳转重复请求；接口失败保持 CSS 默认色（不阻塞业务页）20261011 新增
let applied = false;

export async function fetchAndApplyCardColors(force = false) {
  if (applied && !force) {
    return;
  }
  try {
    const { list } = await getCardColor();
    let config: CardColorConfig | null = null;
    if (list && list.length > 0) {
      config = normalizeCardColors(JSON.parse(list[0].configJson || '{}'));
    }
    // 无配置行时按兜底值写一遍行内变量，行为与不写一致，但避免后续误判为「未初始化」 20261011 新增,
    applyCardColors(config ?? normalizeCardColors(null));
    applied = true;
  } catch (e) {
    logError(e);
  }
}

// 保存成功后即时生效（卡片颜色页调用）：绕过缓存重新拉取 20261011 新增
export function reloadCardColors() {
  return fetchAndApplyCardColors(true);
}

// 退出登录时清缓存并抹掉行内变量：配色按库存储，不清会让下一个账号（可能另一个库）
// 在本次拉取失败时沿用上一个账号的颜色；抹掉后回到 CSS 默认色，与未登录状态一致 20261011 新增
export function resetCardThemeCache() {
  applied = false;
  cardColorConfig.value = normalizeCardColors(null);
  const root = document.documentElement;
  CARD_COLOR_STATES.forEach((state) => {
    root.style.removeProperty(`--cms-card-${state}-bg`);
    root.style.removeProperty(`--cms-card-${state}-border`);
  });
}

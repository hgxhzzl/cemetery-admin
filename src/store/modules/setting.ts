import keys from 'lodash/keys';
import { defineStore } from 'pinia';
import { Color } from 'tvision-color';

import type { TChartColor, TColorSeries } from '@/config/color';
import { DARK_CHART_COLORS, LIGHT_CHART_COLORS } from '@/config/color';
import STYLE_CONFIG from '@/config/style';
import { store } from '@/store';
import type { ModeType } from '@/types/interface';
import { generateColorMap, insertThemeStylesheet } from '@/utils/color';

// 显式声明字段类型，替代原 Record<string, any>（唯一系统性类型失真的收敛，审查清理 20261020）
export interface SettingState {
  showFooter: boolean;
  isSidebarCompact: boolean;
  showBreadcrumb: boolean;
  menuAutoCollapsed: boolean;
  mode: ModeType | 'auto';
  layout: string;
  splitMenu: boolean;
  sideMode: ModeType;
  isFooterAside: boolean;
  isSidebarFixed: boolean;
  isHeaderFixed: boolean;
  isUseTabsRouter: boolean;
  showHeader: boolean;
  brandTheme: string;
  showSettingPanel: boolean;
  colorList: TColorSeries;
  chartColors: TChartColor;
}

const state: SettingState = {
  ...STYLE_CONFIG,
  // STYLE_CONFIG 未 as const，字符串字段被拓宽为 string，此处按接口目标类型收回
  mode: STYLE_CONFIG.mode as ModeType | 'auto',
  sideMode: STYLE_CONFIG.sideMode as ModeType,
  showSettingPanel: false,
  colorList: {} as TColorSeries,
  chartColors: LIGHT_CHART_COLORS,
};

export type TState = SettingState;
export type TStateKey = keyof SettingState;

export const useSettingStore = defineStore('setting', {
  state: () => state,
  getters: {
    showSidebar: (state) => state.layout !== 'top',
    showSidebarLogo: (state) => state.layout === 'side',
    showHeaderLogo: (state) => state.layout !== 'side',
    displayMode: (state): ModeType => {
      if (state.mode === 'auto') {
        const media = window.matchMedia('(prefers-color-scheme:dark)');
        if (media.matches) {
          return 'dark';
        }
        return 'light';
      }
      return state.mode as ModeType;
    },
    displaySideMode: (state): ModeType => {
      return state.sideMode as ModeType;
    },
  },
  actions: {
    async changeMode(mode: ModeType | 'auto') {
      let theme = mode;

      if (mode === 'auto') {
        theme = this.getMediaColor();
      }
      const isDarkMode = theme === 'dark';

      document.documentElement.setAttribute('theme-mode', isDarkMode ? 'dark' : '');

      this.chartColors = isDarkMode ? DARK_CHART_COLORS : LIGHT_CHART_COLORS;
    },
    async changeSideMode(mode: ModeType) {
      const isDarkMode = mode === 'dark';

      document.documentElement.setAttribute('side-mode', isDarkMode ? 'dark' : '');
    },
    getMediaColor() {
      const media = window.matchMedia('(prefers-color-scheme:dark)');

      if (media.matches) {
        return 'dark';
      }
      return 'light';
    },
    changeBrandTheme(brandTheme: string) {
      const mode = this.displayMode;
      // 以主题色加显示模式作为键
      const colorKey = `${brandTheme}[${mode}]`;
      let colorMap = this.colorList[colorKey];
      // 如果不存在色阶，就需要计算
      if (colorMap === undefined) {
        const [{ colors: newPalette, primary: brandColorIndex }] = Color.getColorGradations({
          colors: [brandTheme],
          step: 10,
          remainInput: false, // 是否保留输入 不保留会矫正不合适的主题色
        });
        colorMap = generateColorMap(brandTheme, newPalette, mode, brandColorIndex);
        this.colorList[colorKey] = colorMap;
      }
      insertThemeStylesheet(brandTheme, colorMap, mode);
      document.documentElement.setAttribute('theme-color', brandTheme);
    },
    updateConfig(payload: Partial<TState>) {
      // keyof 联合类型下无法表达按同键读写的相关性（报 never 赋值错误），
      // 改走 Record 视图回写，键集仍由 TStateKey 约束
      const mutableState = this as unknown as Record<TStateKey, unknown>;
      for (const key in payload) {
        const value = payload[key as TStateKey];
        if (value !== undefined) {
          mutableState[key as TStateKey] = value;
        }
        if (key === 'mode') {
          this.changeMode(value as ModeType | 'auto');
        }
        if (key === 'sideMode') {
          this.changeSideMode(value as ModeType);
        }
        if (key === 'brandTheme') {
          this.changeBrandTheme(value as string);
        }
      }
    },
  },
  persist: {
    // chartColors 不再持久化：图表文字色改由 displayMode 实时决定，水合恢复的旧色板会与当前模式脱节、
    // 导致图表文字与卡片背景同色（时有时无），且无其他消费者 20260919 修复
    pick: [...keys(STYLE_CONFIG), 'colorList'],
  },
});

export function getSettingStore() {
  return useSettingStore(store);
}

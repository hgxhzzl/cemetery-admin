export type TColorToken = Record<string, string>;
export type TColorSeries = Record<string, TColorToken>;

// 中性色为设计固定值（图表文字/边框/容器背景），不随主题色变化；tvision-color 仅生成品牌色板，无中性色生成能力
// placeholderColor（图表轴标签/图例文字）与 TDesign --td-text-color-secondary 对齐，
// 与首页卡片小字同色：亮色 --td-font-gray-2 rgba(0,0,0,0.6) / 暗色 --td-font-white-2 rgba(255,255,255,0.55) 20260919 修改
export const LIGHT_CHART_COLORS = {
  textColor: 'rgba(0, 0, 0, 0.9)',
  placeholderColor: 'rgba(0, 0, 0, 0.6)',
  borderColor: '#dcdcdc',
  containerColor: '#fff',
};

export const DARK_CHART_COLORS = {
  textColor: 'rgba(255, 255, 255, 0.9)',
  placeholderColor: 'rgba(255, 255, 255, 0.55)',
  borderColor: '#5e5e5e',
  containerColor: '#242424',
};

export type TChartColor = typeof LIGHT_CHART_COLORS;

export const DEFAULT_COLOR_OPTIONS = [
  '#0052D9',
  '#0594FA',
  '#00A870',
  '#EBB105',
  '#ED7B2F',
  '#E34D59',
  '#ED49B4',
  '#834EC2',
];

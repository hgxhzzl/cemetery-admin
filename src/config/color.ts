export type TColorToken = Record<string, string>;
export type TColorSeries = Record<string, TColorToken>;

// 中性色为设计固定值（图表文字/边框/容器背景），不随主题色变化；tvision-color 仅生成品牌色板，无中性色生成能力
export const LIGHT_CHART_COLORS = {
  textColor: 'rgba(0, 0, 0, 0.9)',
  placeholderColor: 'rgba(0, 0, 0, 0.35)',
  borderColor: '#dcdcdc',
  containerColor: '#fff',
};

export const DARK_CHART_COLORS = {
  textColor: 'rgba(255, 255, 255, 0.9)',
  placeholderColor: 'rgba(255, 255, 255, 0.35)',
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

import type { MonthlySaleModel } from '@/api/dashboard';
import type { TChartColor } from '@/config/color';
import { t } from '@/locales/index';
import { getChartListColor } from '@/utils/color';

/**
 * 首页销售数量统计折线图：两区域 × 当年 1-12 月的销售记录数 20260914 新增
 *
 * @export
 * @param {MonthlySaleModel[]} [monthlySales]
 * @returns {*} dataSet
 */
export function getMonthlySalesDataSet({
  monthlySales = [],
  placeholderColor,
  borderColor,
}: { monthlySales?: MonthlySaleModel[] } & TChartColor) {
  // vue-i18n 不支持数组消息值（数组词条会被忽略、t() 返回 key 本身），月标签改用 month1~month12 独立词条 20260915 修改
  const monthLabels = Array.from({ length: 12 }, (_, index) => t(`pages.dashboardBase.chart.month${index + 1}`));
  const regions = [...new Set(monthlySales.map((item) => item.region))];

  const dataSet = {
    color: getChartListColor(),
    tooltip: {
      trigger: 'axis',
    },
    grid: {
      left: '0',
      right: '20px',
      top: '40px',
      bottom: '36px',
      containLabel: true,
    },
    legend: {
      left: 'center',
      bottom: '0',
      orient: 'horizontal',
      icon: 'rect',
      itemWidth: 12,
      itemHeight: 4,
      itemGap: 48,
      textStyle: {
        fontSize: 12,
        color: placeholderColor,
      },
    },
    xAxis: {
      type: 'category',
      data: monthLabels,
      boundaryGap: false,
      axisLabel: {
        color: placeholderColor,
      },
      axisLine: {
        lineStyle: {
          width: 1,
        },
      },
    },
    yAxis: {
      type: 'value',
      minInterval: 1,
      axisLabel: {
        color: placeholderColor,
      },
      splitLine: {
        lineStyle: {
          color: borderColor,
        },
      },
    },
    series: regions.map((region) => ({
      name: region,
      type: 'line',
      data: monthLabels.map((_, index) => {
        const month = String(index + 1).padStart(2, '0');
        return monthlySales.find((item) => item.region === region && item.month === month)?.count ?? 0;
      }),
      smooth: false,
      showSymbol: true,
      symbol: 'circle',
      symbolSize: 8,
      areaStyle: {
        opacity: 0.1,
      },
    })),
  };
  return dataSet;
}

import { request } from '@/utils/request';

const Api = {
  querySummary: '/dashboard-query/summary',
};

// 首页区域名称行：用于两张销售记录卡片标题前缀 20260914 新增
export interface DashboardRegionModel {
  label: string;
  value: string;
}

// 首页月销售行：区域 × 月份（01-12）的销售记录数
export interface MonthlySaleModel {
  region: string;
  month: string;
  count: number;
}

// 首页周销售明细行：本周（周一至周日）逐条销售记录 20260915 修改
// 字段：idSale（行主键）/区域（卡片过滤用）/园区/编号/实际价格/购买人/日期
export interface WeeklySaleModel {
  idSale: number;
  region: string;
  park: string;
  xyNumber: string;
  realPrice: number | string;
  payer: string;
  createDate: string;
}

// 首页指标按区域分解行：第一行卡片内的小字（如「九泉山：¥20,000」）20260915 新增
export interface RegionStatModel {
  region: string;
  v: number;
}

// 首页统计聚合：4 卡片数值 + 按月/按周×区域 20260914 新增
// 4 卡片各配一个按区域分解数组，供卡片内小字行展示区域合计 20260915 新增
export interface DashboardSummaryModel {
  regions: DashboardRegionModel[];
  yearSales: number;
  yearFees: number;
  yearBuriedCount: number;
  reservedBuriedCount: number;
  monthlySales: MonthlySaleModel[];
  weeklySales: WeeklySaleModel[];
  yearSalesByRegion: RegionStatModel[];
  yearFeesByRegion: RegionStatModel[];
  yearBuriedCountByRegion: RegionStatModel[];
  reservedBuriedCountByRegion: RegionStatModel[];
}

// 首页统计聚合（当前页激活时调用刷新）
export function getDashboardSummary() {
  return request.get<DashboardSummaryModel>({
    url: Api.querySummary,
  });
}

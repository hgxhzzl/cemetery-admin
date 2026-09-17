import { request } from '@/utils/request';

const Api = {
  querySaleQuery: '/saleQuery/list',
};

// 墓区销售查询行数据：销售单关联墓位 20260911 修改
// 命名规范：类型 PascalCase、函数 camelCase 20260912 优化
export interface SaleQueryModel {
  idSale: number;
  idRoom: number;
  region: string;
  park: string;
  xyNumber: string;
  price: number;
  realPrice: number;
  payer: string;
  payerPhone: string;
  createDate: string;
}

export interface ListSaleQueryResult {
  list: SaleQueryModel[];
  // 总记录数，供分页组件使用 20260911 新增
  total: number;
  // 金额合计（实际售价 realPrice 总和，后端 SUM 返回）20260913 新增
  totalAmount: number;
}

// 按区域/园区/时间段分页查询销售单明细 20260911 修改
export function getSaleQueryList(params: Record<string, unknown>) {
  return request.get<ListSaleQueryResult>({
    url: Api.querySaleQuery,
    params,
  });
}

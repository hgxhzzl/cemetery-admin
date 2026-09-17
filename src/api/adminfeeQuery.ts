import { request } from '@/utils/request';

const Api = {
  queryAdminfeeQuery: '/adminfeeQuery/list',
};

// 管理收款查询行数据：收款记录关联墓位 20260912 新增
// 命名规范：类型 PascalCase、函数 camelCase
export interface AdminfeeQueryModel {
  idAdminfee: number;
  idRoom: number;
  region: string;
  park: string;
  xyNumber: string;
  // 缴费年限（库 int）
  termYears: number;
  // 缴费周期开始日期
  startDate: string;
  // 缴费周期结束日期
  endDate: string;
  // 收款金额（库 int）
  payAmount: number;
  // 付款人
  payer: string;
  // 付款人电话：库列名原始拼写为 payePrhone（建表笔误），SELECT 返回同名键，模型字段与之对齐
  payePrhone: string;
  // 经办人（操作人名）
  operator: string;
  createDate: string;
}

export interface ListAdminfeeQueryResult {
  list: AdminfeeQueryModel[];
  // 总记录数，供滚动加载判断是否还有下一页
  total: number;
  // 金额合计（收款金额 payAmount 总和，后端 SUM 返回）20260913 新增
  totalAmount: number;
}

// 按区域/园区/收款时间段分页查询收款记录明细 20260912 新增
export function getAdminfeeQueryList(params: Record<string, unknown>) {
  return request.get<ListAdminfeeQueryResult>({
    url: Api.queryAdminfeeQuery,
    params,
  });
}

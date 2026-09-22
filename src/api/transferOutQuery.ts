import { request } from '@/utils/request';

const Api = {
  queryTransferOutQuery: '/transferOut-query/list',
};

// 墓位迁出查询行数据：迁出记录关联墓位 20260921 新增
// 命名规范：类型 PascalCase、函数 camelCase
export interface TransferOutQueryModel {
  idTransfer: number;
  idRoom: number;
  region: string;
  park: string;
  xyNumber: string;
  // 迁出日期
  transferOutDate: string;
  // 迁往何处
  destination: string;
  // 原因
  reason: string;
  // 联系人
  contacts: string;
  // 联系人电话：库中实际列名为 contactsphone(全小写)，SELECT 返回同名键，模型字段与之对齐
  contactsphone: string;
  // 经办人（操作人名）
  operator: string;
  createDate: string;
}

export interface ListTransferOutQueryResult {
  list: TransferOutQueryModel[];
  // 总记录数，供滚动加载判断是否还有下一页
  total: number;
}

// 按区域/园区/迁出日期时间段分页查询迁出记录明细 20260921 新增
export function getTransferOutQueryList(params: Record<string, unknown>) {
  return request.get<ListTransferOutQueryResult>({
    url: Api.queryTransferOutQuery,
    params,
  });
}

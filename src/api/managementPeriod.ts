import { request } from '@/utils/request';

const Api = {
  queryManagementPeriod: '/managementPeriod/list',
  updateManagementPeriod: '/managementPeriod-save/update',
};

// 管理期限行数据：room 表 endDate 落在筛选时间段内的墓位 20260915 新增
// 命名规范：类型 PascalCase、函数 camelCase
export interface ManagementPeriodModel {
  idRoom: number;
  region: string;
  park: string;
  // 墓区编号
  xyNumber: string;
  // 管理费结束日期：筛选依据与列表展示字段
  endDate: string;
  // 联系人：room.contacts 聚合列
  contacts: string;
  // 联系人电话：后端从 contacts 表聚合活动记录电话（空格分隔）
  contactsPhone: string;
}

export interface ListManagementPeriodResult {
  list: ManagementPeriodModel[];
  // 总记录数，供滚动加载判断是否还有下一页
  total: number;
}

// 修改管理期限提交参数：原结束日期仅作存档，新结束日期写入 room.endDate 并新增 period_change 记录 20260915 新增
export interface PeriodChangeParams {
  idRoom: number;
  // 原结束日期
  oldEndDate: string;
  // 新结束日期
  newEndDate: string;
  // 变更原因
  reason: string;
}

// 按区域/园区/结束日期时间段分页查询管理期限明细 20260915 新增
export function getManagementPeriodList(params: Record<string, unknown>) {
  return request.get<ListManagementPeriodResult>({
    url: Api.queryManagementPeriod,
    params,
  });
}

// 修改管理期限：后端事务内新增 period_change 记录并更新 room.endDate 20260915 新增
export function updateManagementPeriod(data: PeriodChangeParams) {
  return request.post({
    url: Api.updateManagementPeriod,
    data,
  });
}

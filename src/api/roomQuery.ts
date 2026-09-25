import { request } from '@/utils/request';

const Api = {
  queryRoomQuery: '/roomQuery/list',
};

// 墓位信息查询行数据：墓位主体关联活动销售记录 20260924 新增
// 命名规范：类型 PascalCase、函数 camelCase 20260912 优化
export interface RoomQueryModel {
  idRoom: number;
  region: string;
  park: string;
  xyNumber: string;
  buyer: string;
  payerPhone: string | null;
  createDate: string | null;
  deceased: string;
  contacts: string;
  // 接口返回迁出状态供勾选过滤定位，列表不展示该列 20260924 修改
  transferOutStatus: string;
}

export interface ListRoomQueryResult {
  list: RoomQueryModel[];
  // 总记录数，供滚动加载判断是否还有下一页 20260924 新增
  total: number;
}

// 按区域/园区/销售日期范围分页查询墓位信息明细 20260924 新增
export function getRoomQueryList(params: Record<string, unknown>) {
  return request.get<ListRoomQueryResult>({
    url: Api.queryRoomQuery,
    params,
  });
}

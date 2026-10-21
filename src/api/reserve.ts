import { request } from '@/utils/request';

const Api = {
  queryReserve: '/reserve-query',
  deleteReserve: '/reserve-delete',
  insertReserve: '/reserve-save/insert',
  updateReserve: '/reserve-save/update',
};

// 预定记录数据模型 20260907 新增
export interface ReserveModel {
  idReserve: number;
  idRoom: number;
  liaison: string;
  liaisonPhone: string;
  // 预定限期（库列 reserve.reservationExpireDate，datetime）：到期未付款则预定失效、墓位可再次销售；
  // 后端回传 ISO 串，展示/回填统一用 formatDate 取日期部分 20261011 新增 20261011 由 endDate 改名,
  reservationExpireDate: string;
  remark: string;
  operator: string;
  isDeleted: number;
  modifyDate: string;
  createDate: string;
}

export interface ListReserveResult {
  list: ReserveModel[];
}

// 新增预定接口
export function insertReserve(data: Partial<ReserveModel>) {
  return request.post({
    url: Api.insertReserve,
    data,
  });
}

// 修改预定接口 20260907 新增
export function updateReserve(data: Partial<ReserveModel>) {
  return request.post({
    url: Api.updateReserve,
    data,
  });
}

// 按墓位查询当前活动预定记录，用于修改回填 20260907 新增
export function getReserveByRoom(idRoom: number) {
  return request.get<ListReserveResult>({
    url: `${Api.queryReserve}/get-by-room`,
    params: { idRoom },
  });
}

// 取消/删除预定接口 20260907 新增
export function deleteReserve(idRoom: number) {
  // 破坏性写操作改 POST,参数进 body 不进 URL 20261021 审查修复 P0-1,
  return request.post<ListReserveResult>({
    url: Api.deleteReserve,
    data: { idRoom },
  });
}

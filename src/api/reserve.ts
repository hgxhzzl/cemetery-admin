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
    url: `${Api.queryReserve}/get-by-room?idRoom=${idRoom}`,
  });
}

// 取消/删除预定接口 20260907 新增
export function deleteReserve(idRoom: number) {
  return request.get<ListReserveResult>({
    url: `${Api.deleteReserve}?idRoom=${idRoom}`,
  });
}

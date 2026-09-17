import type { StatusResult, TreesResult } from '@/api/model/model';
import type { ListRoomResult, RoomModel } from '@/api/model/roomModel';
import { request } from '@/utils/request';

const Api = {
  deleteRoom: '/room-delete',
  insertRoom: '/room-save/insert',
  updateRoom: '/room-save/update',
  queryRoom: '/room-query/',
};

// 状态接口
export function getTypeList() {
  return request.get<StatusResult>({
    url: `${Api.queryRoom}/status`,
  });
}

// 列表接口
export function getRoomList(park: string, region: string) {
  return request.get<ListRoomResult>({
    url: `${Api.queryRoom}/room?park=${park}&region=${region}`,
  });
}

export function getCanSaleList(park: string, region: string) {
  return request.get<ListRoomResult>({
    url: `${Api.queryRoom}/canSale?park=${park}&region=${region}`,
  });
}

// 状态接口
export function getTreeList() {
  return request.get<TreesResult>({
    url: `${Api.queryRoom}/parkTree`,
  });
}
// 新增接口
export function insertRoom(data: Partial<RoomModel>) {
  return request.post({
    url: Api.insertRoom,
    data,
  });
}
// 修改接口
export function updateRoom(data: Partial<RoomModel>) {
  return request.post({
    url: Api.updateRoom,
    data,
  });
}
// 列表接口
export function getIdList(idRoom: number) {
  return request.get<ListRoomResult>({
    url: `${Api.queryRoom}/idList?idRoom=${idRoom}`,
  });
}
// 删除接口
export function deleteRoom(idRoom: number) {
  return request.get<ListRoomResult>({
    url: `${Api.deleteRoom}?idRoom=${idRoom}`,
  });
}

import type { ListRoomResult, RoomModel } from '@/api/model/roomModel';
import { request } from '@/utils/request';

const Api = {
  deleteRoom: '/room-delete',
  insertRoom: '/room-save/insert',
  updateRoom: '/room-save/update',
  queryRoom: '/room-query/',
};

// 模板遗留的状态/树接口 getTypeList、getTreeList 全仓库零调用（枚举改由 statusType.* 词条 + 各页下拉数据源提供），20261003 清理删除

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

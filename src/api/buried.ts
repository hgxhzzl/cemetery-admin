import type { BuriedListResult, BuriedModel } from '@/api/model/buriedModel';
import type { ListRoomResult } from '@/api/model/roomModel';
import { request } from '@/utils/request';

const Api = {
  deleteBuried: '/buried-delete',
  insertBuried: '/buried-save/insert',
  updateBuried: '/buried-save/update',
  queryBuried: '/buried-query/',
};

// 列表接口
export function getRoomList(park: string, region: string) {
  return request.get<ListRoomResult>({
    url: `${Api.queryBuried}/room?park=${park}&region=${region}`,
  });
}
// 新增接口
export function insertBuried(data: Partial<BuriedModel>) {
  return request.post({
    url: Api.insertBuried,
    data,
  });
}
// 列表接口Room
export function getBuriedList(idRoom: number) {
  return request.get<BuriedListResult>({
    url: `${Api.queryBuried}?idRoom=${idRoom}`,
  });
}
// 修改接口
export function updateBuried(data: Partial<BuriedModel>) {
  return request.post({
    url: Api.updateBuried,
    data,
  });
}
// 删除下葬记录接口(按选中的 idBuried 软删除,并回写墓位下葬状态) 20260907 新增
export function deleteBuried(idBuried: number, idRoom: number) {
  return request.get<BuriedListResult>({
    url: `${Api.deleteBuried}?idBuried=${idBuried}&idRoom=${idRoom}`,
  });
}

import type { AdminfeeListResult, AdminfeeModel } from '@/api/model/adminfeeModel';
import type { ListRoomResult } from '@/api/model/roomModel';
import { request } from '@/utils/request';

const Api = {
  deleteAdminfee: '/adminfee-delete',
  insertAdminfee: '/adminfee-save/insert',
  updateAdminfee: '/adminfee-save/update',
  queryAdminfee: '/adminfee-query/',
};

// 卡片列表接口：按园区+区域查询墓位（与墓区下葬页共用同一套 room 数据）20260909 新增
export function getRoomList(park: string, region: string) {
  return request.get<ListRoomResult>({
    url: `${Api.queryAdminfee}/room?park=${park}&region=${region}`,
  });
}
// 新增管理费收款记录接口 20260909 新增
export function insertAdminfee(data: Partial<AdminfeeModel>) {
  return request.post({
    url: Api.insertAdminfee,
    data,
  });
}
// 按墓位查询管理费收款记录接口 20260909 新增
export function getAdminfeeList(idRoom: number) {
  return request.get<AdminfeeListResult>({
    url: `${Api.queryAdminfee}?idRoom=${idRoom}`,
  });
}
// 修改管理费收款记录接口 20260909 新增
export function updateAdminfee(data: Partial<AdminfeeModel>) {
  return request.post({
    url: Api.updateAdminfee,
    data,
  });
}
// 删除管理费收款记录接口（按选中的 idAdminfee 软删除）20260909 新增
export function deleteAdminfee(idAdminfee: number, idRoom: number) {
  return request.get<AdminfeeListResult>({
    url: `${Api.deleteAdminfee}?idAdminfee=${idAdminfee}&idRoom=${idRoom}`,
  });
}

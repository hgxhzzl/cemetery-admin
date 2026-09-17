import type { ContactsListResult, ContactsModel } from '@/api/model/contactsModel';
import type { ListRoomResult } from '@/api/model/roomModel';
import { request } from '@/utils/request';

const Api = {
  deleteContacts: '/contacts-delete',
  insertContacts: '/contacts-save/insert',
  updateContacts: '/contacts-save/update',
  queryContacts: '/contacts-query/',
};

// 卡片列表接口：按园区+区域查询墓位（与墓区下葬页共用同一套 room 数据）20260909 新增
export function getRoomList(park: string, region: string) {
  return request.get<ListRoomResult>({
    url: `${Api.queryContacts}/room?park=${park}&region=${region}`,
  });
}
// 新增墓位联系人记录接口 20260909 新增
export function insertContacts(data: Partial<ContactsModel>) {
  return request.post({
    url: Api.insertContacts,
    data,
  });
}
// 按墓位查询联系人记录接口 20260909 新增
export function getContactsList(idRoom: number) {
  return request.get<ContactsListResult>({
    url: `${Api.queryContacts}?idRoom=${idRoom}`,
  });
}
// 修改墓位联系人记录接口 20260909 新增
export function updateContacts(data: Partial<ContactsModel>) {
  return request.post({
    url: Api.updateContacts,
    data,
  });
}
// 删除墓位联系人记录接口（按选中的 idContacts 软删除）20260909 新增
export function deleteContacts(idContacts: number, idRoom: number) {
  return request.get<ContactsListResult>({
    url: `${Api.deleteContacts}?idContacts=${idContacts}&idRoom=${idRoom}`,
  });
}

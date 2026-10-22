// 墓位联系登记页（菜单 103105）已于 20261021 三轮下线：/api/contacts-save/*、/api/contacts-delete
// 已从后端注册表摘除，联系人的增删改统一走 @/api/gravePlotBusiness（联系人形态）；
// 本模块只保留墓位详情聚合的按墓位取数（管理费用收款、迁出等页也复用这一条）。
import type { ContactsListResult } from '@/api/model/contactsModel';
import { request } from '@/utils/request';

const Api = {
  queryContacts: '/contacts-query/',
};

// 按墓位查询活动联系人记录 20260909 新增
export function getContactsList(idRoom: number) {
  return request.get<ContactsListResult>({
    url: Api.queryContacts,
    params: { idRoom },
  });
}

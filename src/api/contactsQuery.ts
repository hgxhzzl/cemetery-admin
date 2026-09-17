import { request } from '@/utils/request';

const Api = {
  queryContactsQuery: '/contactsQuery/list',
};

// 墓位联系查询行数据：联系人记录关联墓位 20260913 新增
// 命名规范：类型 PascalCase、函数 camelCase
export interface ContactsQueryModel {
  idContacts: number;
  idRoom: number;
  region: string;
  park: string;
  xyNumber: string;
  // 联系人姓名
  contacts: string;
  // 联系人电话：库中实际列名为 contactsPhone(大写 P，区别于 buried 表的 contactsphone 小写)，SELECT 返回同名键，模型字段与之对齐
  contactsPhone: string;
  // 联系人身份证号
  contactsIDCard: string;
  remark: string;
}

export interface ListContactsQueryResult {
  list: ContactsQueryModel[];
  // 总记录数，供滚动加载判断是否还有下一页
  total: number;
}

// 按关键词多字段模糊分页查询联系人记录明细 20260913 新增
export function getContactsQueryList(params: Record<string, unknown>) {
  return request.get<ListContactsQueryResult>({
    url: Api.queryContactsQuery,
    params,
  });
}

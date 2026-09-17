// 公共数据模型
export interface ContactsListResult {
  list: Array<ContactsModel>;
}
export interface ContactsModel {
  idContacts: number;
  idRoom: number;
  // 操作人名，后端写入，前端只读展示 20260909 新增
  operator: string;
  // 联系人
  contacts: string;
  // 联系人电话，原列名 phone，数据库列名改为 contactsPhone 20260912 修改
  contactsPhone: string;
  // 身份证号
  contactsIDCard: string;
  // 备注，详情联系人卡片展示 20260912 新增
  remark: string;
}

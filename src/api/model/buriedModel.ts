// 公共数据模型
export interface BuriedListResult {
  list: Array<BuriedModel>;
}
export interface BuriedModel {
  idBuried: number;
  idRoom: number;
  // 安葬者姓名，原列名 burier，数据库列名改为 deceased 20260912 修改,
  deceased: string;
  // 安葬者身份证号，原列名 burierIDCard，数据库列名改为 deceasedIDCard 20260912 修改,
  deceasedIDCard: string;
  // 逝者关系（与安葬者关系），下葬/销售形态录入，详情表格展示 20260925 新增
  deceasedRelation: string;
  burialDate: string;
  // 联系人电话：库中实际列名为 contactsphone(全小写)，SELECT * 返回同名键，模型字段与之对齐 20260909 修改,
  contactsphone: string;
  contacts: string;
  // 联系人身份证号：库列 contactsIDCard，修改回填与详情展示 20260917 新增
  contactsIDCard: string;
  remark: string;
  // 经办人（操作人名），后端保存时自动写入，详情表格展示 20260912 新增
  operator: string;
  // 创建日期，详情表格展示并格式化为 YYYY-MM-DD 20260912 新增
  createDate: string;
}

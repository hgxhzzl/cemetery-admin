export const FIND_DATA = {
  yNum: '',
  region: '',
  park: '',
  roomType: '',
  // 排序方向：对排号 yNum 升/降序，默认降序 20260925 新增
  sortOrder: 'desc',
};

export const INITIAL_ROOM_DATA = {
  idRoom: 0,
  yNum: '',
  reserveStatus: '',
  saleStatus: '',
  intoStatus: '',
  roomType: '',
  region: '',
  park: '',
  xNum: '',
  // 墓位编号，开单页墓位信息行展示 20260901 新增,
  xyNumber: '',
  price: 0,
  specs: '',
  repairStatus: '',
};
// 墓位业务登记初始数据：代码独立但数据表复用原有表（sale/reserve/graveplotbusiness 按形态选表）20260923 修改
export const INITIAL_BUSINESS_DATA = {
  idBusiness: 0,
  idRoom: 0,
  realPrice: 0,
  realPriceString: '',
  payer: '',
  payerPhone: '',
  remark: '',
  // 付款人扩展字段 20260901 新增,
  payerIDCard: '',
  // 收款人与编号字段 20260918 新增,
  payee: '',
  serialNo: '',
  // 安葬者四字段：销售形态随开单同步 buried 表；下葬形态直接读写 buried 表 20260923 修改 20260924 新增逝者关系,
  deceased: '',
  burialDate: '',
  deceasedIDCard: '',
  // 逝者关系：仅销售形态表单录入，保存到 buried.deceasedRelation 20260924 新增,
  deceasedRelation: '',
  // 下葬形态联系人三字段：直接对应 buried 表列(contacts/contactsphone/contactsIDCard) 20260923 新增,
  contacts: '',
  contactsphone: '',
  contactsIDCard: '',
  // 业务创建日期：修改回填用，票据编号取 yyyymmdd 前缀 20260922 新增,
  createDate: '',
};

export interface SelectModel {
  value: string;
  label: string;
}

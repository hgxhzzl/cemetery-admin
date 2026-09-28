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
  // 墓位卡号，票据编号后缀取该值 20260926 新增,
  cardno: '',
  // 购墓人：安葬证设置只读字段“持证人”默认值取该列 20260928 新增,
  buyer: '',
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
  // 业务创建日期：修改回填用，票据编号取 yyyymm 前缀 20260922 新增,
  createDate: '',
};

export interface SelectModel {
  value: string;
  label: string;
}

// 安葬证设置初始数据（数据表 burial_cert：编号/持证人/电话/逝者关系/下葬与合葬日期/安葬者A-D/工作单位/单位电话/住址）
// idBusiness 承载 burial_cert 主键 idCert，0 为新建 20260927 新增
export const INITIAL_CERT_DATA = {
  idBusiness: 0,
  idRoom: 0,
  serialNo: '',
  certHolder: '',
  certHolderPhone: '',
  deceasedRelation: '',
  burialDate: '',
  jointBurialDate: '',
  deceasedA: '',
  deceasedB: '',
  // 等分（安葬者B分位单选：'1'一分/'2'二分/'3'三分）落 burial_cert.equalDivision，默认选一分
  // （一分时安葬者C/D隐藏、二分时D隐藏、三分全显）20260928 修改
  equalDivision: '1',
  deceasedC: '',
  deceasedD: '',
  workplace: '',
  workPhone: '',
  homeAddress: '',
};

export const FIND_DATA = {
  yNum: '',
  region: '',
  park: '',
  roomType: '',
};

export const INITIAL_ROOM_DATA = {
  idRoom: 0,
  yNum: '',
  saleStatus: '',
  intoStatus: '',
  roomType: '',
  region: '',
  park: '',
  xNum: '',
  // 墓位编号，修改页墓位信息行展示 20260909 新增,
  xyNumber: '',
  price: 0,
  specs: '',
  repairStatus: '',
};

// 墓位联系人表单初始值：仅联系人/电话/身份证号，无金额与日期字段（区别于管理费收款）20260909 新增
export const INITIAL_CONTACTS_DATA = {
  idContacts: 0,
  idRoom: 0,
  // 联系人
  contacts: '',
  // 联系人电话
  contactsPhone: '',
  // 身份证号
  contactsIDCard: '',
};

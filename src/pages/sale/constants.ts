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
  // 墓位编号，开单页墓位信息行展示 20260901 新增,
  xyNumber: '',
  price: 0,
  specs: '',
  repairStatus: '',
};
export const INITIAL_SALE_DATA = {
  idSale: 0,
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
  // 销售创建日期：修改回填用，票据编号取 yyyymmdd 前缀 20260922 新增,
  createDate: '',
};

export interface SelectModel {
  value: string;
  label: string;
}

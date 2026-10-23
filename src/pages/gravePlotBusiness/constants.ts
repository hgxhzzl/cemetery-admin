import type { InjectionKey, Ref } from 'vue';

// 业务登记表单形态：销售/联系人（业务登记）/预定/下葬/备注 20261020 P2 S2 拆分导出供子视图 props 复用
export type BusinessFormMode = 'sale' | 'business' | 'reserve' | 'buried' | 'remark';

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
  // 墓位编号（原卡号 cardno，20261003 随 room 列重命名为 serialNo），票据编号后缀取该值 20260926 新增,
  serialNo: '',
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
  // 预定限期（库列 reserve.reservationExpireDate）：仅预定形态录入，必填，日期控件只认 yyyy-MM-dd 20261023 新增,
  reservationExpireDate: '',
  remark: '',
  // 付款人扩展字段 20260901 新增,
  payerIDCard: '',
  // 收款人与编号字段 20260918 新增,
  payee: '',
  serialNo: '',
  // 安葬者四字段：销售形态随开单同步 buried 表；下葬形态直接读写 buried 表 20260923 修改 20260924 新增逝者关系,
  deceased: '',
  // 死亡日期（库列 buried.deathDate）：仅销售形态表单录入，非必填、不加星，未选时提交空串由后端归一为 null 20261011 新增,
  deathDate: '',
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

// 业务登记表单数据注入键：供拆出的下葬字段子视图（BuriedFormView）经 inject 共享页面 formBusinessData，
// 保持页面持有状态的单向数据流（子视图仅渲染/编辑字段，提交/校验/联系人选择仍留页面）20261020 P2 S2 拆分
export const businessFormDataKey: InjectionKey<Ref<typeof INITIAL_BUSINESS_DATA>> = Symbol(
  'gravePlotBusinessFormBusinessData',
);

// 联系人（业务登记）表单数据：contacts 表三字段 + 主键/墓位，供拆出的联系人子视图共享 20261020 P2 S2 拆分
export interface ContactsFormData {
  idContacts: number;
  idRoom: number;
  contacts: string;
  contactsPhone: string;
  contactsIDCard: string;
}
// 联系人表单数据注入键：供 ContactsFormView 子视图经 inject 共享页面 formContactsData（提交/校验/电话过滤仍留页面）20261020 P2 S2 拆分
export const contactsFormDataKey: InjectionKey<Ref<ContactsFormData>> = Symbol('gravePlotBusinessFormContactsData');

// 墓位备注表单数据：单字段备注（room.remark），供拆出的备注子视图共享 20261020 P2 S2 拆分
export interface RemarkFormData {
  idRoom: number;
  remark: string;
}
// 备注表单数据注入键：供 RemarkFormView 子视图经 inject 共享页面 formRemarkData（保存/返回仍留页面）20261020 P2 S2 拆分
export const remarkFormDataKey: InjectionKey<Ref<RemarkFormData>> = Symbol('gravePlotBusinessFormRemarkData');

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

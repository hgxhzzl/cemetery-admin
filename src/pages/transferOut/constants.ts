import dayjs from 'dayjs';
import type { InjectionKey, Ref } from 'vue';

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
  saleStatus: '',
  intoStatus: '',
  roomType: '',
  region: '',
  park: '',
  xNum: '',
  // 墓位编号，修改页墓位信息行展示 20260916 新增,
  xyNumber: '',
  price: 0,
  specs: '',
  repairStatus: '',
  // 迁出状态：未迁出/已迁出，卡片标签与登记表单墓位信息行展示 20260916 新增,
  transferOutStatus: '',
};

// 迁出登记表单初始值：idTransfer 为 0 表示新增，迁出日期默认当天 20260916 新增
export const INITIAL_FORM_DATA = {
  idTransfer: 0,
  idRoom: 0,
  transferOutDate: dayjs().format('YYYY-MM-DD'),
  // 迁往何处：库列 destination 20260916 新增,
  destination: '',
  // 原因：库列 reason 20260916 新增,
  reason: '',
  contacts: '',
  // 联系人电话：库列 contactsphone(全小写) 20260916 新增,
  contactsphone: '',
  // 联系人身份证号：库列 contactsIDCard，非必填最长 18 位，联系人选择按钮回填/手动录入 20261005 新增,
  contactsIDCard: '',
};

// 迁出状态兜底：存量墓位 transferOutStatus 为 NULL（空），展示时取“未迁出”词条键 20261020 从页面下沉供拆出子组件共享
export const NOT_OUT = 'statusType.transferOutStatusEnum.notOut';

// 迁出登记表单数据注入键：供 TransferOutFormView 子视图经 inject 共享页面 formTransferOutData（提交/回填仍留页面）20261020 P2 S2 拆分
export const transferOutFormDataKey: InjectionKey<Ref<typeof INITIAL_FORM_DATA>> = Symbol('transferOutFormData');

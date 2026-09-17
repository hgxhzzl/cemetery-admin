import dayjs from 'dayjs';

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
  // 墓位编号，修改页墓位信息行展示 20260916 新增,
  xyNumber: '',
  price: 0,
  specs: '',
  repairStatus: '',
  // 迁出状态：未迁出/已迁出，卡片标签与登记表单墓穴信息行展示 20260916 新增,
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
};

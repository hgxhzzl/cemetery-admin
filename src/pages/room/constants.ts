// 列表筛选表单初始值，参照墓区销售页改为区域/园区/排号三项 20260828 修改,
export const FIND_DATA = {
  region: '',
  park: '',
  yNum: '',
};

export const INITIAL_DATA = {
  idRoom: 0,
  yNum: '',
  yNumTo: '',
  saleStatus: '',
  reserveStatus: '',
  intoStatus: '',
  // 迁出状态，由迁出业务流转维护，新建默认未迁出 20260916 新增,
  transferOutStatus: '',
  roomType: '',
  region: '',
  park: '',
  xNum: '',
  xNumTo: '',
  // 墓位编号，单条修改时可编辑保存 20260831 新增,
  xyNumber: '',
  // 购买人 varchar(20)，新建/修改可填写 20260912 新增,
  buyer: '',
  // 安葬者 varchar(100)，新建/修改可填写 20260912 新增,
  deceased: '',
  // 联系人 varchar(200)，新建/修改可填写 20260913 新增,
  contacts: '',
  price: 0,
  specs: '',
  repairStatus: '',
};

export interface SelectModel {
  value: string;
  label: string;
}

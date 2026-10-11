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
  // 墓位编号，修改页墓位信息行展示 20260907 新增,
  xyNumber: '',
  price: 0,
  specs: '',
  repairStatus: '',
};
export const INITIAL_SALE_DATA = {
  idBuried: 0,
  idRoom: 0,
  // 安葬者姓名，原库列名 burier，改为 deceased 20260912 修改,
  deceased: '',
  // 安葬者身份证号，原库列名 burierIDCard，改为 deceasedIDCard 20260912 修改,
  deceasedIDCard: '',
  // 死亡日期（库列 buried.deathDate）：非必填、不加星，未选时提交空串由后端归一为 null 20261011 新增,
  deathDate: '',
  burialDate: '',
  // 联系人/联系人电话：contacts 对应库列 contacts，contactsphone 对应库列 contactsphone(全小写) 20260909 新增,
  contacts: '',
  contactsphone: '',
  // 联系人身份证号：库列 contactsIDCard，非必填，与联系人电话同行展示 20260917 新增,
  contactsIDCard: '',
  remark: '',
  // 费用金额 cost/costString、状态位 isPay/isFinish/isReady/isFull 均已从库表删除，payload 不再包含 20260909 修改,
};

export interface SelectModel {
  value: string;
  label: string;
}

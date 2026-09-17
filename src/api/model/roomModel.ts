// 公共数据模型
export interface ListRoomResult {
  list: Array<RoomModel>;
}

export interface RoomResult {
  list: Array<RoomModel>;
}
export interface StatusModel {
  [x: string]: any;
  value: string;
  label: string;
  type: string;
}

export interface RoomModel {
  idRoom: number;
  xNum: string;
  xNumTo: string;
  yNum: string;
  yNumTo: string;
  // 墓位编号，卡片列表首行展示 20260831 新增,
  xyNumber: string;
  // 购买人 varchar(20) 20260912 新增,
  buyer: string;
  // 安葬者 varchar(100)，可多人以空格分隔 20260912 新增,
  deceased: string;
  // 联系人 varchar(200)，存所有联系人 20260913 新增,
  contacts: string;
  price: number;
  cardno: string;
  operator: string;
  modifyDate: string;
  createDate: string;
  isDeleted: number;
  roomType: string;
  saleStatus: string;
  // 预定状态：未预定/已预定 20260902 新增,
  reserveStatus: string;
  repairStatus: string;
  intoStatus: string;
  // 迁出状态：未迁出/已迁出，由迁出业务流转维护，前端展示与表单只读 20260916 新增,
  transferOutStatus: string;
  park: string;
  region: string;
  specs: string;
  // 管理费开始/结束日期：后端在下葬/收款事务中维护（开始=最早下葬日期，结束=收款顺延），前端仅展示 20260910 新增,
  startDate: string;
  endDate: string;
}

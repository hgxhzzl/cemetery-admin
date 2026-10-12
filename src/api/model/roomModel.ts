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
  // 购墓人 varchar(20) 20260912 新增,
  buyer: string;
  // 安葬者 varchar(100)，可多人以空格分隔 20260912 新增,
  deceased: string;
  // 联系人 varchar(200)，存所有联系人 20260913 新增,
  contacts: string;
  price: number;
  // 墓位编号：原列 cardno（卡号），20261003 数据库 room 列重命名为 serialNo，字段标题统一"编号",
  serialNo: string;
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
  // 备注：墓位业务页卡片底部展示 20261002 新增,
  remark: string;
  // 预定限期（库列 room.reservationExpireDate，datetime）：活动预定记录的限期副本，由后端在预定登记/修改/取消事务中同步，
  // 无活动预定时为 NULL（展示“未填写”），前端只读不可编辑 20261011 新增,
  reservationExpireDate: string | null;
  // 预定人/预定人电话：/canSale LEFT JOIN 活动预定记录带出（预定页卡片“预定人/手机号”行），无活动预定时为 null 20261012 新增,
  reserveLiaison: string | null;
  reserveLiaisonPhone: string | null;
}

export const FIND_DATA = {
  yNum: '',
  region: '',
  park: '',
  // 排序方向：对排号 yNum 升/降序展示卡片行组，默认降序，同墓区业务页 20261010 新增
  sortOrder: 'desc',
};

export const INITIAL_ROOM_DATA = {
  idRoom: 0,
  yNum: '',
  saleStatus: '',
  reserveStatus: '',
  intoStatus: '',
  roomType: '',
  region: '',
  park: '',
  xNum: '',
  xyNumber: '',
  price: 0,
  specs: '',
  repairStatus: '',
};

export const INITIAL_RESERVE_DATA = {
  idReserve: 0,
  idRoom: 0,
  liaison: '',
  liaisonPhone: '',
  // 预定限期(reserve.reservationExpireDate)：必填，提交格式 yyyy-MM-dd 20261011 新增 20261011 由 endDate 改名
  reservationExpireDate: '',
  remark: '',
};

export interface SelectModel {
  value: string;
  label: string;
}

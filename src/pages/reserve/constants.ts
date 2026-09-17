export const FIND_DATA = {
  yNum: '',
  region: '',
  park: '',
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
  remark: '',
};

export interface SelectModel {
  value: string;
  label: string;
}

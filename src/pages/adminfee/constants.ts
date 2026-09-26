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
  // 墓位编号，修改页墓位信息行展示 20260909 新增,
  xyNumber: '',
  // 墓位卡号，票据编号后缀取该值 20260922 新增,
  cardno: '',
  price: 0,
  specs: '',
  repairStatus: '',
  // 管理费开始/结束日期：仅展示（后端在下葬/收款事务中维护），getRoomID 回填 SELECT * 自动带出 20260910 新增,
  startDate: '',
  endDate: '',
};

// 管理费收款表单初始值：payAmount/termYears 为数字，startDate/endDate 自动派生（首次下葬 / 顺延）不入手工录入 20260909 新增
export const INITIAL_FEE_DATA = {
  idAdminfee: 0,
  idRoom: 0,
  // 付款人
  payer: '',
  // 付款人电话：库列名原始拼写为 payePrhone（建表笔误），payload 键须与库列一致 20260909 新增
  payePrhone: '',
  // 收款金额
  payAmount: 0,
  // 开始日期：自动取该墓位首次下葬时间
  startDate: '',
  // 结束日期：自动 = 开始日期顺延缴费年限年
  endDate: '',
  // 缴费年限
  termYears: 0,
  remark: '',
};

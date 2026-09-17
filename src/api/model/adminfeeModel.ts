// 公共数据模型
export interface AdminfeeListResult {
  list: Array<AdminfeeModel>;
}
export interface AdminfeeModel {
  idAdminfee: number;
  idRoom: number;
  // 操作人名，后端写入，前端只读展示 20260909 新增
  operator: string;
  // 付款人
  payer: string;
  // 付款人电话：库列名原始拼写为 payePrhone（建表笔误），model/payload 键须与库列一致 20260909 新增
  payePrhone: string;
  // 收款金额（库 int）
  payAmount: number;
  // 开始日期：自动取该墓位首次下葬时间
  startDate: string;
  // 结束日期：自动 = 开始日期顺延缴费年限年
  endDate: string;
  // 缴费年限（库 int）
  termYears: number;
  remark: string;
  // 创建日期，详情表格展示并格式化为 YYYY-MM-DD 20260912 新增
  createDate: string;
}

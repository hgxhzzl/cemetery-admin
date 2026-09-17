// 区域数据模型
export interface SelectResult {
  list: Array<SelectModel>;
}
export interface SelectModel {
  value: number;
  label: string;
}
// 园区数据模型
export interface ListParkResult {
  list: Array<ListParkModel>;
}
export interface ListParkModel {
  value: string;
  label: string;
  region: string;
}

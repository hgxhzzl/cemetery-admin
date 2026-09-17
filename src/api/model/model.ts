// 公共数据模型
export interface StatusResult {
  list: Array<StatusModel>;
}
export interface StatusModel {
  value: string;
  label: string;
  type: string;
}

export interface SelectModel {
  value: number;
  label: string;
}

// 公共数据模型
export interface TreesResult {
  list: Array<TreeModel>;
}
export interface TreeModel {
  value: string;
  label: string;
  parent: string;
}

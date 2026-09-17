// 标签设置数据模型
export interface ListTagSetResult {
  list: Array<ListTagSetModel>;
}
export interface ListTagSetModel {
  dutiesNumber: number;
  teamNumber: number;
  regionNumber: number;
}

// 标签信息数据模型
export interface ListTagInfoResult {
  list: Array<ListTagInfoModel>;
}
export interface ListTagInfoModel {
  tagName: string;
  tagType: string;
}

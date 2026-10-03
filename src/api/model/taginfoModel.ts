// 标签设置数据模型
export interface ListTagSetResult {
  list: Array<ListTagSetModel>;
}
export interface ListTagSetModel {
  dutiesNumber: number;
  teamNumber: number;
  // 逝者关系标签数量上限（tagset 表新增列，选择设置页逝者关系行 20261003 新增）
  deceasedRelationNumber: number;
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

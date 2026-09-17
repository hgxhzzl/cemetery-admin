import { request } from '@/utils/request';

const Api = {
  queryBuriedQuery: '/buriedQuery/list',
};

// 墓区下葬查询行数据：下葬记录关联墓位 20260912 新增
// 命名规范：类型 PascalCase、函数 camelCase
export interface BuriedQueryModel {
  idBuried: number;
  idRoom: number;
  region: string;
  park: string;
  xyNumber: string;
  // 安葬者姓名
  deceased: string;
  // 安葬者身份证号
  deceasedIDCard: string;
  // 下葬日期
  burialDate: string;
  // 联系人
  contacts: string;
  // 联系人电话：库中实际列名为 contactsphone(全小写)，SELECT 返回同名键，模型字段与之对齐
  contactsphone: string;
  remark: string;
  // 经办人（操作人名）
  operator: string;
  createDate: string;
}

export interface ListBuriedQueryResult {
  list: BuriedQueryModel[];
  // 总记录数，供滚动加载判断是否还有下一页
  total: number;
}

// 按区域/园区/下葬时间段分页查询下葬记录明细 20260912 新增
export function getBuriedQueryList(params: Record<string, unknown>) {
  return request.get<ListBuriedQueryResult>({
    url: Api.queryBuriedQuery,
    params,
  });
}

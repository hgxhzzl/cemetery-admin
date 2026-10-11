import { request } from '@/utils/request';

const Api = {
  queryBuriedQuery: '/buriedQuery/list',
};

// 墓区下葬查询行数据：下葬记录关联墓位与销售 20260912 新增 20261011 加墓位类型/死亡日期/销售列
// 命名规范：类型 PascalCase、函数 camelCase
export interface BuriedQueryModel {
  idBuried: number;
  idRoom: number;
  region: string;
  park: string;
  xyNumber: string;
  // 墓位类型(room.roomType)：库中存的是 i18n key(如 statusType.roomTypeEnum.double),展示前需翻译 20261011 新增
  roomType: string;
  // 安葬者姓名
  deceased: string;
  // 安葬者身份证号
  deceasedIDCard: string;
  // 死亡日期(buried.deathDate) 20261011 新增
  deathDate: string | null;
  // 下葬日期
  burialDate: string;
  // 销售价格(sale.realPrice)：未销售墓位无活动销售记录,该列为 null 20261011 新增
  realPrice: number | null;
  // 销售日期(sale.createDate)：后端改名 saleDate,避开与本行的创建日期(下葬登记时间)冲突 20261011 新增
  saleDate: string | null;
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

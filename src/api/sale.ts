// 墓区销售登记页（菜单 103102）已于 20261021 三轮下线：新建/修改/作废接口
// （/api/sale-save/*、/api/sale-delete）已从后端注册表摘除，销售写操作统一走
// @/api/gravePlotBusiness（购墓人形态与取消销售），本模块只保留墓位详情聚合用的按墓位取数。
import { request } from '@/utils/request';

const Api = {
  querySale: '/sale-query',
};

// 销售记录数据模型 20260907 新增
export interface SaleModel {
  idSale: number;
  idRoom: number;
  operator: string;
  realPrice: number;
  payer: string;
  payerPhone: string;
  remark: string;
  payerIDCard: string;
  // 收款人与编号字段 20260918 新增
  payee: string;
  serialNo: string;
  isDeleted: number;
  modifyDate: string;
  createDate: string;
}

export interface ListSaleResult {
  list: SaleModel[];
}

// 按墓位查询当前活动销售记录，供墓位详情卡片展示销售信息 20260907 新增
export function getSaleByRoom(idRoom: number) {
  return request.get<ListSaleResult>({
    url: `${Api.querySale}/get-by-room`,
    params: { idRoom },
  });
}

import { request } from '@/utils/request';

const Api = {
  querySale: '/sale-query',
  deleteSale: '/sale-delete',
  insertSale: '/sale-save/insert',
  updateSale: '/sale-save/update',
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

// 新增接口
export function insertSale(data: Partial<SaleModel>) {
  return request.post({
    url: Api.insertSale,
    data,
  });
}

// 修改销售接口 20260907 新增
export function updateSale(data: Partial<SaleModel>) {
  return request.post({
    url: Api.updateSale,
    data,
  });
}

// 按墓位查询当前活动销售记录，用于修改回填 20260907 新增
export function getSaleByRoom(idRoom: number) {
  return request.get<ListSaleResult>({
    url: `${Api.querySale}/get-by-room`,
    params: { idRoom },
  });
}

// 删除销售接口 20260907 新增
export function deleteSale(idRoom: number) {
  // 破坏性写操作改 POST,参数进 body 不进 URL 20261021 审查修复 P0-1,
  return request.post<ListSaleResult>({
    url: Api.deleteSale,
    data: { idRoom },
  });
}

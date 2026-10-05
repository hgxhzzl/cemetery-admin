import type { RoomModel } from '@/api/model/roomModel';
import { request } from '@/utils/request';

const Api = {
  queryTransferOut: '/transferOut-query',
  insertTransferOut: '/transferOut-save/insert',
  updateTransferOut: '/transferOut-save/update',
  deleteTransferOut: '/transferOut-delete',
};

// 墓位迁出行数据：迁出记录关联墓位 20260916 新增
// 命名规范：类型 PascalCase、函数 camelCase
export interface TransferOutModel {
  idTransfer: number;
  idRoom: number;
  region: string;
  park: string;
  xyNumber: string;
  // 迁出日期
  transferOutDate: string;
  // 迁往何处
  destination: string;
  // 原因
  reason: string;
  // 联系人
  contacts: string;
  // 联系人电话：库中实际列名为 contactsphone(全小写)，SELECT 返回同名键，模型字段与之对齐
  contactsphone: string;
  // 联系人身份证号：库列 contactsIDCard，迁出登记表单录入/联系人选择回填 20261005 新增
  contactsIDCard: string;
  // 经办人（操作人名）
  operator: string;
  createDate: string;
}

// 分页查询迁出记录明细的旧封装（getTransferOutList + ListTransferOutResult）已被独立接口
// @/api/transferOutQuery -> getTransferOutQueryList 取代，前端零调用，20261003 清理删除
// （后端 /transferOut-query/list 路由随之成为孤儿接口，待后端侧确认处置）20261003 备注

// 按区域+园区查询墓位列表（与下葬页一致，区域必传由路由 meta 下发）20260916 新增
export function getTransferOutRoomList(park: string, region: string) {
  return request.get<{ list: Array<RoomModel> }>({
    url: `${Api.queryTransferOut}/room?park=${park}&region=${region}`,
  });
}

// 按墓位查询全部活动迁出记录（供修改/删除时选择记录）20260916 新增
export function getTransferOutListByIdRoom(idRoom: number) {
  return request.get<{ list: TransferOutModel[] }>({
    url: `${Api.queryTransferOut}?idRoom=${idRoom}`,
  });
}

// 新增迁出记录（后端事务内同步置 room.transferOutStatus 为已迁出）20260916 新增
export function insertTransferOut(data: Partial<TransferOutModel>) {
  return request.post({
    url: Api.insertTransferOut,
    data,
  });
}

// 修改迁出记录 20260916 新增
export function updateTransferOut(data: Partial<TransferOutModel>) {
  return request.post({
    url: Api.updateTransferOut,
    data,
  });
}

// 删除迁出记录：按 idTransfer 软删除，无剩余活动记录时回置 room.transferOutStatus 为未迁出 20260916 新增
export function deleteTransferOut(idTransfer: number, idRoom: number) {
  return request.get<{ code: number }>({
    url: `${Api.deleteTransferOut}?idTransfer=${idTransfer}&idRoom=${idRoom}`,
  });
}

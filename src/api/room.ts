import type { ListRoomResult, RoomModel } from '@/api/model/roomModel';
import { request } from '@/utils/request';

const Api = {
  deleteRoom: '/room-delete',
  insertRoom: '/room-save/insert',
  updateRoom: '/room-save/update',
  queryRoom: '/room-query/',
};

// 模板遗留的状态/树接口 getTypeList、getTreeList 全仓库零调用（枚举改由 statusType.* 词条 + 各页下拉数据源提供），20261003 清理删除

// 列表接口
// 口径：park/region 等文本自由参数一律走 axios params 对象序列化（自动 URL 编码），
// 不再手工拼 query string（含 &/#/+ 等字符的园区/区域名会损坏参数）20261019 审查修正；
// 各模块同型列表接口已一并改为此写法
export function getRoomList(park: string, region: string) {
  return request.get<ListRoomResult>({
    url: `${Api.queryRoom}/room`,
    params: { park, region },
  });
}

export function getCanSaleList(park: string, region: string) {
  return request.get<ListRoomResult>({
    url: `${Api.queryRoom}/canSale`,
    params: { park, region },
  });
}

// 批量建位结果(审查修复 20261021 P1-5):后端统一信封把 affectedRows 与实建/跳过行数一同放入 data
// 下发(request 的 transformRequestHook 只返回 data),用于向用户回放被静默跳过的重复坐标,
export interface RoomBatchCreateResult {
  affectedRows: number;
  created: number;
  skipped: number;
}

// 新增接口
export function insertRoom(data: Partial<RoomModel>) {
  return request.post<RoomBatchCreateResult>({
    url: Api.insertRoom,
    data,
  });
}
// 修改接口
export function updateRoom(data: Partial<RoomModel>) {
  return request.post({
    url: Api.updateRoom,
    data,
  });
}
// 列表接口
export function getIdList(idRoom: number) {
  return request.get<ListRoomResult>({
    url: `${Api.queryRoom}/idList`,
    params: { idRoom },
  });
}
// 删除接口
// 破坏性写操作统一走 POST(参数进 body 不进 URL):避免被预取/爬虫/日志以及历史记录直接触发, 20261021 审查修复 P0-1,
export function deleteRoom(idRoom: number) {
  return request.post<ListRoomResult>({
    url: Api.deleteRoom,
    data: { idRoom },
  });
}

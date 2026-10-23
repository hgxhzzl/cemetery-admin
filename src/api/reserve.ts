import { request } from '@/utils/request';

const Api = {
  queryReserve: '/reserve-query',
};

// 预定记录数据模型 20260907 新增
export interface ReserveModel {
  idReserve: number;
  idRoom: number;
  liaison: string;
  liaisonPhone: string;
  // 预定限期（库列 reserve.reservationExpireDate，datetime）：到期未付款则预定失效、墓位可再次销售；
  // 后端回传 ISO 串，展示/回填统一用 formatDate 取日期部分 20261011 新增 20261011 由 endDate 改名,
  reservationExpireDate: string;
  remark: string;
  operator: string;
  isDeleted: number;
  modifyDate: string;
  createDate: string;
}

export interface ListReserveResult {
  list: ReserveModel[];
}

// 按墓位查询当前活动预定记录，用于修改回填 20260907 新增
// 独立预定页(菜单 103104)下线后本文件只保留详情聚合取数:预定的新建/修改/删除统一走
// /api/gravePlotBusiness-{save,delete}(type=reserve) 20261023 调整,
export function getReserveByRoom(idRoom: number) {
  return request.get<ListReserveResult>({
    url: `${Api.queryReserve}/get-by-room`,
    params: { idRoom },
  });
}

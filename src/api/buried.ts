// 墓区下葬登记页（菜单 103103）已于 20261021 三轮下线：/api/buried-save/*、/api/buried-delete
// 已从后端注册表摘除，单条下葬记录的增删改统一走 @/api/gravePlotBusiness（下葬者形态）；
// 本模块只保留墓位详情聚合的按墓位取数（管理费收款、迁出等页也复用这一条）。
import type { BuriedListResult } from '@/api/model/buriedModel';
import { request } from '@/utils/request';

const Api = {
  queryBuried: '/buried-query/',
};

// 按墓位查询全部活动下葬记录（供详情卡片“多次下葬”列表展示）20260907 新增
export function getBuriedList(idRoom: number) {
  return request.get<BuriedListResult>({
    url: Api.queryBuried,
    params: { idRoom },
  });
}

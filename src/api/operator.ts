import type {
  ListCountResult,
  ListOperatorResult,
  ListPowerResult,
  OperatorModel,
  SelectResult,
} from '@/api/model/operatorModel';
import { request } from '@/utils/request';

const Api = {
  queryOperator: '/operator-query',
  deleteOperator: '/operator-delete',
  insertOperator: '/operator-save/insert',
  updateOperator: '/operator-save/update',
  updateOperatorPower: '/operatorPower-save/power',
  queryOperatorPower: '/operatorPower-query/power',
  updatePassword: '/operator-save/password',
};
// 列表接口
export function getAllList() {
  return request.get<ListOperatorResult>({
    url: Api.queryOperator,
  });
}
// 列表接口
export function getIdList(idOperator: number) {
  return request.get<ListOperatorResult>({
    url: `${Api.queryOperator}/id`,
    params: { idOperator },
  });
}

// 删除接口
export function deleteOperator(idOperator: number) {
  // 破坏性写操作改 POST,参数进 body 不进 URL 20261021 审查修复 P0-1,
  return request.post<ListOperatorResult>({
    url: Api.deleteOperator,
    data: { idOperator },
  });
}

// 新增接口
// 后端不再以手机号作初始口令:未提交口令时随机生成,仅在这一次响应里回显明文 20261021 配合审查修复 中E,
export function insertOperator(data: Partial<OperatorModel>) {
  return request.post<{ initialPassword?: string }>({
    url: Api.insertOperator,
    data,
  });
}

// 修改接口
export function updateOperator(data: Partial<OperatorModel>) {
  return request.post({
    url: Api.updateOperator,
    data,
  });
}
// 职务接口
export function getDutiesList() {
  return request.get<SelectResult>({
    url: `${Api.queryOperator}/duties`,
  });
}

// 团队接口
export function getTeamList() {
  return request.get<SelectResult>({
    url: `${Api.queryOperator}/team`,
  });
}
// 区域接口：操作员分配区域用，返回全量区域（不走 /park-query/region 的本操作员收窄）20261012 新增
export function getOperatorRegionList() {
  return request.get<SelectResult>({
    url: `${Api.queryOperator}/region`,
  });
}
// 模板遗留的运维接口 getMaintenanceList 全仓库零调用，20261003 清理删除
// 修改密码（后端 /operator-save/password：成功返回 data=1，旧密码错误/用户不存在返回 data=0）
export function updatePassword(data: { idOperator: number; oldPassword: string; newPassword: string }) {
  return request.post<number>({
    url: Api.updatePassword,
    data,
  });
}
// 权限
export function getOperatorPowerList(idOperator: number) {
  return request.get<ListPowerResult>({
    url: Api.queryOperatorPower,
    params: { idOperator },
  });
}
// 权限
export function updatePower(data: { idPower: number; field: string }) {
  return request.post({
    url: Api.updateOperatorPower,
    data,
  });
}

// 电话存在
export function getHavePhone(idOperator: number, phone: string) {
  return request.get<ListCountResult>({
    url: `${Api.queryOperator}/havePhone`,
    // phone 不再手工 encodeURIComponent:axios 序列化 params 时会统一编码,双重编码反而会把已编码值原样发出,
    params: { idOperator, phone },
  });
}

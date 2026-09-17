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
    url: `${Api.queryOperator}/id?idOperator=${idOperator}`,
  });
}

// 删除接口
export function deleteOperator(idOperator: number) {
  return request.get<ListOperatorResult>({
    url: `${Api.deleteOperator}?idOperator=${idOperator}`,
  });
}

// 新增接口
export function insertOperator(data: Partial<OperatorModel>) {
  return request.post({
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
// 运维接口
export function getMaintenanceList() {
  return request.get<ListOperatorResult>({
    url: `${Api.queryOperator}/maintenance`,
  });
}
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
    url: `${Api.queryOperatorPower}?idOperator=${idOperator}`,
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
    url: `${Api.queryOperator}/havePhone?idOperator=${idOperator}&phone=${encodeURIComponent(phone)}`,
  });
}

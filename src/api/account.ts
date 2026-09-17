import type { ListAccountPowerResult, ListAccountResult } from '@/api/model/accountModel';
import type { ListResult } from '@/api/model/contractModel';
import { request } from '@/utils/request';

const Api = {
  queryAccount: '/account-query',
  deleteAccount: '/account-delete',
  insertAccount: '/account-save/insert',
  updateAccount: '/account-save/update',
  queryAccountPower: '/accountPower-query/power',
  updateAccountPower: '/accountPower-save/power',
  createDataBase: '/account-save/createDataBase',
};
// 列表接口
export function getAllList() {
  return request.get<ListAccountResult>({
    url: Api.queryAccount,
  });
}
// 列表接口
export function getIdList(idAccount: number) {
  return request.get<ListAccountResult>({
    url: `${Api.queryAccount}?idAccount=${idAccount}`,
  });
}

// 列表接口
export function getNameList(account: string) {
  return request.get<ListAccountResult>({
    url: `${Api.queryAccount}?account=${account}`,
  });
}
// 删除接口
export function deleteAccount(idAccount: number) {
  return request.get<ListResult>({
    url: `${Api.deleteAccount}?idAccount=${idAccount}`,
  });
}
// 新增账户（后端接收 JSON 字符串）
export function insertAccount(data: string) {
  return request.post({
    url: Api.insertAccount,
    data,
  });
}

// 修改账户（后端接收 JSON 字符串）
export function updateAccount(data: string) {
  return request.post({
    url: Api.updateAccount,
    data,
  });
}
// 账户权限
export function getAccountPowerList(dataBaseName: string, account: string) {
  return request.get<ListAccountPowerResult>({
    url: `${Api.queryAccountPower}?dataBaseName=${dataBaseName}&account=${account}`,
  });
}

// 更新权限
export function updateAccountPower(data: { idMenu: string; dataBaseName: string }) {
  return request.post({
    url: Api.updateAccountPower,
    data,
  });
}

// 新数据库 后端事务接口返回 {code, affectedRows} 无data字段，需跳过默认响应转换避免误报失败 20260827联调修复,
export function CreateDataBase(data: { dataBaseName: string }) {
  return request.post<{ code: number; affectedRows?: number }>(
    {
      url: Api.createDataBase,
      data,
    },
    { isTransformResponse: false },
  );
}

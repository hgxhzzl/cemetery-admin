import type { ListResult, SelectResult } from '@/api/model/contractModel';
import { request } from '@/utils/request';

const Api = {
  queryContract: '/contract-query',
  deleteContract: '/contract-delete',
  insertContract: '/contract-save/insert',
  updateContract: '/contract-save/update',
};
// 列表接口
export function getAllList() {
  return request.get<ListResult>({
    url: Api.queryContract,
  });
}
// ID查找接口
export function getIdList(idContract: number) {
  return request.get<ListResult>({
    url: Api.queryContract,
    params: { idContract },
  });
}

// 名称查找接口
export function getNameList(contractName: string) {
  return request.get<ListResult>({
    url: Api.queryContract,
    // 中文合同名此前被直接拼进 URL(未编码),现交给 axios 序列化,
    params: { contractName },
  });
}

// 删除接口
export function deleContract(idContract: number) {
  // 破坏性写操作改 POST,参数进 body 不进 URL 20261021 审查修复 P0-1,
  return request.post<ListResult>({
    url: Api.deleteContract,
    data: { idContract },
  });
}

// 合同甲方
export function getPartyAList() {
  return request.get<SelectResult>({
    url: `${Api.queryContract}/partyA`,
  });
}

// 合同乙方
export function getPartyBList() {
  return request.get<SelectResult>({
    url: `${Api.queryContract}/partyB`,
  });
}
// 新增接口（后端接收 JSON 字符串）
export function insertContract(data: string) {
  return request.post({
    url: Api.insertContract,
    data,
  });
}

// 修改接口（后端接收 JSON 字符串）
export function updateContract(data: string) {
  return request.post({
    url: Api.updateContract,
    data,
  });
}

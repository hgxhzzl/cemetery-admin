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
    url: `${Api.queryContract}?idContract=${idContract}`,
  });
}

// 名称查找接口
export function getNameList(contractName: string) {
  return request.get<ListResult>({
    url: `${Api.queryContract}?contractName=${contractName}`,
  });
}

// 删除接口
export function deleContract(idContract: number) {
  return request.get<ListResult>({
    url: `${Api.deleteContract}?idContract=${idContract}`,
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

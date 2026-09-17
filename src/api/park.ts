import type { ListParkResult, SelectResult } from '@/api/model/parkModel';
import { request } from '@/utils/request';

const Api = {
  queryRegion: '/park-query/region',
  queryPark: '/park-query/park',
  insertPark: '/park-save/insert',
};
// 区域接口
export function getRegionList() {
  return request.get<SelectResult>({
    url: Api.queryRegion,
  });
}
// 批量新增园区：payload 为 { park, region } 数组
export function insertPark(data: Array<{ park: string; region: string }>) {
  return request.post({
    url: Api.insertPark,
    data,
  });
}
// 标签列表
export function getParkList() {
  return request.get<ListParkResult>({
    url: Api.queryPark,
  });
}

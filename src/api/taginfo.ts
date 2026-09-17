import type { ListTagInfoResult, ListTagSetResult } from '@/api/model/taginfoModel';
import { request } from '@/utils/request';

const Api = {
  queryTagSet: '/taginfo-query/tagset',
  queryTagInfo: '/taginfo-query/taginfo',
  insertTaginfo: '/taginfo-save/insert',
};
// 列表接口
export function getSetList() {
  return request.get<ListTagSetResult>({
    url: Api.queryTagSet,
  });
}
// 批量新增标签
export function insertTag(data: Array<{ tagName: string; tagType: string }>) {
  return request.post({
    url: Api.insertTaginfo,
    data,
  });
}
// 标签列表
export function getTagList() {
  return request.get<ListTagInfoResult>({
    url: Api.queryTagInfo,
  });
}

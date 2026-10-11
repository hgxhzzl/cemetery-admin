import type { CardColorConfig, ListCardColorResult } from '@/api/model/cardColorModel';
import { request } from '@/utils/request';

const Api = {
  queryColor: '/cardColor-query/color',
  saveColor: '/cardColor-save/color',
};

// 查询卡片配色：整库一套(同库多区域共用)，无配置行时返回空 list，前端按默认色渲染 20261011 新增
export function getCardColor() {
  return request.get<ListCardColorResult>({
    url: Api.queryColor,
  });
}

// 保存卡片配色：后端只做更新(库里恒一条初始化记录)，四态字段整体覆盖 20261011 新增
export function saveCardColor(config: CardColorConfig) {
  return request.post({
    url: Api.saveColor,
    data: { config },
  });
}

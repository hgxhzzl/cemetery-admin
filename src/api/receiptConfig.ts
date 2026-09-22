import type { ListReceiptConfigResult, ReceiptConfigModel } from '@/api/model/receiptConfigModel';
import { request } from '@/utils/request';

const Api = {
  queryConfig: '/receiptConfig-query/config',
  saveConfig: '/receiptConfig-save/config',
  // 打印票据读取配置:与查询同路由处理逻辑,仅挂载前缀不同不校验菜单权限(仅登录) 20260922 新增
  printConfig: '/receiptConfig-print/config',
};

// 按区域查询收据配制：无配置时返回空 list
export function getReceiptConfig(region: string) {
  return request.get<ListReceiptConfigResult>({
    url: `${Api.queryConfig}?region=${encodeURIComponent(region)}`,
  });
}

// 按区域查询收据配制（打印票据用）：无配置时返回空 list，不校验菜单权限 20260922 新增
export function getReceiptConfigForPrint(region: string) {
  return request.get<ListReceiptConfigResult>({
    url: `${Api.printConfig}?region=${encodeURIComponent(region)}`,
  });
}

// 保存收据配制：idConfig 为空走新增，有值走修改（由后端判定）
export function saveReceiptConfig(data: Partial<ReceiptConfigModel>) {
  return request.post({
    url: Api.saveConfig,
    data,
  });
}

import { useUserStore } from '@/store';

/**
 * 当前用户权限对象查询 hook：按菜单 idMenu 精确匹配 roles 中的权限记录，
 * 权限不足时返回空对象，避免页面直接访问 userInfo.useCreate 等字段时报错。
 * 20260914 从 9 个业务页抽取
 */
export const usePermission = (idMenu: string) =>
  useUserStore().userInfo.roles?.find((r: { idMenu?: string }) => r.idMenu === idMenu) || {};

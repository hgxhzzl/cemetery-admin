import { useUserStore } from '@/store';

/**
 * 当前用户权限对象查询 hook：按菜单 idMenu 或稳定 menuName 匹配 roles 中的权限记录，
 * 权限不足时返回空对象，避免页面直接访问 userInfo.useCreate 等字段时报错。
 * 20260914 从 9 个业务页抽取；20260919 升级为 id/name 双匹配：
 * 菜单 id 会因显示顺序调整而变化（如 room 从 103101 调整为 103107），
 * 后端登录接口已下发 menuName，页面应优先传菜单 name（如 'room'）稳定匹配。
 */
export const usePermission = (idMenu: string) => {
  const roles = useUserStore().userInfo.roles || [];
  return roles.find((r: { idMenu?: string; menuName?: string }) => r.idMenu === idMenu || r.menuName === idMenu) || {};
};

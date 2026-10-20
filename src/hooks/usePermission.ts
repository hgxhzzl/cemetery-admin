import { computed } from 'vue';

import { useUserStore } from '@/store';

/**
 * 当前用户权限对象查询 hook：按菜单 idMenu 或稳定 menuName 匹配 roles 中的权限记录，
 * 权限不足时返回空对象，避免页面直接访问 userInfo.useCreate 等字段时报错。
 * 20260914 从 9 个业务页抽取；20260919 升级为 id/name 双匹配：
 * 菜单 id 会因显示顺序调整而变化（如 room 从 103101 调整为 103107），
 * 后端登录接口已下发 menuName，页面应优先传菜单 name（如 'room'）稳定匹配。
 * 返回响应式代理：页面 userInfo.useCreate 用法不变，但能响应运行时权限改写
 * （operator/account 页 updatePermissionField 整体替换 roles 数组），keep-alive 页签
 * 不再残留已回收权限的按钮入口（审查修复 20261020）。vue 未公开 toReactive，
 * 用 get/has/ownKeys 代理转发到 computed，属性访问时跟踪权限变化。
 */
export const usePermission = (idMenu: string): Record<string, any> => {
  const userStore = useUserStore();
  const permission = computed<Record<string, any>>(
    () =>
      (userStore.userInfo.roles || []).find(
        (r: { idMenu?: string; menuName?: string }) => r.idMenu === idMenu || r.menuName === idMenu,
      ) || {},
  );
  return new Proxy({} as Record<string, any>, {
    // prop 含 symbol（如异步迭代器/调试探测），索引统一转 any 处理
    get: (_target, prop) => (permission.value as Record<string | symbol, any>)[prop],
    has: (_target, prop) => prop in permission.value,
    ownKeys: () => Reflect.ownKeys(permission.value),
    getOwnPropertyDescriptor: (_target, prop) => ({
      enumerable: true,
      configurable: true,
      value: (permission.value as Record<string | symbol, any>)[prop],
    }),
  });
};

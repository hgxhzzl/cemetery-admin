import { computed } from 'vue';

import { useUserStore } from '@/store';

// powerConfig 归一:mysql2/接口可能回对象、字符串或 NULL;统一转对象,NULL/未配置返回 null(触发回退)。
// 与后端 rbac.parsePowerConfig 同口径 20261023 功能级权限改造新增,
const parsePowerConfig = (raw: unknown): Record<string, { actions: Record<string, number> }> | null => {
  if (raw === null || raw === undefined || raw === '') {
    return null;
  }
  if (typeof raw === 'object') {
    return raw as Record<string, { actions: Record<string, number> }>;
  }
  try {
    return JSON.parse(String(raw));
  } catch {
    // 解析异常按不限功能回退(与存量 NULL 行为一致,不因脏数据把合法操作员锁死),
    return null;
  }
};

/**
 * 功能级权限判定:墓位业务这类"一页多功能"集成页,在菜单 useMenu 之上再按"功能×动作"白名单收口。
 * 口径与后端 rbac.requireFunctionPower 逐字一致:
 * 1) 平台管理员(isAccount=1 且 gm_data_000)直接放行;
 * 2) 命中 roles 行后 useMenu!==1 直接无权;
 * 3) powerConfig 为空(NULL)→回退放行(兼容存量,useMenu=1 即全功能可用);
 *    否则仅当 cfg[fn].actions[action] 显式 ===1 才判有权,键缺失/为 0 视为无权(缺省禁止)。
 * menuKey 支持传 idMenu 或稳定 menuName(同 usePermission)。模板里直接调用即可随 roles 变化重新求值。
 * 20261023 功能级权限改造新增,
 */
export const hasFunctionPower = (menuKey: string, fn: string, action: string): boolean => {
  const userStore = useUserStore();
  if (Number(userStore.isAccount) === 1 && userStore.dataBaseName === 'gm_data_000') {
    return true;
  }
  const roles = (userStore.userInfo.roles || []) as Array<Record<string, any>>;
  const row = roles.find((r) => String(r.idMenu) === String(menuKey) || r.menuName === menuKey);
  if (!row || Number(row.useMenu) !== 1) {
    return false;
  }
  const cfg = parsePowerConfig(row.powerConfig);
  if (cfg === null) {
    return true;
  }
  return Number(cfg?.[fn]?.actions?.[action]) === 1;
};

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

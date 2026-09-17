import cloneDeep from 'lodash/cloneDeep';
import { defineStore } from 'pinia';
import type { RouteRecordRaw } from 'vue-router';

import type { RouteItem } from '@/api/model/permissionModel';
import { getMenuList } from '@/api/permission';
import router from '@/router';
import { store } from '@/store';
import type { UserPermission, UserPermissionField } from '@/types/interface';
import { normalizeBackendMenuList, transformObjectToRoute } from '@/utils/route';

import { getUserStore } from './user';

function dedupeRoutes(routes: Array<RouteRecordRaw>) {
  const seen = new Set<string>();

  return routes.filter((route) => {
    const key = `${String(route.name ?? '')}::${route.path}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

const permissionKeyMap: Record<string, keyof UserPermission> = {
  create: 'useCreate',
  add: 'useCreate',
  new: 'useCreate',
  insert: 'useCreate',
  modify: 'useModify',
  edit: 'useModify',
  update: 'useModify',
  delete: 'useDelete',
  remove: 'useDelete',
  power: 'usePower',
  auth: 'usePower',
  permission: 'usePower',
  examine: 'useExamine',
  audit: 'useExamine',
  finish: 'useFinish',
  complete: 'useFinish',
  use: 'useMenu',
  menu: 'useMenu',
  view: 'useMenu',
};

function flattenMenuItems(routeList: RouteItem[]) {
  const result: RouteItem[] = [];

  const travel = (items: RouteItem[]) => {
    items.forEach((item) => {
      result.push(item);
      if (item.children?.length) {
        travel(item.children);
      }
    });
  };

  travel(routeList);
  return result;
}

function normalizePermissionKey(route: RouteItem) {
  const rawKey = `${route.permissionKey || route.meta?.permissionKey || route.name || route.path || ''}`.toLowerCase();

  for (const keyword of Object.keys(permissionKeyMap)) {
    if (rawKey.includes(keyword)) {
      return permissionKeyMap[keyword];
    }
  }

  return undefined;
}

function buildMenuPermissions(routeList: RouteItem[]) {
  const flatMenuItems = flattenMenuItems(routeList);
  const permissions = new Map<string, UserPermission>();

  flatMenuItems.forEach((item) => {
    if (!item.idMenu || item.menuType === 'button' || item.useMenu === 0) {
      return;
    }

    permissions.set(item.idMenu, {
      idMenu: item.idMenu,
      useMenu: item.useMenu ?? 1,
      ...(permissions.get(item.idMenu) || {}),
    });
  });

  flatMenuItems.forEach((item) => {
    if (item.menuType !== 'button' || item.useMenu === 0) {
      return;
    }

    const targetIdMenu = item.parentIdMenu;
    const permissionKey = normalizePermissionKey(item);
    if (!targetIdMenu || !permissionKey) {
      return;
    }

    const current = permissions.get(targetIdMenu) || { idMenu: targetIdMenu, useMenu: 1 };
    current[permissionKey] = 1;
    permissions.set(targetIdMenu, current);
  });

  return Array.from(permissions.values());
}

export const usePermissionStore = defineStore('permission', {
  state: () => ({
    whiteListRouters: ['/login'],
    routers: [] as Array<RouteRecordRaw>,
    businessRouters: [] as Array<RouteRecordRaw>,
    rawBusinessMenus: [] as Array<RouteItem>,
    removeRoutes: [] as Array<RouteRecordRaw>,
    asyncRoutes: [] as Array<RouteRecordRaw>,
  }),
  actions: {
    rebuildBusinessRoutes(syncRouter = false) {
      // 显式指定泛型为 RouteRecordRaw：transformObjectToRoute 默认泛型是 RouteItem，
      // 与本 store 状态类型 Array<RouteRecordRaw> 不一致会导致 IDE 类型报错
      const nextAsyncRoutes = transformObjectToRoute<RouteRecordRaw>(cloneDeep(this.rawBusinessMenus));

      if (syncRouter) {
        (this.asyncRoutes as Array<RouteRecordRaw>).forEach((item) => {
          if (item.name && router.hasRoute(item.name)) {
            router.removeRoute(item.name);
          }
        });
      }

      this.asyncRoutes = nextAsyncRoutes;
      this.businessRouters = cloneDeep(nextAsyncRoutes);

      if (syncRouter) {
        nextAsyncRoutes.forEach((item: RouteRecordRaw) => {
          if (item.name && !router.hasRoute(item.name)) {
            router.addRoute(item);
          }
        });
      }

      this.syncMenuRoutes();
    },
    syncMenuRoutes() {
      // 菜单只展示数据库权限菜单（后端已按 account_power/operator_power 过滤）
      this.routers = dedupeRoutes(cloneDeep(this.businessRouters) as Array<RouteRecordRaw>);
    },
    async initRoutes() {
      this.businessRouters = cloneDeep(this.asyncRoutes);
      this.syncMenuRoutes();
    },
    updateBusinessPermission(idMenu: string, field: UserPermissionField, value: number) {
      const updateMenu = (list: RouteItem[]) => {
        list.forEach((item) => {
          if (item.idMenu === idMenu) {
            if (field === 'useMenu') {
              item.useMenu = value;
            }
            item.meta = {
              ...item.meta,
              [field]: value,
              useMenu: field === 'useMenu' ? value : (item.useMenu ?? item.meta?.useMenu),
            };
          }

          if (item.children?.length) {
            updateMenu(item.children);
          }
        });
      };

      updateMenu(this.rawBusinessMenus);
      this.rebuildBusinessRoutes(true);
    },
    // 显式声明返回类型：Pinia 会给 state 包一层 Vue 的 UnwrapRef，在未开启
    // strictNullChecks 时 UnwrapRef<undefined> 会被解析成 unknown，
    // 污染 RouteRecordRaw 联合中 redirect 的 path?: undefined，导致返回值
    // 无法再赋给 RouteRecordRaw（见 permission.ts 中 router.addRoute 的报错）
    async buildAsyncRoutes(): Promise<Array<RouteRecordRaw>> {
      try {
        // 发起菜单权限请求 获取菜单列表
        const asyncRoutes = normalizeBackendMenuList((await getMenuList()).list);
        const userStore = getUserStore();
        userStore.syncMenuPermissions(buildMenuPermissions(asyncRoutes));
        this.rawBusinessMenus = cloneDeep(asyncRoutes);
        this.asyncRoutes = transformObjectToRoute<RouteRecordRaw>(cloneDeep(asyncRoutes));
        this.businessRouters = cloneDeep(this.asyncRoutes);
        await this.initRoutes();
        return this.asyncRoutes as Array<RouteRecordRaw>;
      } catch (error) {
        throw new Error("Can't build routes", error as ErrorOptions);
      }
    },
    async restoreRoutes() {
      // 不需要在此额外调用initRoutes更新侧边导肮内容，在登录后asyncRoutes为空会调用
      (this.asyncRoutes as Array<RouteRecordRaw>).forEach((item) => {
        if (item.name) {
          router.removeRoute(item.name);
        }
      });
      this.asyncRoutes = [];
      this.rawBusinessMenus = [];
      this.businessRouters = [];
      this.syncMenuRoutes();
    },
  },
});

export function getPermissionStore() {
  return usePermissionStore(store);
}

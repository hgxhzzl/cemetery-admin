import { defineStore } from 'pinia';

import { login } from '@/api/login';
import { usePermissionStore, useTabsRouterStore } from '@/store';
import type { UserInfo, UserPermission, UserPermissionField } from '@/types/interface';

import { store } from '..';

const InitUserInfo: UserInfo = {
  name: '', // 用户名，用于展示在页面右上角头像处
  roles: [],
};

function normalizePermissionRecord(permission: UserPermission) {
  return {
    ...permission,
    idMenu: permission.idMenu ? String(permission.idMenu) : undefined,
    idPower: permission.idPower === undefined ? undefined : Number(permission.idPower),
    idOperator: permission.idOperator === undefined ? undefined : Number(permission.idOperator),
    level: permission.level === undefined ? undefined : Number(permission.level),
    operatePower: permission.operatePower ?? permission.operatPower,
    operatPower: permission.operatPower ?? permission.operatePower,
    useMenu: Number(permission.useMenu ?? 0),
    useCreate: Number(permission.useCreate ?? 0),
    useModify: Number(permission.useModify ?? 0),
    useDelete: Number(permission.useDelete ?? 0),
    usePower: Number(permission.usePower ?? 0),
    useExamine: Number(permission.useExamine ?? 0),
    useFinish: Number(permission.useFinish ?? 0),
    operateCreate: Number(permission.operateCreate ?? 0),
    operateModify: Number(permission.operateModify ?? 0),
    operateDelete: Number(permission.operateDelete ?? 0),
    operateExamine: Number(permission.operateExamine ?? 0),
    operateFinish: Number(permission.operateFinish ?? 0),
  } as UserPermission;
}

export const useUserStore = defineStore('user', {
  state: () => ({
    token: 'main_token', // 默认token不走权限
    phone: '',
    userName: '',
    userId: 0,
    dataBaseName: '',
    userInfo: { ...InitUserInfo },
  }),
  getters: {
    roles: (state) => {
      return state.userInfo?.roles;
    },
  },
  actions: {
    async login(userInfo: Record<string, unknown>) {
      const account = userInfo.account?.toString() || '';
      const password = userInfo.password?.toString() || '';

      // 重新登录时清除上次会话打开的页签，避免残留上一个用户的页面与缓存
      useTabsRouterStore().resetTabRouterList();

      const res = await login(account, password);
      if (res.code === 0) {
        const roleItems = (res.data.userInfo?.roles || []).map((item: UserPermission) =>
          normalizePermissionRecord(item),
        );
        this.token = res.data.token || 'main_token';
        this.phone = res.data.userPhone || '';
        this.userName = res.data.userName || account;
        this.userId = res.data.userId || 0;
        this.dataBaseName =
          res.data.dataBaseName || `${roleItems.find((item: UserPermission) => item.dataBaseName)?.dataBaseName || ''}`;
        this.userInfo = {
          name: this.userName || account,
          roles: roleItems,
        };
      } else {
        throw res;
      }
    },
    async getUserInfo() {
      const mockRemoteUserInfo = async (token: string) => {
        if (token === 'main_token') {
          return {
            name: this.userName || 'Tencent',
            roles: ['all'],
          };
        }
        return {
          name: this.userName || 'td_dev',
          roles: this.userInfo.roles,
        };
      };
      const res = await mockRemoteUserInfo(this.token);

      this.userInfo = res;
    },
    syncMenuPermissions(menuPermissions: UserPermission[]) {
      const roleItems = Array.isArray(this.userInfo.roles) ? this.userInfo.roles : [];
      const stringRoles = roleItems.filter((role) => typeof role === 'string');
      const existingPermissions = roleItems.filter(
        (role): role is UserPermission => typeof role === 'object' && role !== null && 'idMenu' in role,
      );

      const permissionMap = new Map<string, UserPermission>();

      existingPermissions.forEach((permission) => {
        if (permission.idMenu) {
          permissionMap.set(permission.idMenu, normalizePermissionRecord(permission));
        }
      });

      menuPermissions.forEach((permission) => {
        if (!permission.idMenu) {
          return;
        }

        const existing = permissionMap.get(permission.idMenu) || {};
        permissionMap.set(permission.idMenu, {
          ...permission,
          ...existing,
          idMenu: permission.idMenu,
        });
      });

      this.userInfo.roles = [
        ...stringRoles,
        ...Array.from(permissionMap.values()).map((item) => normalizePermissionRecord(item)),
      ];
    },
    updatePermissionField(idMenu: string, field: UserPermissionField, value: number) {
      const roleItems = Array.isArray(this.userInfo.roles) ? [...this.userInfo.roles] : [];
      const permissionIndex = roleItems.findIndex(
        (role) =>
          typeof role === 'object' && role !== null && 'idMenu' in role && (role as UserPermission).idMenu === idMenu,
      );

      const nextPermission = normalizePermissionRecord({
        ...(permissionIndex >= 0 ? (roleItems[permissionIndex] as UserPermission) : {}),
        idMenu,
        [field]: value,
      } as UserPermission);

      if (permissionIndex >= 0) {
        roleItems[permissionIndex] = nextPermission;
      } else {
        roleItems.push(nextPermission);
      }

      this.userInfo.roles = roleItems;
    },
    async logout() {
      this.token = '';
      this.phone = '';
      this.userName = '';
      this.userId = 0;
      this.dataBaseName = '';
      this.userInfo = { ...InitUserInfo };
    },
  },
  persist: {
    afterHydrate: () => {
      const permissionStore = usePermissionStore();
      permissionStore.initRoutes();
    },
    key: 'user',
    pick: ['token', 'phone', 'userName', 'userId', 'dataBaseName', 'userInfo'],
  },
});

export function getUserStore() {
  return useUserStore(store);
}

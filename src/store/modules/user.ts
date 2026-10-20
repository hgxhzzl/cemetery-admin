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
    // 初始为空：未登录先访任意页直接走 permission 白名单分支静默进登录页，
    // 不再携带模板遗留的假 token 触发后端 401 + 错误提示 20261019 修改
    token: '',
    phone: '',
    userName: '',
    userId: 0,
    dataBaseName: '',
    // account 表记录的 account 字段（账户/园区名称），由登录响应透传，用于系统左上角 logo 文字展示 20261005 新增
    accountName: '',
    // 是否平台管理员账号（1管理员/0普通操作员），由登录响应透传 20260924 新增
    isAccount: 0,
    // 当前操作员缴费年限候选（operator.termYears 逗号分隔串），由登录响应透传，供收管理费等页下拉取值 20261017 新增
    termYears: '',
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
      // 本机设备哈希随登录请求提交,后端设备白名单校验用 20260924 设备白名单,
      const deviceHash = userInfo.deviceHash?.toString() || '';

      // 重新登录时清除上次会话打开的页签，避免残留上一个用户的页面与缓存
      useTabsRouterStore().resetTabRouterList();

      const res = await login(account, password, deviceHash);
      if (res.code === 0) {
        const roleItems = (res.data.userInfo?.roles || []).map((item: UserPermission) =>
          normalizePermissionRecord(item),
        );
        // 后端登录成功必返 token；原 `|| 'main_token'` 兜底为模板 mock 遗留，会使无 token 响应
        // 进入半登录态并触发假 token 请求，改空串后由路由守卫白名单分支自然回登录页 20261019 审查修正
        this.token = res.data.token || '';
        this.phone = res.data.userPhone || '';
        this.userName = res.data.userName || account;
        this.userId = res.data.userId || 0;
        this.isAccount = res.data.isAccount ?? 0;
        this.dataBaseName =
          res.data.dataBaseName || `${roleItems.find((item: UserPermission) => item.dataBaseName)?.dataBaseName || ''}`;
        this.accountName = res.data.accountName || '';
        // 登录响应透传的当前操作员缴费年限（逗号分隔串），持久化后刷新页仍可用 20261017 新增
        this.termYears = res.data.termYears || '';
        this.userInfo = {
          name: this.userName || account,
          roles: roleItems,
        };
      } else {
        throw res;
      }
    },
    async getUserInfo() {
      // 模板遗留的 mock 取用户信息（本地返回，不发请求）；原 main_token 分支随登录兜底删除一并移除 20261019 审查修正
      // 幂等短路：该 action 由路由守卫每次导航 await，但只是把 userName/roles 原样搬进 userInfo 并整体换一个新对象，
      // 会让依赖 userInfo 的 Header/SideNav 每次切页无谓重渲染。roles 的实际变更均由 login/syncMenuPermissions/
      // updatePermissionField 就地写入、刷新后由 persist 还原，均不依赖本方法重取；故仅在 userInfo 未初始化
      // （name 为空）时补一次即可，退出后 name 复位为空、下次登录重新初始化 20261020 P2 结构梳理
      if (this.userInfo.name) {
        return;
      }
      this.userInfo = {
        name: this.userName || 'td_dev',
        roles: this.userInfo.roles,
      };
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
      this.accountName = '';
      this.isAccount = 0;
      this.termYears = '';
      this.userInfo = { ...InitUserInfo };
    },
  },
  persist: {
    afterHydrate: () => {
      const permissionStore = usePermissionStore();
      permissionStore.initRoutes();
    },
    key: 'user',
    pick: ['token', 'phone', 'userName', 'userId', 'dataBaseName', 'accountName', 'isAccount', 'termYears', 'userInfo'],
  },
});

export function getUserStore() {
  return useUserStore(store);
}

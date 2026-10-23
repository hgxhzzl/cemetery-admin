import type { TabValue } from 'tdesign-vue-next';
import type { Component, DefineComponent, FunctionalComponent } from 'vue';
import type { LocationQueryRaw, RouteMeta, RouteRecordName } from 'vue-router';

import type { LocalizedTitle } from '@/locales';

export interface UserPermission {
  idMenu?: string;
  idPower?: number;
  idOperator?: number;
  dataBaseName?: string;
  account?: string;
  menuName?: string;
  menuDescribe?: string;
  level?: number;
  operateCreate?: number;
  operateModify?: number;
  operateDelete?: number;
  operateExamine?: number;
  operateFinish?: number;
  operatePower?: number;
  operatPower?: number;
  useMenu?: number;
  /** @deprecated operator_power 动作列已删除;单功能菜单判权改走 powerConfig(hasFunctionPower)。仅供旧菜单树按钮权限构造兼容 20261023 */
  useCreate?: number;
  /** @deprecated 同上,已废弃 */
  useModify?: number;
  /** @deprecated 同上,已废弃 */
  useDelete?: number;
  /** @deprecated 同上,已废弃 */
  usePower?: number;
  /** @deprecated 同上,已废弃 */
  useExamine?: number;
  /** @deprecated 同上,已废弃 */
  useFinish?: number;
  // 功能级权限白名单:NULL/未配置=不限功能(回退 useMenu 全权);非空仅显式 =1 的动作放行 20261023 新增,
  powerConfig?: Record<string, { actions: Record<string, number> }> | string | null;
  [key: string]: unknown;
}

export interface MenuRoute {
  path: string;
  /** 多语言标题对象，如 { zh_CN: '仪表盘', en_US: 'Dashboard' } */
  title?: LocalizedTitle;
  name?: string;
  icon?: string | Component | FunctionalComponent | DefineComponent;
  redirect?: string;
  children: MenuRoute[];
  meta: RouteMeta;
}

export type ModeType = 'dark' | 'light';

export interface UserInfo {
  name: string;
  roles: any[];
}

export type UserPermissionField =
  'useMenu' | 'useCreate' | 'useModify' | 'useDelete' | 'usePower' | 'useExamine' | 'useFinish';

export interface TRouterInfo {
  path: string;
  query?: LocationQueryRaw;
  routeIdx?: number;
  /** 多语言标题对象，如 { zh_CN: '仪表盘', en_US: 'Dashboard' } */
  title?: LocalizedTitle;
  name?: RouteRecordName;
  componentName?: string;
  isAlive?: boolean;
  isHome?: boolean;
  meta?: any;
}

export interface TTabRouterType {
  isRefreshing: boolean;
  tabRouterList: Array<TRouterInfo>;
}

export interface TTabRemoveOptions {
  value: TabValue;
  index: number;
  e: MouseEvent;
}

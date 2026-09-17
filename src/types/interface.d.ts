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
  useCreate?: number;
  useModify?: number;
  useDelete?: number;
  usePower?: number;
  useExamine?: number;
  useFinish?: number;
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

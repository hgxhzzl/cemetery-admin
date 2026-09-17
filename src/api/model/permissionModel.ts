import type { defineComponent } from 'vue';
import type { RouteMeta } from 'vue-router';

export interface MenuListResult {
  list: Array<RouteItem | RawRouteItem>;
}

export type Component<T = any> =
  ReturnType<typeof defineComponent> | (() => Promise<typeof import('*.vue')>) | (() => Promise<T>);

export interface RouteItem {
  idMenu?: string;
  parentIdMenu?: string;
  menuLevel?: number;
  menuType?: 'directory' | 'menu' | 'button';
  useMenu?: number;
  permissionKey?: string;
  path: string;
  name: string;
  component?: Component | string;
  components?: Component;
  redirect?: string;
  meta: RouteMeta;
  children?: Array<RouteItem>;
}

export interface RawRouteItem extends Record<string, unknown> {
  children?: Array<RawRouteItem>;
}

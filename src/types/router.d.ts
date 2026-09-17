import 'vue-router';

import type { Component, DefineComponent, FunctionalComponent } from 'vue';

import type { LocalizedTitle } from '@/locales';

export {};
declare module 'vue-router' {
  interface RouteMeta {
    title?: LocalizedTitle;
    icon?: string | Component | FunctionalComponent | DefineComponent;
    idMenu?: string;
    parentIdMenu?: string;
    menuType?: 'directory' | 'menu' | 'button';
    useMenu?: number;
    permissionKey?: string;
    expanded?: boolean;
    orderNo?: number;
    hidden?: boolean;
    hiddenBreadcrumb?: boolean;
    single?: boolean;
    keepAlive?: boolean;
    frameSrc?: string;
    frameBlank?: boolean;
    region?: string;
    // roleCode?: string; // 前端 roles 控制菜单权限
  }
}

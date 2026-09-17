import cloneDeep from 'lodash/cloneDeep';

import type { RawRouteItem, RouteItem } from '@/api/model/permissionModel';
import type { LocalizedTitle } from '@/locales';
import {
  BLANK_LAYOUT,
  EXCEPTION_COMPONENT,
  IFRAME,
  LAYOUT,
  PAGE_NOT_FOUND_ROUTE,
  PARENT_LAYOUT,
} from '@/utils/route/constant';

// 动态从包内引入单个Icon,如果没有网络环境可以使用这种方式 但是会导致产物存在多个chunk
// const iconsPath = import.meta.glob('../../../node_modules/tdesign-icons-vue-next/esm/components/*.js');

// async function getMenuIcon(iconName: string): Promise<string> {
//   const RenderIcon = iconsPath[`../../../node_modules/tdesign-icons-vue-next/esm/components/${iconName}.js`];

//   const Icon = await RenderIcon();
//   return shallowRef(Icon.default);
// }

const LayoutMap = new Map<string, () => Promise<typeof import('*.vue')>>();

LayoutMap.set('LAYOUT', LAYOUT);
LayoutMap.set('BLANK', BLANK_LAYOUT);
LayoutMap.set('IFRAME', IFRAME);

function getField<T = unknown>(source: Record<string, unknown>, keys: string[], defaultValue?: T): T | undefined {
  for (const key of keys) {
    const value = source[key];
    if (value !== undefined && value !== null && value !== '') {
      return value as T;
    }
  }
  return defaultValue;
}

function normalizeTitle(title: unknown, fallback?: string): LocalizedTitle {
  if (title && typeof title === 'object') {
    return title as LocalizedTitle;
  }

  const text = `${title || fallback || ''}`;
  return {
    zh_CN: text,
    en_US: text,
  };
}

function normalizeLocaleTitle(source: Record<string, unknown>, metaSource: Record<string, unknown>, fallback?: string) {
  const zhCn = getField<string>(source, ['zh_CN', 'zhCn'], getField(metaSource, ['zh_CN', 'zhCn']));
  const enUs = getField<string>(source, ['en_US', 'enUs'], getField(metaSource, ['en_US', 'enUs']));

  if (zhCn || enUs) {
    const title = `${fallback || ''}`;
    return {
      zh_CN: zhCn || title,
      en_US: enUs || zhCn || title,
    };
  }

  return normalizeTitle(
    getField(
      metaSource,
      ['title', 'menuTitle', 'label'],
      getField(source, ['title', 'menuTitle', 'menuName', 'label', 'name']),
    ),
    fallback,
  );
}

function normalizeMenuType(menuType: unknown): RouteItem['menuType'] {
  const normalized = `${menuType || ''}`.toLowerCase();

  if (['button', 'btn', 'action', 'operate'].includes(normalized)) {
    return 'button';
  }
  if (['directory', 'catalog', 'dir', 'group'].includes(normalized)) {
    return 'directory';
  }
  return 'menu';
}

function normalizeBoolean(value: unknown, defaultValue = false) {
  if (value === undefined || value === null || value === '') {
    return defaultValue;
  }
  if (typeof value === 'boolean') {
    return value;
  }

  const normalized = `${value}`.toLowerCase();
  return ['1', 'true', 'y', 'yes'].includes(normalized);
}

function normalizeNumber(value: unknown, defaultValue?: number) {
  if (value === undefined || value === null || value === '') {
    return defaultValue;
  }
  const parsed = Number(value);
  return Number.isNaN(parsed) ? defaultValue : parsed;
}

function normalizeUseMenu(value: unknown) {
  if (value === undefined || value === null || value === '') {
    return 1;
  }

  if (typeof value === 'boolean') {
    return value ? 1 : 0;
  }

  const normalized = `${value}`.toLowerCase();
  if (['0', 'false', 'n', 'no', 'hidden', 'disable', 'disabled'].includes(normalized)) {
    return 0;
  }
  return 1;
}

function normalizePath(path: unknown, name: string) {
  const normalizedPath = `${path || ''}`.trim();
  if (normalizedPath) {
    return normalizedPath;
  }
  return name;
}

function normalizeComponent(component: unknown, menuType: RouteItem['menuType']) {
  const normalizedComponent = `${component || ''}`.trim();
  if (normalizedComponent) {
    return normalizedComponent;
  }
  return menuType === 'directory' ? 'LAYOUT' : undefined;
}

function normalizeSingleRoute(source: RawRouteItem): RouteItem {
  const metaSource = (getField<Record<string, unknown>>(source, ['meta', 'metaInfo'], {}) || {}) as Record<
    string,
    unknown
  >;
  const idMenu = `${getField(source, ['idMenu', 'menuId', 'id', 'menuCode'], '') || ''}`;
  const parentIdMenu = `${getField(source, ['parentIdMenu', 'parentMenuId', 'parentId', 'parent_id', 'pid'], '') || ''}`;
  const name = `${getField(source, ['name', 'routeName', 'routerName', 'menuNameEn', 'menuCode'], '') || idMenu || 'UnnamedMenu'}`;
  const menuType = normalizeMenuType(
    getField(source, ['menuType', 'type', 'menuKind'], getField(metaSource, ['menuType'])),
  );
  const path = normalizePath(getField(source, ['path', 'routePath', 'routerPath', 'url', 'routeUrl']), name);
  const permissionKey = getField<string>(
    source,
    ['permissionKey', 'permKey', 'permissionCode', 'actionKey'],
    getField(metaSource, ['permissionKey']),
  );
  const normalizedMeta = {
    ...metaSource,
    idMenu: idMenu || undefined,
    parentIdMenu: parentIdMenu || undefined,
    menuType,
    useMenu: normalizeUseMenu(
      getField(source, ['useMenu', 'visible', 'showMenu', 'isShow'], getField(metaSource, ['useMenu'])),
    ),
    permissionKey,
    title: normalizeLocaleTitle(source, metaSource, name),
    icon: getField(metaSource, ['icon', 'iconName'], getField(source, ['icon', 'iconName'])),
    orderNo: normalizeNumber(
      getField(source, ['orderNo', 'sort', 'sortNo', 'orderNum'], getField(metaSource, ['orderNo'])),
      0,
    ),
    hidden: normalizeBoolean(getField(source, ['hidden', 'hideMenu'], getField(metaSource, ['hidden'])), false),
    hiddenBreadcrumb: normalizeBoolean(
      getField(source, ['hiddenBreadcrumb', 'hideBreadcrumb'], getField(metaSource, ['hiddenBreadcrumb'])),
      false,
    ),
    single: normalizeBoolean(getField(source, ['single'], getField(metaSource, ['single'])), false),
    // 默认 true：数据库菜单通常无 keepAlive 字段，按 starter 语义默认保活（显式 0/false 才禁用），
    // 否则 meta.keepAlive 归一化为 false 会同时导致多标签Tab不显示（isAlive=false 被过滤）
    keepAlive: normalizeBoolean(getField(source, ['keepAlive', 'cache'], getField(metaSource, ['keepAlive'])), true),
    frameSrc: getField<string>(source, ['frameSrc', 'iframeSrc', 'linkUrl'], getField(metaSource, ['frameSrc'])),
    frameBlank: normalizeBoolean(
      getField(source, ['frameBlank', 'openBlank'], getField(metaSource, ['frameBlank'])),
      false,
    ),
    expanded: normalizeBoolean(getField(source, ['expanded'], getField(metaSource, ['expanded'])), false),
    region: getField<string>(
      source,
      ['region', 'regionName', 'area', 'areaName'],
      getField<string>(metaSource, ['region']),
    ),
  };

  const childSource = getField<RawRouteItem[]>(source, ['children', 'childList', 'subMenus', 'menuChildren'], []);

  return {
    idMenu: idMenu || undefined,
    parentIdMenu: parentIdMenu || undefined,
    menuLevel: normalizeNumber(getField(source, ['menuLevel', 'level', 'depth']), undefined),
    menuType,
    useMenu: normalizedMeta.useMenu,
    permissionKey,
    path,
    name,
    component: normalizeComponent(
      getField(
        source,
        ['component', 'componentPath', 'viewPath', 'pagePath', 'componentName'],
        getField(metaSource, ['component']),
      ),
      menuType,
    ),
    redirect:
      `${getField(source, ['redirect', 'redirectPath', 'redirectUrl'], getField(metaSource, ['redirect'])) || ''}` ||
      undefined,
    meta: normalizedMeta,
    children: childSource?.map((child) => normalizeSingleRoute(child)),
  };
}

export function normalizeBackendMenuList(routeList: Array<RouteItem | RawRouteItem>): RouteItem[] {
  return routeList.map((item) => normalizeSingleRoute(item as RawRouteItem));
}

function sortRoutesByOrder(routes: RouteItem[]) {
  routes.sort((left, right) => (left.meta?.orderNo || 0) - (right.meta?.orderNo || 0));
  routes.forEach((route) => {
    if (route.children?.length) {
      sortRoutesByOrder(route.children);
    }
  });
  return routes;
}

function filterRouteNodes(routes: RouteItem[]): RouteItem[] {
  return routes
    .filter((route) => route.menuType !== 'button' && route.useMenu !== 0)
    .map((route) => ({
      ...route,
      meta: {
        ...route.meta,
        idMenu: route.idMenu,
        parentIdMenu: route.parentIdMenu,
        menuType: route.menuType,
        useMenu: route.useMenu,
      },
      children: route.children ? filterRouteNodes(route.children) : undefined,
    }));
}

function buildRouteTree(routeList: RouteItem[]): RouteItem[] {
  const routeMap = new Map<string, RouteItem>();
  const roots: RouteItem[] = [];

  routeList.forEach((route) => {
    if (route.idMenu) {
      routeMap.set(route.idMenu, {
        ...route,
        meta: {
          ...route.meta,
          idMenu: route.idMenu,
          parentIdMenu: route.parentIdMenu,
          menuType: route.menuType,
          useMenu: route.useMenu,
        },
        children: [],
      });
    }
  });

  routeList.forEach((route) => {
    const current = route.idMenu ? routeMap.get(route.idMenu) : { ...route, children: route.children || [] };
    if (!current || current.menuType === 'button' || current.useMenu === 0) {
      return;
    }

    const parentIdMenu = current.parentIdMenu;
    if (parentIdMenu && parentIdMenu !== '0' && routeMap.has(parentIdMenu)) {
      const parent = routeMap.get(parentIdMenu);
      if (parent && parent.menuType !== 'button' && parent.useMenu !== 0) {
        parent.children = parent.children || [];
        parent.children.push(current);
        return;
      }
    }

    roots.push(current);
  });

  return roots;
}

function normalizeMenuRoutes(routeList: RouteItem[]): RouteItem[] {
  const sourceRoutes = cloneDeep(routeList);
  const hasTreeShape = sourceRoutes.some((route) => route.children?.length);
  const hasFlatHierarchy = sourceRoutes.some((route) => route.parentIdMenu && route.parentIdMenu !== '0');

  const normalizedRoutes =
    hasTreeShape || !hasFlatHierarchy ? filterRouteNodes(sourceRoutes) : buildRouteTree(sourceRoutes);

  return sortRoutesByOrder(normalizedRoutes);
}

// 动态引入路由组件：业务页面目录静态收集（result/404、result/500 由 constant.ts 显式引用，不受此 glob 影响）
// 注意：glob 模式必须内联为字面量，rolldown 无法跨变量分析 import.meta.glob 的模式
const dynamicViewsModules: Record<string, () => Promise<Recordable>> = {
  ...import.meta.glob<Recordable>(
    '../../pages/{account,adminfee,adminfeeQuery,buried,buriedQuery,contacts,contactsQuery,contract,home,login,managementPeriod,operator,park,reserve,room,sale,saleQuery,taginfo,transferOut}/**/*.vue',
  ),
};

function asyncImportRoute(routes: RouteItem[] | undefined) {
  if (!routes) return;

  routes.forEach(async (item) => {
    const { component, name } = item;
    const { children } = item;

    if (component) {
      const layoutFound = LayoutMap.get(component.toUpperCase());
      if (layoutFound) {
        item.component = layoutFound;
      } else {
        item.component = dynamicImport(dynamicViewsModules, component);
      }
    } else if (name) {
      item.component = PARENT_LAYOUT();
    }

    // 动态从包内引入单个Icon,如果没有网络环境可以使用这种方式 但是会导致产物存在多个chunk
    // if (item.meta.icon) item.meta.icon = await getMenuIcon(item.meta.icon);

    children && asyncImportRoute(children);
  });
}

function dynamicImport(dynamicViewsModules: Record<string, () => Promise<Recordable>>, component: string) {
  const keys = Object.keys(dynamicViewsModules);
  const matchKeys = keys.filter((key) => {
    const k = key.replace('../../pages', '');
    const startFlag = component.startsWith('/');
    const endFlag = component.endsWith('.vue') || component.endsWith('.tsx');
    const startIndex = startFlag ? 0 : 1;
    const lastIndex = endFlag ? k.length : k.lastIndexOf('.');
    return k.substring(startIndex, lastIndex) === component;
  });
  if (matchKeys?.length === 1) {
    const matchKey = matchKeys[0];
    return dynamicViewsModules[matchKey];
  }
  if (matchKeys?.length > 1) {
    throw new Error(
      'Please do not create `.vue` and `.TSX` files with the same file name in the same hierarchical directory under the views folder. This will cause dynamic introduction failure',
    );
  } else {
    console.warn(`Can't find ${component} in pages folder`);
  }
  return EXCEPTION_COMPONENT;
}

// 将背景对象变成路由对象
export function transformObjectToRoute<T = RouteItem>(routeList: RouteItem[]): T[] {
  const normalizedRoutes = normalizeMenuRoutes(routeList);

  normalizedRoutes.forEach(async (route) => {
    const component = route.component as string;

    if (component) {
      if (component.toUpperCase() === 'LAYOUT') {
        route.component = LayoutMap.get(component.toUpperCase());
      } else {
        route.children = [cloneDeep(route)];
        route.component = LAYOUT;
        route.name = `${route.name}Parent`;
        route.path = '';
        route.meta = route.meta || {};
      }
    } else {
      throw new Error('component is undefined');
    }

    route.children && asyncImportRoute(route.children);

    // 动态从包内引入单个Icon,如果没有网络环境可以使用这种方式 但是会导致产物存在多个chunk
    // if (route.meta.icon)
    // route.meta.icon = await getMenuIcon(route.meta.icon);
  });

  return [PAGE_NOT_FOUND_ROUTE, ...normalizedRoutes] as unknown as T[];
}

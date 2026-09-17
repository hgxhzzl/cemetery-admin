import { defineStore } from 'pinia';

import { store } from '@/store';
import type { TRouterInfo, TTabRouterType } from '@/types/interface';

const homeRoute: Array<TRouterInfo> = [
  {
    path: '/home/index',
    routeIdx: 0,
    title: { zh_CN: '首页', en_US: 'Home' },
    name: 'HomeIndex',
    isHome: true,
    // 预置首页必须显式声明保活，否则 Content.vue 的 aliveViews 过滤（route.isAlive && isRouteKeepAlive）会将其排除，
    // 首页组件用 onActivated 拉取数据将永不触发 20260915 修复
    isAlive: true,
  },
];

const cloneRoutes = (routes: Array<TRouterInfo>) => routes.map((item: TRouterInfo) => ({ ...item }));

const getDefaultHomeRoute = () => {
  return cloneRoutes(homeRoute);
};

const state = {
  // store 初始化阶段不能读取 getUserStore()，否则会在 Pinia 尚未完成创建时触发循环依赖白页。
  // 先以业务首页安全启动，后续在 hydrate/reset 时再收口到真实首页。
  tabRouterList: cloneRoutes(homeRoute),
  isRefreshing: false,
};

// 不需要做多标签tabs页缓存的列表 值为每个页面对应的name 如 DashboardDetail
// const ignoreCacheRoutes = ['DashboardDetail'];
const ignoreCacheRoutes = ['login'];

export const useTabsRouterStore = defineStore('tabsRouter', {
  state: () => state,
  getters: {
    tabRouters: (state: TTabRouterType) => state.tabRouterList,
    refreshing: (state: TTabRouterType) => state.isRefreshing,
  },
  actions: {
    // 处理刷新
    toggleTabRouterAlive(routeIdx: number) {
      this.isRefreshing = !this.isRefreshing;
      this.tabRouters[routeIdx].isAlive = !this.tabRouters[routeIdx].isAlive;
    },
    // 处理新增
    appendTabRouterList(newRoute: TRouterInfo) {
      // 不要将判断条件newRoute.meta.keepAlive !== false修改为newRoute.meta.keepAlive，starter默认开启保活，所以meta.keepAlive未定义时也需要进行保活，只有显式说明false才禁用保活。
      const needAlive = !ignoreCacheRoutes.includes(newRoute.name as string) && newRoute.meta?.keepAlive !== false;
      if (!this.tabRouters.some((route: TRouterInfo) => route.path === newRoute.path)) {
        this.tabRouterList = this.tabRouterList.concat({ ...newRoute, isAlive: needAlive });
      }
    },
    // 处理关闭当前
    subtractCurrentTabRouter(newRoute: TRouterInfo) {
      const { routeIdx } = newRoute;
      if (routeIdx === undefined) return;
      this.tabRouterList = this.tabRouterList.slice(0, routeIdx).concat(this.tabRouterList.slice(routeIdx + 1));
    },
    // 处理关闭右侧
    subtractTabRouterBehind(newRoute: TRouterInfo) {
      const { routeIdx } = newRoute;
      if (routeIdx === undefined) return;
      const homeIdx: number = this.tabRouters.findIndex((route: TRouterInfo) => route.isHome);
      const homeRoute = getDefaultHomeRoute();
      let tabRouterList: Array<TRouterInfo> = this.tabRouterList.slice(0, routeIdx + 1);
      if (routeIdx < homeIdx) {
        tabRouterList = tabRouterList.concat(homeRoute);
      }
      this.tabRouterList = tabRouterList;
    },
    // 处理关闭左侧
    subtractTabRouterAhead(newRoute: TRouterInfo) {
      const { routeIdx } = newRoute;
      if (routeIdx === undefined) return;
      const homeIdx: number = this.tabRouters.findIndex((route: TRouterInfo) => route.isHome);
      const homeRoute = getDefaultHomeRoute();
      let tabRouterList: Array<TRouterInfo> = this.tabRouterList.slice(routeIdx);
      if (routeIdx > homeIdx) {
        tabRouterList = homeRoute.concat(tabRouterList);
      }
      this.tabRouterList = tabRouterList;
    },
    // 处理关闭其他
    subtractTabRouterOther(newRoute: TRouterInfo) {
      const { routeIdx } = newRoute;
      if (routeIdx === undefined) return;
      const homeIdx: number = this.tabRouters.findIndex((route: TRouterInfo) => route.isHome);
      const homeRoute = getDefaultHomeRoute();
      this.tabRouterList = routeIdx === homeIdx ? homeRoute : homeRoute.concat([this.tabRouterList?.[routeIdx]]);
    },
    removeTabRouterList() {
      this.tabRouterList = [];
    },
    // 重新登录时重置：仅保留首页 tab，清除其它已打开页签及其页面缓存
    resetTabRouterList() {
      this.tabRouterList = getDefaultHomeRoute();
      this.isRefreshing = false;
    },
    updateTabComponentName(path: string, componentName: string) {
      const target = this.tabRouterList.find((route: TRouterInfo) => route.path === path);
      if (target && target.componentName !== componentName) {
        target.componentName = componentName;
      }
    },
    initTabRouterList(newRoutes: TRouterInfo[]) {
      newRoutes?.forEach((route: TRouterInfo) => this.appendTabRouterList(route));
    },
  },
  persist: {
    afterHydrate: ({ store: currentStore }) => {
      const tabsStore = currentStore as unknown as { tabRouterList: Array<TRouterInfo> };
      const homeRoute = getDefaultHomeRoute();
      const expectedHomePath = homeRoute[0]?.path;

      tabsStore.tabRouterList = tabsStore.tabRouterList.filter((route: TRouterInfo) => {
        if (!route.isHome) {
          return route.path !== '/dashboard/base';
        }
        return route.path === expectedHomePath;
      });

      if (!tabsStore.tabRouterList.some((route: TRouterInfo) => route.isHome)) {
        tabsStore.tabRouterList = homeRoute.concat(tabsStore.tabRouterList);
      }

      // 修复旧持久化数据：历史首页 tab 缺 isAlive 标记，会导致 keep-alive 排除首页、onActivated 不触发 20260915 修复
      const homeTab = tabsStore.tabRouterList.find((route: TRouterInfo) => route.isHome);
      if (homeTab && homeTab.isAlive !== true) {
        homeTab.isAlive = true;
      }
    },
  },
});

export function getTabsRouterStore() {
  return useTabsRouterStore(store);
}

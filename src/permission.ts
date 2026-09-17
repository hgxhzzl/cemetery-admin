import 'nprogress/nprogress.css'; // progress bar style

import NProgress from 'nprogress'; // progress bar
import { MessagePlugin } from 'tdesign-vue-next';
import type { RouteRecordRaw } from 'vue-router';

import router from '@/router';
import { getPermissionStore, useUserStore } from '@/store';
import { PAGE_NOT_FOUND_ROUTE } from '@/utils/route/constant';

NProgress.configure({ showSpinner: false });

router.beforeEach(async (to, from, next) => {
  NProgress.start();

  const permissionStore = getPermissionStore();
  const { whiteListRouters } = permissionStore;

  const userStore = useUserStore();

  if (userStore.token) {
    if (to.path === '/login') {
      next();
      return;
    }
    try {
      await userStore.getUserInfo();

      const { asyncRoutes } = permissionStore;
      let justBuilt = false;

      if (asyncRoutes && asyncRoutes.length === 0) {
        const routeList = await permissionStore.buildAsyncRoutes();
        routeList.forEach((item: RouteRecordRaw) => {
          router.addRoute(item);
        });
        justBuilt = true;
      }

      // 根路径统一跳业务首页
      if (to.path === '/') {
        next('/home/index');
        NProgress.done();
        return;
      }

      // 动态路由刚注册后重试当前导航，让新注册路由参与匹配；
      // 若不重试，守卫开始时解析的 matched 仍是 404 兜底组件
      if (justBuilt) {
        if (to.name === PAGE_NOT_FOUND_ROUTE.name) {
          next({ path: to.fullPath, replace: true });
        } else if (to.redirectedFrom) {
          next({ path: to.redirectedFrom.fullPath, replace: true });
        } else {
          // 直接基于 to 重新导航以加载动态路由；
          // 若用 from.query.redirect 手动拼接 path+query，当 redirect 带参时
          // to.path !== redirect 恒成立，且显式 query 会覆盖 path 内嵌参数，导致参数丢失，故统一用 to。
          next({ ...to, replace: true });
        }
        return;
      }

      if (router.hasRoute(to.name!)) {
        next();
      } else {
        next(`/`);
      }
    } catch (error) {
      MessagePlugin.error((error as Error).message);
      next({
        path: '/login',
        query: { redirect: to.fullPath },
      });
      NProgress.done();
    }
  } else {
    /* white list router */
    if (whiteListRouters.includes(to.path)) {
      next();
    } else {
      next({
        path: '/login',
        query: { redirect: to.fullPath },
      });
    }
    NProgress.done();
  }
});

router.afterEach((to) => {
  if (to.path === '/login') {
    const userStore = useUserStore();
    const permissionStore = getPermissionStore();

    userStore.logout();
    permissionStore.restoreRoutes();
  }
  NProgress.done();
});

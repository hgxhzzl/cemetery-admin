import type { RouteRecordRaw } from 'vue-router';

export const LAYOUT = () => import('@/layouts/index.vue');
export const BLANK_LAYOUT = () => import('@/layouts/blank.vue');
export const IFRAME = () => import('@/layouts/components/FrameBlank.vue');
export const EXCEPTION_COMPONENT = () => import('@/pages/result/500/index.vue');
export const PARENT_LAYOUT = () =>
  new Promise((resolve) => {
    resolve({ name: 'ParentLayout' });
  });

// 未匹配路径直接渲染 404 组件
// eslint-disable-next-line prettier/prettier
export const PAGE_NOT_FOUND_ROUTE: RouteRecordRaw = { path: '/:w+', name: '404Page', component: () => import('@/pages/result/404/index.vue') };

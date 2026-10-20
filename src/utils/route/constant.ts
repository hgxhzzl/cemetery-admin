import type { RouteRecordRaw } from 'vue-router';

export const LAYOUT = () => import('@/layouts/index.vue');
export const BLANK_LAYOUT = () => import('@/layouts/blank.vue');
export const IFRAME = () => import('@/layouts/components/FrameBlank.vue');
export const EXCEPTION_COMPONENT = () => import('@/pages/result/500/index.vue');
export const PARENT_LAYOUT = () =>
  new Promise((resolve) => {
    resolve({ name: 'ParentLayout' });
  });

// 未匹配路径直接渲染 404 组件：具名参数 /:w+ 的默认 pattern 不跨越 `/`，多段错误路径会落进
// 守卫 next('/') 静默跳首页而非渲染 404；改 catch-all 并补 meta 避免空标题页签（审查修复 20261020）。
// hidden: true 必带：菜单渲染按 `meta && meta.hidden !== true` 过滤，原路由无 meta 天然不进菜单，
// 补 title 后若不标 hidden 会使这条兜底路由漏进侧栏顶部成为一个假菜单项
export const PAGE_NOT_FOUND_ROUTE: RouteRecordRaw = {
  path: '/:pathMatch(.*)*',
  name: '404Page',
  component: () => import('@/pages/result/404/index.vue'),
  meta: { title: { zh_CN: '页面不存在', en_US: 'Page Not Found' }, hidden: true },
};

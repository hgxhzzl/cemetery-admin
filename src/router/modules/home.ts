import type { RouteRecordRaw } from 'vue-router';

import { LAYOUT } from '@/utils/route/constant';

export default [
  {
    path: '/home',
    component: LAYOUT,
    name: 'Home',
    redirect: '/home/index',
    meta: {
      title: {
        zh_CN: '首页',
        en_US: 'Home',
      },
      hidden: true,
    },
    children: [
      {
        path: 'index',
        name: 'HomeIndex',
        component: () => import('@/pages/home/index.vue'),
        meta: {
          title: {
            zh_CN: '首页',
            en_US: 'Home',
          },
          hidden: true,
          keepAlive: true,
        },
      },
    ],
  },
] satisfies RouteRecordRaw[];

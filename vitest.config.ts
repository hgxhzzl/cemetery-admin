import path from 'node:path';

import { defineConfig } from 'vitest/config';

// ============================================================
// 前端单元测试配置：只覆盖无 DOM 的纯函数（票据内容组装、卡片配色/状态判定、打印流程替身）
// 有意不 mergeConfig 主 vite.config.ts：那边的 vue/jsx/svg/按需导入插件对这些用例是多余的
// 依赖面，且会连带触发 git describe；只用同一个 @ 别名保证与被测源码的导入口径一致 20261019 新增
// 说明：环境固定 node，不引 jsdom/happy-dom；需要 DOM 的逻辑（applyCardColors 写 CSS 变量、
// 路由守卫、组件渲染）留给 e2e 或人工验证，不在此处造假 DOM
// ============================================================
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    include: ['tests/**/*.spec.ts'],
    environment: 'node',
    clearMocks: true,
    restoreMocks: true,
  },
});

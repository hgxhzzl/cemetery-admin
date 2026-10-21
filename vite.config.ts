import { execSync } from 'node:child_process';
import path from 'node:path';

import vue from '@vitejs/plugin-vue';
import vueJsx from '@vitejs/plugin-vue-jsx';
import { TDesignResolver } from 'unplugin-vue-components/resolvers';
import Components from 'unplugin-vue-components/vite';
import type { ConfigEnv, UserConfig } from 'vite';
import { loadEnv } from 'vite';
import svgLoader from 'vite-svg-loader';

const CWD = process.cwd();

// 应用版本号：构建期从 git 计算并注入运行时常量 __APP_VERSION__
// 取值链：有 tag → 用 tag（如 cms01-v2.0.1）；无 tag → 回落 commit 短 hash；连 .git 都没有 → 'dev' 20261005 新增
// 去掉 git describe 产物的 "-g<hash>" 段（保留 tag 与提交数，如 cms01-v2.0.3-1-g574192e → cms01-v2.0.3-1）20261006 修改
const getAppVersion = (): string => {
  try {
    const desc = execSync('git describe --tags --always --dirty', { encoding: 'utf-8' }).trim();
    return desc.replace(/-g[0-9a-f]+/, '');
  } catch {
    return 'dev';
  }
};

// https://vitejs.dev/config/
export default ({ mode }: ConfigEnv): UserConfig => {
  const { VITE_BASE_URL, VITE_API_URL_PREFIX, VITE_DEV_ALLOWED_HOST } = loadEnv(mode, CWD);
  return {
    base: VITE_BASE_URL,
    define: {
      __APP_VERSION__: JSON.stringify(getAppVersion()),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },

    css: {
      preprocessorOptions: {
        less: {
          modifyVars: {
            hack: `true; @import (reference) "${path.resolve('src/style/variables.less')}";`,
          },
          math: 'strict',
          javascriptEnabled: true,
        },
      },
    },

    plugins: [
      vue(),
      vueJsx(),
      svgLoader(),
      // TDesign 组件按需自动导入：模板中 t-* 标签编译期解析为具名 import，替代 main.ts 的
      // app.use(TDesign) 全量注册（tdesign-vendor JS 由 1374KB 降为实际用量）；
      // TDesignResolver 不自动引入组件样式，样式仍走 main.ts 全量 index.css 兜底，避免逐组件
      // 样式遗漏弹窗/浮层边缘场景；dirs: [] 关闭本地组件自动扫描登记（项目均显式 import，行为零变化）；
      // <t-icon>（含 JSX 动态用法）由 main.ts 显式全局注册 TIcon 覆盖 20261019 审查优化
      Components({
        resolvers: [TDesignResolver({ library: 'vue-next' })],
        dirs: [],
        dts: 'src/components.d.ts',
      }),
    ],

    server: {
      port: 3002,
      // 监听 0.0.0.0 便于现场其它机器(园区终端/打印电脑)访问开发服务,按 IP 直连不受 Host 白名单限制,
      host: '0.0.0.0',
      // allowedHosts 原为 true(放行任意 Host 头),等于把开发服务暴露给 DNS rebinding:
      // 恶意页面可将自持域名指向开发机,绕过同源检查读取接口与源码,现改回默认(仅本机与 IP 直连),
      // 确需内网域名访问时用 VITE_DEV_ALLOWED_HOST=a.local,b.local 显式追加(数组值是“额外允许”而非替换) 20261021 审查修复 P2,
      allowedHosts: VITE_DEV_ALLOWED_HOST
        ? VITE_DEV_ALLOWED_HOST.split(',')
            .map((item) => item.trim())
            .filter(Boolean)
        : [],
      proxy: {
        [VITE_API_URL_PREFIX]: 'http://127.0.0.1:3000/',
      },
    },

    // https://github.com/vueuse/vueuse/issues/5387#issuecomment-4734186040
    build: {
      rolldownOptions: {
        onLog(level, log, defaultHandler) {
          if (log.code === 'INVALID_ANNOTATION') return null;
          else defaultHandler(level, log);
        },
        // 大库手动拆包：tdesign/echarts/vue 系独立 vendor chunk，业务代码变更不再改变 vendor 哈希，利于浏览器长效缓存 20260917 新增
        output: {
          codeSplitting: {
            groups: [
              {
                name: 'echarts-vendor',
                test: /node_modules[\\/]echarts/,
                priority: 30,
              },
              {
                name: 'tdesign-vendor',
                test: /node_modules[\\/]tdesign/,
                priority: 20,
              },
              {
                name: 'vue-vendor',
                test: /node_modules[\\/](vue[\\/]|pinia|vue-router|vue-i18n|@vueuse)/,
                priority: 10,
              },
            ],
          },
        },
      },
    },
  };
};

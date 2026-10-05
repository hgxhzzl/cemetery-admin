import { execSync } from 'node:child_process';
import path from 'node:path';

import vue from '@vitejs/plugin-vue';
import vueJsx from '@vitejs/plugin-vue-jsx';
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
  const { VITE_BASE_URL, VITE_API_URL_PREFIX } = loadEnv(mode, CWD);
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

    plugins: [vue(), vueJsx(), svgLoader()],

    server: {
      port: 3002,
      host: '0.0.0.0',
      allowedHosts: true,
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

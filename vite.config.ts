import path from 'node:path';

import vue from '@vitejs/plugin-vue';
import vueJsx from '@vitejs/plugin-vue-jsx';
import type { ConfigEnv, UserConfig } from 'vite';
import { loadEnv } from 'vite';
import svgLoader from 'vite-svg-loader';

const CWD = process.cwd();

// https://vitejs.dev/config/
export default ({ mode }: ConfigEnv): UserConfig => {
  const { VITE_BASE_URL, VITE_API_URL_PREFIX } = loadEnv(mode, CWD);
  return {
    base: VITE_BASE_URL,
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

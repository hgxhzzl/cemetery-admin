/* eslint-disable simple-import-sort/imports */
import { createApp } from 'vue';
import TDesign from 'tdesign-vue-next';

import App from './App.vue';
import router from './router';
import { store } from './store';
import i18n from './locales';

import 'tdesign-vue-next/es/style/index.css';
import '@/style/index.less';
import './permission';

const app = createApp(App);

// 一次性迁移：历史持久化中“多标签Tab页”为模板默认 false，与原项目配置（true）不一致，
// 在任何 store 水合（hydrate）前修正残留值；此后用户在设置面板的开关操作将被正常尊重。
const TABS_MIGRATION_KEY = 'cemetery-admin-isUseTabsRouter-migrated';
if (!localStorage.getItem(TABS_MIGRATION_KEY)) {
  const rawSetting = localStorage.getItem('setting');
  if (rawSetting) {
    try {
      const persisted = JSON.parse(rawSetting) as Record<string, unknown> | null;
      if (persisted && persisted.isUseTabsRouter === false) {
        persisted.isUseTabsRouter = true;
        localStorage.setItem('setting', JSON.stringify(persisted));
      }
    } catch {
      // 持久化数据损坏时忽略，交由默认值兜底
    }
  }
  localStorage.setItem(TABS_MIGRATION_KEY, '1');
}

app.use(TDesign);
app.use(store);
app.use(router);
app.use(i18n);

app.mount('#app');

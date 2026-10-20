<template>
  <t-layout :class="`${prefix}-layout`">
    <t-tabs
      v-if="settingStore.isUseTabsRouter"
      drag-sort
      theme="card"
      :class="`${prefix}-layout-tabs-nav`"
      :value="route.path"
      :style="{ position: 'sticky', top: 0, width: '100%' }"
      @change="(value) => handleChangeCurrentTab(value as string)"
      @remove="handleRemove"
      @drag-sort="handleDragend"
    >
      <t-tab-panel
        v-for="(routeItem, index) in tabRouters"
        :key="`${routeItem.path}_${index}`"
        :value="routeItem.path"
        :removable="!routeItem.isHome"
        :draggable="!routeItem.isHome"
      >
        <template #label>
          <t-dropdown
            trigger="context-menu"
            :min-column-width="128"
            :popup-props="{
              overlayClassName: 'route-tabs-dropdown',
              onVisibleChange: (visible: boolean, ctx: PopupVisibleChangeContext) =>
                handleTabMenuClick(visible, ctx, routeItem.path),
              visible: activeTabPath === routeItem.path,
            }"
          >
            <template v-if="!routeItem.isHome">
              {{ renderTitle(routeItem.title) }}
            </template>
            <t-icon v-else name="home" />
            <template #dropdown>
              <t-dropdown-menu>
                <t-dropdown-item @click="() => handleRefresh(routeItem)">
                  <t-icon name="refresh" />
                  {{ t('layout.tagTabs.refresh') }}
                </t-dropdown-item>
                <t-dropdown-item v-if="index > 1" @click="() => handleCloseAhead(routeItem.path)">
                  <t-icon name="arrow-left" />
                  {{ t('layout.tagTabs.closeLeft') }}
                </t-dropdown-item>
                <t-dropdown-item v-if="index < tabRouters.length - 1" @click="() => handleCloseBehind(routeItem.path)">
                  <t-icon name="arrow-right" />
                  {{ t('layout.tagTabs.closeRight') }}
                </t-dropdown-item>
                <t-dropdown-item v-if="tabRouters.length > 2" @click="() => handleCloseOther(routeItem.path)">
                  <t-icon name="close-circle" />
                  {{ t('layout.tagTabs.closeOther') }}
                </t-dropdown-item>
              </t-dropdown-menu>
            </template>
          </t-dropdown>
        </template>
      </t-tab-panel>
    </t-tabs>
    <t-content :class="`${prefix}-content-layout`">
      <l-breadcrumb v-if="settingStore.showBreadcrumb" />
      <l-content />
    </t-content>
    <t-footer v-if="settingStore.showFooter" :class="`${prefix}-footer-layout`">
      <l-footer />
    </t-footer>
  </t-layout>
</template>
<script setup lang="ts">
import type { PopupVisibleChangeContext } from 'tdesign-vue-next';
import { computed, nextTick, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { prefix } from '@/config/global';
import type { LocalizedTitle } from '@/locales';
import { t } from '@/locales';
import { useLocale } from '@/locales/useLocale';
import { useSettingStore, useTabsRouterStore } from '@/store';
import type { TRouterInfo, TTabRemoveOptions } from '@/types/interface';

import LBreadcrumb from './Breadcrumb.vue';
import LContent from './Content.vue';
import LFooter from './Footer.vue';

const route = useRoute();
const router = useRouter();

const settingStore = useSettingStore();
const tabsRouterStore = useTabsRouterStore();
const tabRouters = computed(() => tabsRouterStore.tabRouters.filter((route) => route.isAlive || route.isHome));
const activeTabPath = ref<string | null>('');

const { locale } = useLocale();

// 模板 v-for 遍历的是过滤后可见列表（tabRouters computed），而 store 各 action 的 routeIdx
// 作用于未过滤的 tabRouterList；一旦存在 isAlive=false 且非 home 的页签（后端下发 keepAlive=0
// 或刷新窗口期），直接用过滤下标会错位操作到其他页签；统一按 path 反查真实下标（审查修复 20261020）
const realTabIndex = (path: string) => tabsRouterStore.tabRouters.findIndex((i) => i.path === path);

const handleChangeCurrentTab = (path: string) => {
  const { tabRouters } = tabsRouterStore;
  const foundRoute = tabRouters.find((i) => i.path === path);
  router.push({ path, query: foundRoute?.query });
};

const handleRemove = (options: TTabRemoveOptions) => {
  const path = options.value as string;
  const realIdx = realTabIndex(path);
  if (realIdx === -1) return;
  const { tabRouters } = tabsRouterStore;
  const nextRouter = tabRouters[realIdx + 1] || tabRouters[realIdx - 1];

  tabsRouterStore.subtractCurrentTabRouter({ path, routeIdx: realIdx });
  if (path === route.path && nextRouter) router.push({ path: nextRouter.path, query: nextRouter.query });
};

const renderTitle = (title?: LocalizedTitle) => {
  if (!title) return '';
  return title[locale.value as keyof LocalizedTitle] || '';
};
const handleRefresh = (route: TRouterInfo) => {
  const realIdx = realTabIndex(route.path);
  if (realIdx === -1) return;
  tabsRouterStore.toggleTabRouterAlive(realIdx);
  nextTick(() => {
    tabsRouterStore.toggleTabRouterAlive(realIdx);
    router.replace({ path: route.path, query: route.query });
  });
  activeTabPath.value = null;
};
const handleCloseAhead = (path: string) => {
  const realIdx = realTabIndex(path);
  if (realIdx === -1) return;
  tabsRouterStore.subtractTabRouterAhead({ path, routeIdx: realIdx });

  handleOperationEffect('ahead', realIdx);
};
const handleCloseBehind = (path: string) => {
  const realIdx = realTabIndex(path);
  if (realIdx === -1) return;
  tabsRouterStore.subtractTabRouterBehind({ path, routeIdx: realIdx });

  handleOperationEffect('behind', realIdx);
};
const handleCloseOther = (path: string) => {
  const realIdx = realTabIndex(path);
  if (realIdx === -1) return;
  tabsRouterStore.subtractTabRouterOther({ path, routeIdx: realIdx });

  handleOperationEffect('other', realIdx);
};

// 处理非当前路由操作的副作用
const handleOperationEffect = (type: 'other' | 'ahead' | 'behind', routeIndex: number) => {
  const currentPath = router.currentRoute.value.path;
  const { tabRouters } = tabsRouterStore;

  const currentIdx = tabRouters.findIndex((i) => i.path === currentPath);
  // 存在三种情况需要刷新当前路由
  // 点击非当前路由的关闭其他、点击非当前路由的关闭左侧且当前路由小于触发路由、点击非当前路由的关闭右侧且当前路由大于触发路由
  const needRefreshRouter =
    (type === 'other' && currentIdx !== routeIndex) ||
    (type === 'ahead' && currentIdx < routeIndex) ||
    (type === 'behind' && currentIdx === -1);
  if (needRefreshRouter) {
    const nextRouteIdx = type === 'behind' ? tabRouters.length - 1 : 1;
    const nextRouter = tabRouters[nextRouteIdx];
    router.push({ path: nextRouter.path, query: nextRouter.query });
  }

  activeTabPath.value = null;
};
const handleTabMenuClick = (visible: boolean, ctx: PopupVisibleChangeContext, path: string) => {
  if (ctx.trigger === 'document') activeTabPath.value = null;
  if (visible) activeTabPath.value = path;
};

const handleDragend = (options: { currentIndex: number; targetIndex: number }) => {
  const { tabRouters } = tabsRouterStore;
  // 拖拽回调的 currentIndex/targetIndex 是可见页签（过滤后列表）的下标：先映射回 path，
  // 再按 path 在未过滤数组中定位后交换，避免隐藏页签存在时拖拽错位（审查修复 20261020）
  const visiblePaths = tabRouters.filter((r) => r.isAlive || r.isHome).map((r) => r.path);
  const fromPath = visiblePaths[options.currentIndex];
  const toPath = visiblePaths[options.targetIndex];
  const i = tabRouters.findIndex((r) => r.path === fromPath);
  const j = tabRouters.findIndex((r) => r.path === toPath);
  if (i === -1 || j === -1) return;

  [tabRouters[i], tabRouters[j]] = [tabRouters[j], tabRouters[i]];
};
</script>

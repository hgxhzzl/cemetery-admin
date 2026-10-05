<template>
  <div :class="sideNavCls">
    <t-menu
      :class="menuCls"
      :theme="theme"
      :value="active"
      :collapsed="collapsed"
      :expanded="expanded"
      :width="menuWidth"
      :expand-mutex="menuAutoCollapsed"
      @expand="onExpanded"
    >
      <template #logo>
        <span v-if="showLogo" class="logo-spacer" :class="`${prefix}-side-nav-logo-wrapper`" @click="goHome">
          <!-- 左上角品牌：logo-windows 图标 + account 表账户名称（+管理系统）；固定定位不受侧栏宽度限制，收起时仅显示图标 20261005 修改 -->
          <span class="app-brand">
            <logo-windows-icon class="app-brand__icon" />
            <span v-show="!collapsed" class="app-brand__text">{{ brandText }}</span>
          </span>
        </span>
      </template>
      <menu-content :nav-data="menu" />
      <template #operations>
        <t-button variant="text" shape="square" @click="changeCollapsed">
          <template #icon><t-icon name="view-list" /></template>
        </t-button>
        <span v-show="!isCompact" :class="versionCls"> {{ !collapsed ? 'version：' : '' }}{{ appVersion }} </span>
      </template>
    </t-menu>
    <!-- 侧边栏宽度拖拽手柄：按住左右移动调整菜单宽度，双击恢复语言默认宽度 20260915 新增 -->
    <div
      v-show="!collapsed"
      class="sidebar-resize-handle"
      :class="{ 'sidebar-resize-handle--dragging': isResizing }"
      :style="{ left: `${expandedWidth}px` }"
      @mousedown="startResize"
      @dblclick="resetSidebarWidth"
    ></div>
    <div :class="`${prefix}-side-nav-placeholder${collapsed ? '-hidden' : ''}`" :style="placeholderStyle"></div>
  </div>
</template>
<script setup lang="ts">
import difference from 'lodash/difference';
import remove from 'lodash/remove';
import union from 'lodash/union';
import { LogoWindowsIcon } from 'tdesign-icons-vue-next';
import type { MenuValue } from 'tdesign-vue-next';
import type { PropType } from 'vue';
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';

import { prefix } from '@/config/global';
import { t } from '@/locales';
import { useLocale } from '@/locales/useLocale';
import { getActive } from '@/router';
import { useSettingStore, useUserStore } from '@/store';
import type { MenuRoute, ModeType } from '@/types/interface';

import MenuContent from './MenuContent.vue';

const { menu, showLogo, isFixed, layout, theme, isCompact } = defineProps({
  menu: {
    type: Array as PropType<MenuRoute[]>,
    default: (): MenuRoute[] => [],
  },
  showLogo: {
    type: Boolean as PropType<boolean>,
    default: true,
  },
  isFixed: {
    type: Boolean as PropType<boolean>,
    default: true,
  },
  layout: {
    type: String as PropType<string>,
    default: '',
  },
  headerHeight: {
    type: String as PropType<string>,
    default: '64px',
  },
  theme: {
    type: String as PropType<ModeType>,
    default: 'light',
  },
  isCompact: {
    type: Boolean as PropType<boolean>,
    default: false,
  },
});

const MIN_POINT = 992 - 1;

// 侧栏底部应用版本号：构建期由 vite define 注入的 __APP_VERSION__（取自 git tag / commit hash）20261005 新增
const appVersion = __APP_VERSION__;

const collapsed = computed(() => useSettingStore().isSidebarCompact);
const menuAutoCollapsed = computed(() => useSettingStore().menuAutoCollapsed);
// 左上角品牌文字：account 表 account 字段（账户/园区名称）+ “管理系统”后缀；未登录或未回填时冷备到应用名 20261005 修改
const brandText = computed(() =>
  useUserStore().accountName ? `${useUserStore().accountName}${t('common.mgmtSuffix')}` : t('common.appName'),
);

const active = computed(() => getActive());

const expanded = ref<MenuValue[]>([]);

const getExpanded = () => {
  const path = getActive();
  const parts = path.split('/').slice(1);
  const result = parts.map((_, index) => `/${parts.slice(0, index + 1).join('/')}`);

  const allRoutes = router.getRoutes();
  const allRoutesExpanded = allRoutes.filter((item) => item.meta?.expanded).map((item) => item.path);

  expanded.value = menuAutoCollapsed.value
    ? union(result, allRoutesExpanded)
    : union(result, expanded.value, allRoutesExpanded);
};

watch(
  () => active.value,
  () => {
    getExpanded();
  },
);

const onExpanded = (value: MenuValue[]) => {
  const currentOperationMenu = difference(expanded.value, value);
  const allExpanded = union(value, expanded.value);
  remove(allExpanded, (item) => currentOperationMenu.includes(item));
  expanded.value = allExpanded;
};

const changeCollapsed = () => {
  settingStore.updateConfig({
    isSidebarCompact: !settingStore.isSidebarCompact,
  });
};
const sideMode = computed(() => {
  return theme === 'dark';
});
const versionCls = computed(() => {
  return [
    `version-container`,
    {
      [`${prefix}-side-nav-dark`]: sideMode.value,
    },
  ];
});
const sideNavCls = computed(() => {
  return [
    `${prefix}-sidebar-layout`,
    {
      [`${prefix}-sidebar-compact`]: isCompact,
      'is-sidebar-resizing': isResizing.value,
    },
  ];
});
const menuCls = computed(() => {
  return [
    `${prefix}-side-nav`,
    {
      [`${prefix}-side-nav-no-logo`]: !showLogo,
      [`${prefix}-side-nav-no-fixed`]: !isFixed,
      [`${prefix}-side-nav-mix-fixed`]: layout === 'mix' && isFixed,
    },
  ];
});

const router = useRouter();
const settingStore = useSettingStore();
const { locale } = useLocale();

// ==================== 侧边栏宽度：拖拽手柄调节 ====================
// 展开宽度优先取用户拖拽值（localStorage 持久化），未拖拽时按语言取默认：英文 320px、中文 232px；折叠态固定 64px
// 英文菜单标题较长（如"九泉山 Cemetery Area Settings"）需要更宽 20260915 修改
const SIDEBAR_WIDTH_KEY = 'tdesign-starter-sidebar-width';
const MIN_SIDEBAR_WIDTH = 200;
const MAX_SIDEBAR_WIDTH = 480;

const storedSidebarWidth = Number(localStorage.getItem(SIDEBAR_WIDTH_KEY));
const sidebarWidth = ref<number | null>(storedSidebarWidth > 0 ? storedSidebarWidth : null);
const isResizing = ref(false);

const defaultExpandedWidth = computed(() => (locale.value === 'en_US' ? 320 : 232));
const expandedWidth = computed(() => sidebarWidth.value ?? defaultExpandedWidth.value);
const menuWidth = computed(() => [`${expandedWidth.value}px`, '64px']);
// 占位符宽度跟随菜单：折叠态用 -hidden 类样式；拖拽中禁用过渡避免跟随滞后
const placeholderStyle = computed(() =>
  collapsed.value
    ? {}
    : {
        flex: `1 1 ${expandedWidth.value}px`,
        minWidth: `${expandedWidth.value}px`,
        transition: isResizing.value ? 'none' : 'all 0.3s',
      },
);

// 手柄按住拖动：以鼠标位移调整宽度并限制在 200~480px 之间 20260915 新增
const startResize = (event: MouseEvent) => {
  event.preventDefault();
  const startX = event.clientX;
  const startWidth = expandedWidth.value;
  isResizing.value = true;
  document.body.style.userSelect = 'none';
  document.body.style.cursor = 'col-resize';

  const onMove = (moveEvent: MouseEvent) => {
    const nextWidth = Math.min(MAX_SIDEBAR_WIDTH, Math.max(MIN_SIDEBAR_WIDTH, startWidth + moveEvent.clientX - startX));
    sidebarWidth.value = nextWidth;
  };
  const onUp = () => {
    isResizing.value = false;
    document.body.style.userSelect = '';
    document.body.style.cursor = '';
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('mouseup', onUp);
    localStorage.setItem(SIDEBAR_WIDTH_KEY, String(sidebarWidth.value));
  };
  document.addEventListener('mousemove', onMove);
  document.addEventListener('mouseup', onUp);
};

// 双击手柄：清除拖拽宽度，恢复语言默认宽度 20260915 新增
const resetSidebarWidth = () => {
  sidebarWidth.value = null;
  localStorage.removeItem(SIDEBAR_WIDTH_KEY);
};

const autoCollapsed = () => {
  const isCompact = window.innerWidth <= MIN_POINT;
  settingStore.updateConfig({
    isSidebarCompact: isCompact,
  });
};

onMounted(() => {
  getExpanded();
  autoCollapsed();

  window.addEventListener('resize', autoCollapsed);
});

onUnmounted(() => {
  window.removeEventListener('resize', autoCollapsed);
});

const goHome = () => {
  // 统一跳根路径，由路由守卫按菜单模式跳转：业务模式跳首个业务菜单，模板模式跳仪表盘
  router.push('/');
};
</script>
<style lang="less" scoped>
// 侧边栏宽度拖拽手柄：悬浮于菜单右边缘，按住左右移动调整宽度 20260915 新增
.sidebar-resize-handle {
  position: absolute;
  top: 0;
  bottom: 0;
  z-index: 300;
  width: 6px;
  margin-left: -3px;
  cursor: col-resize;
  transition: background-color 0.2s linear;

  &:hover,
  &--dragging {
    background-color: var(--td-brand-color);
    opacity: 0.35;
  }
}

// 拖拽过程中禁用菜单自身宽度过渡，保证菜单边缘与手柄实时同步 20260915 新增
.is-sidebar-resizing {
  :deep(.t-default-menu) {
    transition: none;
  }
}

// 左上角品牌：logo-windows 图标 + 账户名称文字 20261005 新增
// 用 position: fixed 脱离定宽侧栏容器，z-index 高于顶栏（1001），使“图标+文字”不受侧栏宽度限制、单行全量显示
.logo-spacer {
  // 品牌层 fixed 后脱离文档流，此处预留与顶栏等高空白，避免菜单首项顶到最上 20261005 新增
  min-height: var(--td-comp-size-xxxl);
}

.app-brand {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 1050;
  display: flex;
  gap: 8px;
  align-items: center;
  height: var(--td-comp-size-xxxl);
  padding: 0 16px;
  white-space: nowrap;

  &__icon {
    flex: none;
    font-size: 26px;
    color: var(--td-brand-color);
  }

  &__text {
    // 不收缩、不截断：宽度随文字自然撑开，不受侧栏宽度限制 20261005 新增
    flex: none;
    font-size: 16px;
    font-weight: 600;
    color: var(--td-text-color-primary);
  }
}
</style>

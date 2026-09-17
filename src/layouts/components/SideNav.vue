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
        <span v-if="showLogo" :class="`${prefix}-side-nav-logo-wrapper`" @click="goHome">
          <component :is="getLogo()" :class="logoCls" />
        </span>
      </template>
      <menu-content :nav-data="menu" />
      <template #operations>
        <t-button variant="text" shape="square" @click="changeCollapsed">
          <template #icon><t-icon name="view-list" /></template>
        </t-button>
        <span v-show="!isCompact" :class="versionCls">
          {{ !collapsed ? t('common.appName') : '' }} {{ pgk.version }}
        </span>
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
import type { MenuValue } from 'tdesign-vue-next';
import type { PropType } from 'vue';
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';

import AssetLogoFull from '@/assets/assets-logo-full.svg?component';
import AssetLogo from '@/assets/assets-t-logo.svg?component';
import { prefix } from '@/config/global';
import { t } from '@/locales';
import { useLocale } from '@/locales/useLocale';
import { getActive } from '@/router';
import { useSettingStore } from '@/store';
import type { MenuRoute, ModeType } from '@/types/interface';

import pgk from '../../../package.json';
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

const collapsed = computed(() => useSettingStore().isSidebarCompact);
const menuAutoCollapsed = computed(() => useSettingStore().menuAutoCollapsed);

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
const logoCls = computed(() => {
  return [
    `${prefix}-side-nav-logo-${collapsed.value ? 't' : 'tdesign'}-logo`,
    {
      [`${prefix}-side-nav-dark`]: sideMode.value,
    },
  ];
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

const getLogo = () => {
  if (collapsed.value) return AssetLogo;
  return AssetLogoFull;
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
</style>

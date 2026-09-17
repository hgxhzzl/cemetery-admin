<template>
  <div :class="layoutCls">
    <t-head-menu :class="menuCls" :theme="menuTheme" expand-type="popup" :value="active">
      <template #logo>
        <span v-if="showLogo" class="header-logo-container" @click="handleNav('/')">
          <logo-full class="t-logo" />
        </span>
        <!-- 顶部搜索框已移除（无实际功能）20260915 修改 -->
      </template>
      <template v-if="layout !== 'side'" #default>
        <menu-content class="header-menu" :nav-data="menu" />
      </template>
      <template #operations>
        <div class="operations-container">
          <!-- 顶部搜索框已移除（无实际功能）20260915 修改 -->
          <language-switcher />
          <!-- 主题色选择 -->
          <t-popup placement="bottom-right" trigger="click" :overlay-inner-style="{ padding: '16px' }">
            <t-button theme="default" variant="text" shape="square">
              <t-icon name="palette" />
            </t-button>
            <template #content>
              <div class="theme-panel">
                <div class="theme-panel-title">{{ t('layout.header.themeColor') }}</div>
                <div class="theme-color-list">
                  <div
                    v-for="color in colorOptions"
                    :key="color"
                    class="theme-color-item"
                    :class="{ 'theme-color-item--active': isActiveColor(color) }"
                    :style="{ backgroundColor: color }"
                    @click="changeBrandTheme(color)"
                  >
                    <t-icon v-if="isActiveColor(color)" name="check" />
                  </div>
                </div>
                <div class="theme-panel-divider" />
                <t-color-picker v-model="customColor" format="HEX" @change="changeBrandTheme" />
              </div>
            </template>
          </t-popup>
          <!-- 亮/暗模式切换 -->
          <t-button theme="default" variant="text" shape="square" @click="switchMode">
            <t-icon :name="theme === 'light' ? 'sunny' : 'moon'" />
          </t-button>
          <t-dropdown :min-column-width="120" trigger="click">
            <template #dropdown>
              <t-dropdown-item class="operations-dropdown-container-item" @click="openPasswordDialog">
                <lock-on-icon />{{ t('layout.header.changePassword') }}
              </t-dropdown-item>
              <t-dropdown-item class="operations-dropdown-container-item" @click="handleLogout">
                <poweroff-icon />{{ t('layout.header.signOut') }}
              </t-dropdown-item>
            </template>
            <t-button class="header-user-btn" theme="default" variant="text">
              <template #icon>
                <t-icon class="header-user-avatar" name="user-circle" />
              </template>
              <div class="header-user-account">{{ user.userInfo.name }}</div>
              <template #suffix><chevron-down-icon /></template>
            </t-button>
          </t-dropdown>
        </div>
      </template>
    </t-head-menu>
    <!-- 修改密码弹窗：旧密码 + 新密码 + 确认新密码，调用后端 /api/operator-save/password 20260917 新增 -->
    <t-dialog
      v-model:visible="passwordDialogVisible"
      :header="t('layout.header.changePassword')"
      :confirm-btn="{ content: t('layout.header.changePassword') }"
      :on-close="resetPasswordForm"
      :on-confirm="submitPassword"
      width="420px"
    >
      <t-form
        ref="passwordForm"
        class="password-form"
        :data="passwordFormData"
        :rules="PASSWORD_RULES"
        label-width="0"
        :show-error-message="false"
      >
        <t-form-item name="oldPassword">
          <t-input
            v-model="passwordFormData.oldPassword"
            type="password"
            clearable
            autocomplete="current-password"
            :placeholder="t('layout.header.oldPasswordPlaceholder')"
          />
        </t-form-item>
        <t-form-item name="newPassword">
          <t-input
            v-model="passwordFormData.newPassword"
            type="password"
            clearable
            autocomplete="new-password"
            :placeholder="t('layout.header.newPasswordPlaceholder')"
          />
        </t-form-item>
        <t-form-item name="confirmPassword">
          <t-input
            v-model="passwordFormData.confirmPassword"
            type="password"
            clearable
            autocomplete="new-password"
            :placeholder="t('layout.header.confirmPasswordPlaceholder')"
          />
        </t-form-item>
      </t-form>
    </t-dialog>
  </div>
</template>
<script setup lang="ts">
import { ChevronDownIcon, LockOnIcon, PoweroffIcon } from 'tdesign-icons-vue-next';
import type { FormInstanceFunctions, FormRule } from 'tdesign-vue-next';
import { MessagePlugin } from 'tdesign-vue-next';
import type { PropType } from 'vue';
import { computed, ref, watch } from 'vue';
import { useRouter } from 'vue-router';

import { updatePassword } from '@/api/operator';
import LogoFull from '@/assets/assets-logo-full.svg?component';
import LanguageSwitcher from '@/components/LanguageSwitcher.vue';
import { DEFAULT_COLOR_OPTIONS } from '@/config/color';
import { prefix } from '@/config/global';
import { t } from '@/locales';
import { getActive } from '@/router';
import { useSettingStore, useUserStore } from '@/store';
import type { MenuRoute, ModeType } from '@/types/interface';
import { logError } from '@/utils/logger';

import MenuContent from './MenuContent.vue';

const { theme, layout, showLogo, menu, isFixed, isCompact } = defineProps({
  theme: {
    type: String,
    default: 'light',
  },
  layout: {
    type: String,
    default: 'top',
  },
  showLogo: {
    type: Boolean,
    default: true,
  },
  menu: {
    type: Array as PropType<MenuRoute[]>,
    default: (): MenuRoute[] => [],
  },
  isFixed: {
    type: Boolean,
    default: false,
  },
  isCompact: {
    type: Boolean,
    default: false,
  },
  maxLevel: {
    type: Number,
    default: 3,
  },
});

const router = useRouter();
const user = useUserStore();
const settingStore = useSettingStore();

const colorOptions = DEFAULT_COLOR_OPTIONS;

// 自定义取色器的当前值，跟随 store 中的主题色保持同步
const customColor = ref(settingStore.brandTheme);
watch(
  () => settingStore.brandTheme,
  (value) => {
    customColor.value = value;
  },
);

const isActiveColor = (color: string) => color.toLowerCase() === settingStore.brandTheme.toLowerCase();

const changeBrandTheme = (color: string) => {
  settingStore.updateConfig({ brandTheme: color });
};

const switchMode = () => {
  settingStore.updateConfig({ mode: settingStore.displayMode === 'light' ? 'dark' : 'light' });
};

const active = computed(() => getActive());

const layoutCls = computed(() => [`${prefix}-header-layout`]);

const menuCls = computed(() => {
  return [
    {
      [`${prefix}-header-menu`]: !isFixed,
      [`${prefix}-header-menu-fixed`]: isFixed,
      [`${prefix}-header-menu-fixed-side`]: layout === 'side' && isFixed,
      [`${prefix}-header-menu-fixed-side-compact`]: layout === 'side' && isFixed && isCompact,
    },
  ];
});
const menuTheme = computed(() => theme as ModeType);

const handleNav = (url: string) => {
  router.push(url);
};

const handleLogout = () => {
  router.push({
    path: '/login',
    query: { redirect: router.currentRoute.value.fullPath },
  });
};

// 修改密码弹窗：旧密码验证 + 新密码 bcrypt 存储（后端 /api/operator-save/password，从 store 取当前用户 idOperator）20260917 新增
const passwordDialogVisible = ref(false);
const passwordForm = ref<FormInstanceFunctions>();
const passwordFormData = ref({ oldPassword: '', newPassword: '', confirmPassword: '' });

const PASSWORD_RULES = computed<Record<string, FormRule[]>>(() => ({
  oldPassword: [{ required: true, message: t('layout.header.oldPasswordRequired'), type: 'error' }],
  newPassword: [{ required: true, message: t('layout.header.newPasswordRequired'), type: 'error' }],
  confirmPassword: [
    { required: true, message: t('layout.header.confirmPasswordRequired'), type: 'error' },
    {
      validator: (val) => val === passwordFormData.value.newPassword,
      message: t('layout.header.passwordMismatch'),
      type: 'error',
    },
  ],
}));

const openPasswordDialog = () => {
  passwordDialogVisible.value = true;
};

const resetPasswordForm = () => {
  passwordFormData.value = { oldPassword: '', newPassword: '', confirmPassword: '' };
  passwordForm.value?.clearValidate();
};

const submitPassword = async () => {
  const result = await passwordForm.value?.validate();
  if (result !== true) return false;
  try {
    // 后端返回 data=1 修改成功，data=0 旧密码错误或用户不存在
    const data = await updatePassword({
      idOperator: user.userId,
      oldPassword: passwordFormData.value.oldPassword,
      newPassword: passwordFormData.value.newPassword,
    });
    if (data === 1) {
      MessagePlugin.success(t('layout.header.changePasswordSuccess'));
      passwordDialogVisible.value = false;
      resetPasswordForm();
      return true;
    }
    MessagePlugin.error(t('layout.header.oldPasswordWrong'));
    return false;
  } catch (e) {
    logError(e);
    MessagePlugin.error((e as Error).message);
    return false;
  }
};
</script>
<style lang="less" scoped>
.@{starter-prefix}-header {
  &-menu-fixed {
    position: fixed;
    top: 0;
    z-index: 1001;

    :deep(.t-head-menu__inner) {
      padding-right: var(--td-comp-margin-xl);
    }

    &-side {
      left: 232px;
      right: 0;
      z-index: 10;
      width: auto;
      transition: all 0.3s;

      &-compact {
        left: 64px;
      }
    }
  }

  &-logo-container {
    cursor: pointer;
    display: inline-flex;
  }
}

.header-menu {
  flex: 1 1 auto;
  display: inline-flex;

  :deep(.t-menu__item) {
    min-width: unset;
  }
}

.operations-container {
  display: flex;
  align-items: center;

  .t-popup__reference {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .t-button {
    margin-left: var(--td-comp-margin-l);
  }
}

.theme-panel {
  width: 224px;

  &-title {
    font: var(--td-font-body-medium);
    color: var(--td-text-color-primary);
    margin-bottom: var(--td-comp-margin-m);
  }

  &-divider {
    height: 1px;
    background-color: var(--td-component-stroke);
    margin: var(--td-comp-margin-m) 0;
  }

  :deep(.t-color-picker__trigger) {
    width: 100%;
  }
}

.theme-color-list {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--td-comp-margin-s);
}

.theme-color-item {
  height: 32px;
  border-radius: var(--td-radius-default);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  transition: transform 0.2s;

  .t-icon {
    filter: drop-shadow(0 0 1px rgb(0 0 0 / 40%));
  }

  &:hover {
    transform: scale(1.06);
  }

  &--active {
    box-shadow:
      0 0 0 2px var(--td-bg-color-container),
      0 0 0 4px var(--td-brand-color);
  }
}

.header-logo-container {
  width: 184px;
  height: 26px;
  display: flex;
  margin-left: 24px;
  color: var(--td-text-color-primary);

  .t-logo {
    width: 100%;
    height: 100%;

    &:hover {
      cursor: pointer;
    }
  }

  &:hover {
    cursor: pointer;
  }
}

.header-user-account {
  display: inline-flex;
  align-items: center;
  color: var(--td-text-color-primary);
}

:deep(.t-head-menu__inner) {
  border-bottom: 1px solid var(--td-component-stroke);
}

.t-menu--light {
  .header-user-account {
    color: var(--td-text-color-primary);
  }
}

.t-menu--dark {
  .t-head-menu__inner {
    border-bottom: 1px solid var(--td-gray-color-10);
  }

  .header-user-account {
    color: rgb(255 255 255 / 55%);
  }
}

.operations-dropdown-container-item {
  width: 100%;
  display: flex;
  align-items: center;

  :deep(.t-dropdown__item-text) {
    display: flex;
    align-items: center;
  }

  .t-icon {
    font-size: var(--td-comp-size-xxxs);
    margin-right: var(--td-comp-margin-s);
  }

  :deep(.t-dropdown__item) {
    width: 100%;
    margin-bottom: 0;
  }

  &:last-child {
    :deep(.t-dropdown__item) {
      margin-bottom: 8px;
    }
  }
}

// 修改密码弹窗表单：校验错误态弱化为普通样式（无红框），错误提示文字由 show-error-message 关闭 20260917 修改
.password-form {
  :deep(.t-is-error) {
    border-color: var(--td-component-border);
  }

  :deep(.t-is-error:hover),
  :deep(.t-is-error.t-is-focused) {
    border-color: var(--td-component-border);
  }
}
</style>
<!-- eslint-disable-next-line vue-scoped-css/enforce-style-type -->
<style lang="less">
.operations-dropdown-container-item {
  .t-dropdown__item-text {
    display: flex;
    align-items: center;
  }
}
</style>

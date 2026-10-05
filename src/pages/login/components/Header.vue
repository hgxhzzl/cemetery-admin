<template>
  <header class="login-header">
    <span class="brand">
      <logo-windows-icon class="brand__icon" />
      <span class="brand__text">{{ t('pages.login.brandText') }}</span>
    </span>
    <div class="operations-container">
      <language-switcher />
    </div>
  </header>
</template>
<script setup lang="ts">
import { LogoWindowsIcon } from 'tdesign-icons-vue-next';

import LanguageSwitcher from '@/components/LanguageSwitcher.vue';
import { t } from '@/locales';
</script>
<style lang="less" scoped>
.login-header {
  padding: 0 var(--td-comp-paddingLR-xl);
  display: flex;
  justify-content: space-between;
  align-items: center;
  backdrop-filter: blur(10px);
  color: var(--td-text-color-primary);
  height: var(--td-comp-size-xxxl);

  .brand {
    display: flex;
    gap: 8px;
    align-items: center;

    &__icon {
      font-size: 26px;
      color: var(--td-brand-color);
    }

    &__text {
      font-size: 16px;
      font-weight: 600;
      color: var(--td-text-color-primary);
    }
  }

  .operations-container {
    display: flex;
    align-items: center;

    .t-button {
      margin-left: var(--td-comp-margin-l);
    }
  }
}
</style>

<template>
  <div class="login-wrapper">
    <login-header />

    <div class="login-container">
      <div class="title-container">
        <h1 class="title margin-no">{{ t('pages.login.loginTitle') }}</h1>
      </div>

      <login />
    </div>
  </div>
</template>
<script setup lang="ts">
import { t } from '@/locales';

import LoginHeader from './components/Header.vue';
import Login from './components/Login.vue';

defineOptions({
  name: 'LoginIndex',
});
</script>
<style lang="less" scoped>
@import './index.less';
</style>

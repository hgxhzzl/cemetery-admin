<template>
  <!-- 版权信息由 TDesign 模板默认的 Tencent 改为项目品牌“易顺通”，与侧栏底部保持一致 20261006 修改 -->
  <div :class="`${prefix}-footer`">Copyright © 2021-{{ new Date().getFullYear() }} 易顺通. All Rights Reserved</div>
</template>
<script setup lang="ts">
import { prefix } from '@/config/global';
</script>
<style lang="less" scoped>
.@{starter-prefix}-footer {
  color: var(--td-text-color-placeholder);
  line-height: 20px;
  text-align: center;
}
</style>

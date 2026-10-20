<template>
  <t-form
    ref="form"
    class="item-container"
    :data="formData"
    :rules="FORM_RULES"
    label-width="0"
    :show-error-message="false"
    @submit="onSubmit"
  >
    <t-form-item name="account">
      <t-input v-model="formData.account" size="large" :placeholder="t('pages.login.input.account')">
        <template #prefix-icon>
          <t-icon name="mobile" />
        </template>
      </t-input>
    </t-form-item>

    <t-form-item name="password">
      <t-input
        v-model="formData.password"
        size="large"
        :type="showPsw ? 'text' : 'password'"
        clearable
        :placeholder="t('pages.login.input.password')"
      >
        <template #prefix-icon>
          <t-icon name="lock-on" />
        </template>
        <template #suffix-icon>
          <t-icon :name="showPsw ? 'browse' : 'browse-off'" @click="showPsw = !showPsw" />
        </template>
      </t-input>
    </t-form-item>

    <!-- 记住账号 -->
    <div class="check-container remember-pwd">
      <t-checkbox v-model="formData.checked">{{ t('pages.login.remember') }}</t-checkbox>
    </div>

    <t-form-item class="btn-container">
      <t-button block size="large" type="submit" :disabled="submitting" :loading="submitting">
        {{ t('pages.login.signIn') }}
      </t-button>
    </t-form-item>
  </t-form>
</template>
<script setup lang="ts">
import type { FormInstanceFunctions, FormRule, SubmitContext } from 'tdesign-vue-next';
import { MessagePlugin } from 'tdesign-vue-next';
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';

import { useSubmitGuard } from '@/hooks';
import { t } from '@/locales';
import { useUserStore } from '@/store';
import { getDeviceInfo } from '@/utils/device';
import { logError } from '@/utils/logger';

const userStore = useUserStore();

// 记住账号：勾选后登录成功时保存账号，下次进入登录页自动回填
const REMEMBER_ACCOUNT_KEY = 'tdesign-starter-remember-account';
const rememberedAccount = localStorage.getItem(REMEMBER_ACCOUNT_KEY);

const INITIAL_DATA = {
  account: '',
  password: '',
  checked: false,
};

const FORM_RULES = computed<Record<string, FormRule[]>>(() => ({
  account: [{ required: true, message: t('pages.login.required.account'), type: 'error' }],
  password: [{ required: true, message: t('pages.login.required.password'), type: 'error' }],
}));

const form = ref<FormInstanceFunctions>();
const formData = ref({
  ...INITIAL_DATA,
  account: rememberedAccount || INITIAL_DATA.account,
  checked: Boolean(rememberedAccount),
});
const showPsw = ref(false);

const router = useRouter();

// 复用各业务页同款提交守卫：getDeviceInfo/login 两个 await 在途期间按钮仍可点击，
// 快速双击会并发两次登录请求（审查清理 20261020 复用 useSubmitGuard）
const { submitting, run: runSubmit } = useSubmitGuard();

// 守卫只在请求在途期间持锁，而本机后端/Agent 几十毫秒即返回，锁窗口小于连点/连按回车间隔，
// 第二次点击落在锁外仍会连发登录请求；在锁内补满最短持锁时长覆盖整个交互周期（20261020 反馈修复）
const MIN_LOGIN_LOCK_MS = 800;
const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

const onSubmit = async (ctx: SubmitContext) => {
  if (ctx.validateResult !== true) {
    return;
  }
  const startedAt = Date.now();
  await runSubmit(async () => {
    try {
      if (formData.value.checked) {
        localStorage.setItem(REMEMBER_ACCOUNT_KEY, formData.value.account);
      } else {
        localStorage.removeItem(REMEMBER_ACCOUNT_KEY);
      }

      // 先取本机设备哈希再提交登录:未装 Agent 时为空串,后端设备白名单拒绝普通账号 20260924 设备白名单,
      const deviceInfo = await getDeviceInfo();
      await userStore.login({ ...formData.value, deviceHash: deviceInfo?.deviceHash || '' });

      MessagePlugin.success(t('pages.login.loginSuccess'));
      // 重新登录后统一回首页入口：清空旧 redirect 带来的历史业务页回跳，再由路由守卫跳转业务首页。
      router.push('/');
    } catch (e: unknown) {
      logError(e);
      MessagePlugin.error((e as Error).message);
    } finally {
      // 成功路径已 router.push，组件即便随后卸载也不影响此处的定时收尾
      const remain = MIN_LOGIN_LOCK_MS - (Date.now() - startedAt);
      if (remain > 0) {
        await sleep(remain);
      }
    }
  });
};
</script>
<style lang="less" scoped>
@import '../index.less';

// 登录表单：校验错误态弱化为普通样式（无红框），错误提示文字由 show-error-message 关闭 20260917 修改
.item-container {
  :deep(.t-is-error) {
    border-color: var(--td-component-border);
  }

  :deep(.t-is-error:hover),
  :deep(.t-is-error.t-is-focused) {
    border-color: var(--td-component-border);
  }
}
</style>

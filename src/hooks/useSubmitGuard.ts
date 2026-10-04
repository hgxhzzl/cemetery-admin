import { ref } from 'vue';

/**
 * 表单“确认提交”按钮防重复提交守卫。
 *
 * 根因：各业务页的 ClickSubmit / onSubmit 只在写接口“成功返回后”才置 Submitted 标志
 * （该标志服务于“新建后停留本页打印票据”的语义），首个 await 之前没有任何同步锁，
 * 请求在途期间按钮仍可点击，快速双击会并发发出两次写接口 → 落库重复记录；
 * 修改/更新分支更是完全没有标志。
 *
 * run 在被调用时“同步”判定并置位 submitting（JS 单线程下首个 await 之前不会被打断，
 * 锁必然先于任何网络请求生效），await 结束（成功 / 失败 / 校验早退）后 finally 复位；
 * 在途期间的重复调用被直接忽略。submitting 同时供模板绑定按钮 :disabled 给出即时禁用反馈。
 * 20261004 新增
 */
export const useSubmitGuard = () => {
  const submitting = ref(false);

  const run = async (submit: () => Promise<unknown>) => {
    if (submitting.value) {
      return;
    }
    submitting.value = true;
    try {
      await submit();
    } finally {
      submitting.value = false;
    }
  };

  return { submitting, run };
};

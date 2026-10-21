// 初始登录口令回显弹窗:后端不再以手机号作初始口令,改为随机生成且只在新建成功的那一次响应里回显明文,
// 操作员新建与账户新建两处复用同一弹窗,避免各自手写导致口径漂移 20261021 配合审查修复 中E 新增,
import { DialogPlugin } from 'tdesign-vue-next';

import { translate } from '@/locales';

export interface InitialPasswordResult {
  initialPassword?: string;
}

// 无随机口令(前端自行提交了口令)时不弹窗,返回是否已提示 20261021 新增,
export function showInitialPasswordDialog(result?: InitialPasswordResult | null): boolean {
  const password = result && result.initialPassword ? String(result.initialPassword) : '';
  if (!password) {
    return false;
  }

  const dialog = DialogPlugin.alert({
    header: translate('operate.initialPasswordHeader'),
    body: `${translate('operate.initialPasswordTip')}${password}`,
    onConfirm: () => {
      dialog.hide();
    },
  });

  return true;
}

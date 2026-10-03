import dayjs from 'dayjs';

// 模板遗留的 LAST_7_DAYS / LAST_30_DAYS 预置区间全仓库零调用（首页改为按接口返回区间计算），20261003 清理删除

// 库中 datetime 串统一格式化为 yyyy-mm-dd 显示：非法值原样返回，空值返回空串
// （各页列表/导出曾逐字重复定义，20260914 收敛于此）
export const formatDate = (value?: string) => {
  if (!value) {
    return '';
  }
  const date = dayjs(value);
  return date.isValid() ? date.format('YYYY-MM-DD') : value;
};

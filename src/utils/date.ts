// 获取常用时间
import dayjs from 'dayjs';

export const LAST_7_DAYS = [
  dayjs().subtract(7, 'day').format('YYYY-MM-DD'),
  dayjs().subtract(1, 'day').format('YYYY-MM-DD'),
];

export const LAST_30_DAYS = [
  dayjs().subtract(30, 'day').format('YYYY-MM-DD'),
  dayjs().subtract(1, 'day').format('YYYY-MM-DD'),
];

// 库中 datetime 串统一格式化为 yyyy-mm-dd 显示：非法值原样返回，空值返回空串
// （各页列表/导出曾逐字重复定义，20260914 收敛于此）
export const formatDate = (value?: string) => {
  if (!value) {
    return '';
  }
  const date = dayjs(value);
  return date.isValid() ? date.format('YYYY-MM-DD') : value;
};

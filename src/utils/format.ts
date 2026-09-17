// 价格千分位展示：room.priceString 列删除后，价格展示统一由数值 price 格式化 20260910 新增,
export const formatPrice = (value: number | string | null | undefined): string => {
  if (value === null || value === undefined || String(value).trim() === '') return '';
  const normalized = String(value).replace(/,/g, '');
  return /^\d+(?:\.\d+)?$/.test(normalized) ? Number(normalized).toLocaleString('en-US') : String(value);
};

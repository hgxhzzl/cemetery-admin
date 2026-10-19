/**
 * 卡片列表长文本截断公共工具。
 * 口径（原 6 个卡片页 gravePlotBusiness/adminfee/reserve/transferOut/buried/contacts 逐字重复，收敛去重 20261019）：
 * 超过 maxLength（默认 7）字时显示前 maxLength-1 字 + 4 个半角点，
 * 悬停 tooltip 展示完整内容（配合 t-tooltip 的 v-if="isOverflow(...)" 使用）。
 */
export const truncateCardText = (value?: string | null, maxLength = 7) => {
  const text = String(value || '');
  return text.length > maxLength ? `${text.slice(0, maxLength - 1)}....` : text;
};

/** 是否超过 maxLength 字需要截断并显示悬停提示 */
export const isCardTextOverflow = (value?: string | null, maxLength = 7) => String(value || '').length > maxLength;

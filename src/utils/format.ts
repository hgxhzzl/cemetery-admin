// 价格千分位展示：room.priceString 列删除后，价格展示统一由数值 price 格式化 20260910 新增,
export const formatPrice = (value: number | string | null | undefined): string => {
  if (value === null || value === undefined || String(value).trim() === '') return '';
  const normalized = String(value).replace(/,/g, '');
  return /^\d+(?:\.\d+)?$/.test(normalized) ? Number(normalized).toLocaleString('en-US') : String(value);
};

// 中文大写数字与整数位单位（票据打印用）20260921 新增
const CN_DIGITS = '零壹贰叁肆伍陆柒捌玖';
const CN_INT_UNITS = ['', '拾', '佰', '仟'];
const CN_GROUP_UNITS = ['', '万', '亿', '万亿'];

// 四位一组转中文大写，如 0600 → 陆佰，全零组返回空 20260921 新增
const sectionToChinese = (section: string): { text: string; hasNonZero: boolean } => {
  let text = '';
  let zero = false;
  let hasNonZero = false;
  for (let i = 0; i < section.length; i++) {
    const digit = Number(section[i]);
    const pos = section.length - 1 - i;
    if (digit === 0) {
      zero = true;
    } else {
      if (zero && text !== '') text += '零';
      zero = false;
      text += CN_DIGITS[digit] + CN_INT_UNITS[pos];
      hasNonZero = true;
    }
  }
  return { text, hasNonZero };
};

// 金额转中文大写（票据打印用）：支持最多两位小数，如 20600 → 贰万零陆佰元整 20260921 新增
export const formatChineseCurrency = (value: number | string | null | undefined): string => {
  if (value === null || value === undefined || String(value).trim() === '') return '';
  const normalized = String(value).replace(/,/g, '');
  if (!/^\d+(?:\.\d+)?$/.test(normalized)) return String(value);

  const [intPart, decPart = ''] = normalized.split('.');
  // 整数部分从右往左按四位分组（如 12345678 → 1234/5678），再逐组转换拼组单位
  const sections: string[] = [];
  let remain = intPart;
  while (remain.length > 4) {
    sections.unshift(remain.slice(-4));
    remain = remain.slice(0, -4);
  }
  sections.unshift(remain);

  const converted = sections.map((section) => sectionToChinese(section));
  let intChinese = '';
  for (let i = 0; i < converted.length; i++) {
    const { text, hasNonZero } = converted[i];
    if (!hasNonZero) continue;
    intChinese += text + (CN_GROUP_UNITS[converted.length - 1 - i] ?? '');
    // 本组不足四位且后续还有非零组时补零（如 100000001 → 壹亿零壹）
    const restHasNonZero = converted.slice(i + 1).some((item) => item.hasNonZero);
    if (sections[i].length < 4 && restHasNonZero) {
      intChinese += '零';
    }
  }
  if (!intChinese) intChinese = '零';

  // 小数部分：角/分逐位转换（数值为零的位跳过），缺位按规范补零或整
  const jiaoDigit = decPart.length >= 1 ? Number(decPart[0]) : 0;
  const fenDigit = decPart.length >= 2 ? Number(decPart[1]) : 0;
  const jiao = jiaoDigit > 0 ? CN_DIGITS[jiaoDigit] : '';
  const fen = fenDigit > 0 ? CN_DIGITS[fenDigit] : '';
  let suffix = '元整';
  if (jiao && !fen) suffix = `元${jiao}角整`;
  else if (!jiao && fen) suffix = `元零${fen}分`;
  else if (jiao && fen) suffix = `元${jiao}角${fen}分`;
  return intChinese + suffix;
};

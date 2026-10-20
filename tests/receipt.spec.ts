import dayjs from 'dayjs';
import { describe, expect, it } from 'vitest';

import type { ReceiptData } from '@/utils/receipt';
import { buildReceiptBody, buildReceiptHtml, escapeHtml, numToChinese } from '@/utils/receipt';

// 票据为中文单据，版式复刻原系统 PowerBuilder 专用票据；
// 这里锁定的是"内容口径"（编号/汉字位置/转义/行结构），像素版式仍靠人工比对打印预览
const baseData = {
  payer: '李四',
  realPriceString: '1,234.50',
  payee: '王收款',
  serialNo: 'A012',
  createDate: '2026-09-05',
  region: '福东',
  park: '慈仪园',
  yNum: '37',
  xNum: '5',
  userName: '张经办',
} satisfies ReceiptData;
const config = { prefix: '某某陵园', phone: '0551-88888888', address: '某市某路1号' };

describe('receipt: 数字转汉字（票据位置行/安葬证排号）', () => {
  it('万以内整数按中文数字读法', () => {
    expect(numToChinese('5')).toBe('五');
    expect(numToChinese('37')).toBe('三十七');
    expect(numToChinese('105')).toBe('一百零五');
    expect(numToChinese('1005')).toBe('一千零五');
  });

  it('十位省略"一"、中间零只补一个、末位零不出声', () => {
    expect(numToChinese('10')).toBe('十');
    expect(numToChinese('12')).toBe('十二');
    expect(numToChinese('110')).toBe('一百一十');
    expect(numToChinese('1050')).toBe('一千零五十');
  });

  it('边界与前导零', () => {
    expect(numToChinese('0')).toBe('零');
    expect(numToChinese('0012')).toBe('十二');
    // 超万位不做转换（原样返回，避免读出错误单位）
    expect(numToChinese('10000')).toBe('10000');
  });

  it('非数字与空值原样返回，不抛异常', () => {
    expect(numToChinese('甲')).toBe('甲');
    expect(numToChinese('37号')).toBe('37号');
    expect(numToChinese('')).toBe('');
    expect(numToChinese(undefined as unknown as string)).toBe('');
    expect(numToChinese(null as unknown as string)).toBe('');
  });
});

describe('receipt: HTML 转义', () => {
  it('转义 & < > "（表单内容不得注入打印文档）', () => {
    expect(escapeHtml('<script>alert(1)</script>')).toBe('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(escapeHtml('a&b"c')).toBe('a&amp;b&quot;c');
  });

  it('单引号不转义（当前口径：票据为文本节点与双引号属性，无单引号属性上下文）', () => {
    expect(escapeHtml("O'Neil")).toBe("O'Neil");
  });
});

describe('receipt: 票据内容组装', () => {
  it('标题 = 配制前缀 + 票据名，销售与管理费后缀不同', () => {
    expect(buildReceiptBody(baseData, config, 'sale')).toContain('<h1 class="receipt__title">某某陵园专用票据</h1>');
    expect(buildReceiptBody(baseData, config, 'adminfee')).toContain(
      '<h1 class="receipt__title">某某陵园管理费票据</h1>',
    );
  });

  it('标题前缀同样走转义，配制字段不能注入文档', () => {
    const body = buildReceiptBody(baseData, { ...config, prefix: '<b>甲</b>' }, 'sale');
    expect(body).toContain('&lt;b&gt;甲&lt;/b&gt;专用票据');
    expect(body).not.toContain('<b>甲</b>专用票据');
  });

  it('票据编号 = 创建日期 yyyymm + 墓位编号', () => {
    expect(buildReceiptBody(baseData, config)).toContain('No：202609A012');
  });

  it('新建未保存（无创建日期）时回退当天月份与当天日期', () => {
    const body = buildReceiptBody({ ...baseData, createDate: '' }, config);
    expect(body).toContain(`No：${dayjs().format('YYYYMM')}A012`);
    expect(body).toContain(`日期：${dayjs().format('YYYY-MM-DD')}`);
  });

  it('表单值与排号座号均转义，且排号/座号先转汉字再转义', () => {
    const body = buildReceiptBody({ ...baseData, payer: '  <i>甲</i>  ', yNum: '<b>37</b>' }, config);
    // 交款人前后空格被 trim
    expect(body).toContain('&lt;i&gt;甲&lt;/i&gt;');
    expect(body).not.toContain('<i>甲</i>');
    // 非数字排号原样输出但被转义
    expect(body).toContain('&lt;b&gt;37&lt;/b&gt;');
  });

  it('墓位位置行六栏：园区/区/排号汉字/排/座号汉字/号', () => {
    const row = buildReceiptBody(baseData, config).match(/<tr>\s*<th>墓位位置<\/th>[\s\S]*?<\/tr>/)?.[0] ?? '';
    expect(row).toContain('慈仪园');
    expect(row).toContain('三十七');
    expect(row).toContain('五');
    ['墓位位置', '区', '排', '号'].forEach((cap) => expect(row).toContain(cap));
  });

  it('金额行：小写保留千分位两位小数，大写由 formatChineseCurrency 出', () => {
    const body = buildReceiptBody(baseData, config);
    expect(body).toContain('（小写）1,234.50');
    expect(body).toContain('人民币（大写）');
    expect(body).toContain('元');
  });

  it('非法金额不炸文档，原样回落文本', () => {
    const body = buildReceiptBody({ ...baseData, realPriceString: '面议' }, config);
    expect(body).toContain('（小写）面议');
  });

  it('管理费票据多出起止日期行，销售票据没有', () => {
    const sale = buildReceiptBody(baseData, config, 'sale');
    const adminfee = buildReceiptBody(
      { ...baseData, startDate: '2026-01-01', endDate: '2026-12-31' },
      config,
      'adminfee',
    );
    expect(sale).not.toContain('开始日期');
    expect(adminfee).toContain('开始日期');
    expect(adminfee).toContain('2026-01-01');
    expect(adminfee).toContain('2026-12-31');
  });

  it('起止日期空值原样留空，不写成 Invalid Date', () => {
    const adminfee = buildReceiptBody({ ...baseData, startDate: '', endDate: undefined }, config, 'adminfee');
    expect(adminfee).not.toContain('Invalid Date');
  });

  it('页脚带地址/电话/经办人', () => {
    const body = buildReceiptBody(baseData, config);
    expect(body).toContain('地址：某市某路1号');
    expect(body).toContain('电话：0551-88888888');
    expect(body).toContain('经办人：张经办');
    expect(body).toContain('单位盖章：');
  });

  it('完整文档含样式骨架，且屏幕媒体下隐藏票据（仅打印预览可见）', () => {
    const html = buildReceiptHtml(baseData, config, 'sale');
    expect(html.startsWith('<!DOCTYPE html>')).toBe(true);
    expect(html).toContain('<title>票据</title>');
    expect(html).toContain('.receipt__title');
    expect(html).toMatch(/@media screen\s*\{\s*\.receipt\s*\{\s*display: none;/);
    expect(html).toContain('某某陵园专用票据');
  });

  it('缺省配制参数不抛异常（管理费页等调用方可能没传配制）', () => {
    expect(() => buildReceiptBody(baseData)).not.toThrow();
    expect(buildReceiptBody(baseData)).toContain('<h1 class="receipt__title">专用票据</h1>');
  });
});

// ============================================================
// 票据打印公共工具：销售开单/管理费收款票据内容组装（隐藏 iframe 打印）20260922 抽取
// 票据为中文单据不随语言切换，样式复刻纸制票据（标题/日期编号/表格/页脚）
// ============================================================
import dayjs from 'dayjs';

import { formatChineseCurrency } from '@/utils/format';

// 票据数据：销售页组装后传入 20260922 新增
export interface ReceiptData {
  payer: string;
  realPriceString: string;
  payee: string;
  serialNo: string;
  // 销售记录创建日期，票据编号取 yyyymmdd 前缀；新建未保存时为空回退当天日期 20260922 新增
  createDate: string;
  region: string;
  park: string;
  yNum: string;
  xNum: string;
  // 墓位编号，墓穴位置栏与区域拼接展示 20260922 新增
  xyNumber: string;
  userName: string;
  // 管理费票据扩展：编号后缀取墓位卡号，起止日期行取收款记录起止日期 20260922 新增
  cardno?: string;
  startDate?: string;
  endDate?: string;
}

// 票据类型：销售开单专用票据 / 管理费票据，标题、编号后缀与表格行结构不同 20260922 新增
export type ReceiptKind = 'sale' | 'adminfee';

// 收据配制（前缀/电话/地址）：按区域查询，未配制时回退空字符串 20260922 新增
export interface ReceiptConfigData {
  prefix: string;
  phone: string;
  address: string;
}

// HTML 转义，防止表单内容注入票据页面 20260921 新增
const escapeHtml = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// 组装票据内容片段（不含文档骨架与样式）20260922 新增
// 标题取收据配制前缀、金额行三栏（交款金额/大写/小写）、墓穴位置行两栏（区域+园区+编号）、页脚地址电话取配制 20260922 修改
// 管理费票据：标题后缀改“管理费票据”、编号后缀取墓位卡号、墓穴位置行下增加起止日期四栏行 20260922 修改
export const buildReceiptBody = (
  data: ReceiptData,
  config: ReceiptConfigData = { prefix: '', phone: '', address: '' },
  kind: ReceiptKind = 'sale',
) => {
  const realPrice = Number(String(data.realPriceString).replace(/,/g, ''));
  const amountText = Number.isFinite(realPrice)
    ? realPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : String(data.realPriceString ?? '');
  // 票据编号 = 创建日期 yyyymmdd + 编号后缀（销售取表单编号、管理费取墓位卡号），创建日期为空时回退当天日期 20260922 修改
  const serialDate = data.createDate ? dayjs(data.createDate).format('YYYYMMDD') : dayjs().format('YYYYMMDD');
  const serialSuffix = kind === 'adminfee' ? String(data.cardno ?? '').trim() : data.serialNo.trim();
  const serialText = `${serialDate}${serialSuffix}`;
  // 标题 = 收据配制前缀 + 票据名（销售“专用票据”/管理费“管理费票据”）；墓穴位置 = 区域 + 园区 + 墓位编号 20260922 修改
  const titleText = `${escapeHtml(config.prefix)}${kind === 'adminfee' ? '管理费票据' : '专用票据'}`;
  const locationText = `${escapeHtml(data.region)}${escapeHtml(data.park)}${escapeHtml(data.xyNumber)}`;
  // 起止日期统一 yyyy-mm-dd 展示，空值原样返回 20260922 新增
  const dateText = (value?: string) => {
    const text = String(value ?? '').trim();
    return text && dayjs(text).isValid() ? dayjs(text).format('YYYY-MM-DD') : text;
  };
  // 管理费票据为四栏表格（墓穴位置行下多起止日期行），其余行值栏 colspan 覆盖三栏；销售票据为三栏 20260922 新增
  const isAdminfee = kind === 'adminfee';
  const valueColSpan = isAdminfee ? 3 : 2;
  // 管理费票据起止日期行：四栏（开始日期/结束日期 标题+值），位于墓穴位置行下方 20260922 新增
  const adminfeeDateRow = isAdminfee
    ? `
      <tr>
        <th>开始日期</th>
        <td class="receipt__value">${escapeHtml(dateText(data.startDate))}</td>
        <th>结束日期</th>
        <td class="receipt__value">${escapeHtml(dateText(data.endDate))}</td>
      </tr>`
    : '';

  return `
  <div class="receipt">
    <h1 class="receipt__title">${titleText}</h1>
    <div class="receipt__meta">
      <span>日期：${dayjs().format('YYYY-MM-DD')}</span>
      <span>编号：${serialText}</span>
    </div>
    <table class="receipt__table">
      <tr>
        <th>付款人</th>
        <td class="receipt__value" colspan="${valueColSpan}">${escapeHtml(data.payer.trim())}</td>
      </tr>
      <tr>
        <th>交款金额</th>
        <td class="receipt__value"${isAdminfee ? ' colspan="2"' : ''}>${formatChineseCurrency(realPrice)}</td>
        <td class="receipt__value">（小写）¥${amountText}</td>
      </tr>
      <tr>
        <th>墓穴位置</th>
        <td class="receipt__value" colspan="${valueColSpan}">${locationText}</td>
      </tr>${adminfeeDateRow}
      <tr>
        <th>收款人</th>
        <td class="receipt__value" colspan="${valueColSpan}">${escapeHtml(data.payee.trim())}</td>
      </tr>
    </table>
    <div class="receipt__footer">
      <div class="receipt__footer-left">
        <span>地址：${escapeHtml(config.address)}</span>
        <span>电话：${escapeHtml(config.phone)}</span>
      </div>
      <div class="receipt__footer-right">
        <span>经办人：${escapeHtml(data.userName)}</span>
      </div>
    </div>
  </div>`;
};

// 票据打印样式：内联进完整文档，新标签页打印时生效 20260922 修改
// 屏幕媒体下隐藏票据内容页（不显示中间页），票据仅在打印预览（print 媒体）展示 20260922 新增
const RECEIPT_STYLE = `
  @page { size: a4; margin: 0; }
  html, body { margin: 0; padding: 0; background: #fff; }
  body { padding: 32px 40px; font-family: SimSun, '宋体', serif; color: #000; }
  .receipt { width: 760px; margin: 0 auto; padding: 26px 30px; box-sizing: border-box; }
  .receipt__title { margin: 0 0 16px; font-size: 24px; font-weight: 700; letter-spacing: 3px; text-align: center; }
  .receipt__meta { display: flex; justify-content: space-between; margin-bottom: 14px; font-size: 14px; }
  table.receipt__table { width: 100%; border-collapse: collapse; font-size: 15px; }
  table.receipt__table th, table.receipt__table td { padding: 10px 12px; border: 1px solid #000; font-weight: 400; text-align: center; }
  table.receipt__table th { width: 92px; }
  table.receipt__table td.receipt__value { text-align: left; }
  .receipt__footer { display: flex; align-items: center; justify-content: space-between; margin-top: 22px; font-size: 14px; }
  .receipt__footer-left { display: flex; gap: 28px; }
  /* 屏幕不显示票据内容页（中间页）及任何提示，仅打印预览展示票据；CSS 仅支持块注释，不能用 // 行注释 20260922 修复 */
  @media screen {
    .receipt { display: none; }
  }
`;

// 组装完整票据文档（含内联样式），写入新标签页后自动唤起打印预览；kind 区分销售/管理费票据 20260922 修改
export const buildReceiptHtml = (data: ReceiptData, config: ReceiptConfigData, kind: ReceiptKind = 'sale') =>
  `<!DOCTYPE html><html><head><meta charset="utf-8" /><title>票据</title><style>${RECEIPT_STYLE}</style></head><body>${buildReceiptBody(data, config, kind)}</body></html>`;

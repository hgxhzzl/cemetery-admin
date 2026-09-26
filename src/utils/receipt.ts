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
  // 墓位卡号：票据编号后缀 yyyymm+卡号，销售/管理费票据统一取该值 20260926 修改
  cardno: string;
  // 销售记录创建日期，票据编号取 yyyymm 前缀；新建未保存时为空回退当天日期 20260922 新增
  createDate: string;
  region: string;
  park: string;
  // 排/号：墓穴位置行第三/五栏数字转汉字展示（如 37→三十七），替代原拼接编号 20260926 修改
  yNum: string;
  xNum: string;
  userName: string;
  // 管理费票据扩展：起止日期行取收款记录起止日期 20260922 新增
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

// HTML 转义，防止表单内容注入票据/安葬证打印页面（导出供安葬证工具复用）20260921 新增 20260926 修改
export const escapeHtml = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// 数字转汉字（票据位置行/安葬证位置排号座号）：万以内整数转中文数字（37→三十七、5→五、105→一百零五），非数字原样返回 20260926 新增 20260926 导出复用
export const numToChinese = (value: string): string => {
  const text = String(value ?? '').trim();
  if (!/^\d+$/.test(text)) return text;
  const num = Number(text);
  if (num === 0) return '零';
  const chars = text.replace(/^0+/, '');
  if (chars.length > 4) return text;
  const digits = '零一二三四五六七八九';
  const units = ['', '十', '百', '千'];
  let result = '';
  // 中间零只补一个（1005→一千零五），末位零省略（10→十）
  let pendingZero = false;
  chars.split('').forEach((char, index) => {
    const digit = Number(char);
    const unit = units[chars.length - 1 - index];
    if (digit === 0) {
      if (result && index < chars.length - 1) pendingZero = true;
      return;
    }
    if (pendingZero) {
      result += '零';
      pendingZero = false;
    }
    // 最高位十位为 1 时省略“一”（12→十二），低位十位保留（110→一百一十）
    if (digit === 1 && unit === '十' && !result) {
      result += unit;
      return;
    }
    result += digits[digit] + unit;
  });
  return result;
};

// 组装票据内容片段（不含文档骨架与样式）20260922 新增
// 版式参照原系统 PowerBuilder 专用票据：标题/日期+No 行/四行表格（外框粗内线细）/单行页脚 20260926 修改
// 标题取收据配制前缀、金额行三栏（人民币大写/小写/元）、墓穴位置行六栏（园区名称/区/排号汉字/排/座号汉字/号，占用七列网格后六列）、页脚地址电话取配制 20260926 修改
// 管理费票据：标题后缀改“管理费票据”、编号后缀取墓位卡号、墓穴位置行下增加起止日期两行 20260922 修改
export const buildReceiptBody = (
  data: ReceiptData,
  config: ReceiptConfigData = { prefix: '', phone: '', address: '' },
  kind: ReceiptKind = 'sale',
) => {
  const realPrice = Number(String(data.realPriceString).replace(/,/g, ''));
  const amountText = Number.isFinite(realPrice)
    ? realPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : String(data.realPriceString ?? '');
  // 票据编号 = 创建日期 yyyymm + 墓位卡号，创建日期为空时回退当天日期 20260926 修改
  const serialDate = data.createDate ? dayjs(data.createDate).format('YYYYMM') : dayjs().format('YYYYMM');
  const serialText = `${serialDate}${String(data.cardno ?? '').trim()}`;
  // 标题 = 收据配制前缀 + 票据名（销售“专用票据”/管理费“管理费票据”）20260922 修改
  const titleText = `${escapeHtml(config.prefix)}${kind === 'adminfee' ? '管理费票据' : '专用票据'}`;
  // 墓穴位置行六栏（园区名称/区/排号汉字/排/座号汉字/号）直接占用外层七列网格后六列：栏数与分隔线同原系统专用票据版式 20260926 修改
  const positionRow = `
      <tr>
        <th>墓穴位置</th>
        <td class="receipt__position-area">${escapeHtml(data.park)}</td>
        <td>区</td>
        <td>${escapeHtml(numToChinese(data.yNum))}</td>
        <td>排</td>
        <td>${escapeHtml(numToChinese(data.xNum))}</td>
        <td>号</td>
      </tr>`;
  // 日期行取业务创建日期，格式 yyyy-mm-dd，新建未保存时回退当天；编号标签同原系统票据“No：” 20260926 修改
  const printDateText =
    data.createDate && dayjs(data.createDate).isValid()
      ? dayjs(data.createDate).format('YYYY-MM-DD')
      : dayjs().format('YYYY-MM-DD');
  // 起止日期统一 yyyy-mm-dd 展示，空值原样返回 20260922 新增
  const dateText = (value?: string) => {
    const text = String(value ?? '').trim();
    return text && dayjs(text).isValid() ? dayjs(text).format('YYYY-MM-DD') : text;
  };
  // 表格统一七列网格：金额行大写跨 3 列/小写跨 2 列/元 1 列，墓穴位置行六栏占后六列，其余行值栏 colspan 覆盖六值栏；
  // 金额行与位置行在园区|排、排号座号|号两处竖线共用（同 PB x=2144/2725 贯穿线）20260926 修改
  const isAdminfee = kind === 'adminfee';
  // 管理费票据开始/结束日期一行四栏（PB 版式）：开始值 864 PBU≈216px 映射列2、结束日期标签 626 PBU≈156px 映射列3+4、
  // 结束值 786 PBU≈196px 映射列5+6+7（PB x=2725 竖线仅至位置行底 y=744，日期行结束值直达右框 x=2930），位于墓穴位置行下方 20260926 修改
  const adminfeeDateRow = isAdminfee
    ? `
      <tr>
        <th>开始日期</th>
        <td class="receipt__date-value">${escapeHtml(dateText(data.startDate))}</td>
        <td class="receipt__date-cap" colspan="2">结束日期</td>
        <td class="receipt__date-value" colspan="3">${escapeHtml(dateText(data.endDate))}</td>
      </tr>`
    : '';

  return `
  <div class="receipt${kind === 'adminfee' ? ' receipt--adminfee' : ''}">
    <h1 class="receipt__title">${titleText}</h1>
    <div class="receipt__meta">
      <span>日期：${printDateText}</span>
      <span>No：${serialText}</span>
    </div>
    <table class="receipt__table">
      <!-- 七列网格全部定宽同 PB 竖线：表头 140px、区域名 227px、区 57px、园区 82px、排 60px、排号+座号 85px、号 51px；
           金额行大写跨 3 列、小写跨 2 列、元 1 列，与位置行在园区|排（PB x=2144）与排号座号|号（PB x=2725）竖线共用对齐 20260926 修改 -->
      <colgroup>
        <col class="receipt__col-label" />
        <col class="receipt__col-pos-area" />
        <col class="receipt__col-pos-parkcap" />
        <col class="receipt__col-pos-park" />
        <col class="receipt__col-pos-rowcap" />
        <col class="receipt__col-pos-ynum" />
        <col class="receipt__col-pos-numcap" />
      </colgroup>
      <tr>
        <th>交款人</th>
        <td class="receipt__value" colspan="6">${escapeHtml(data.payer.trim())}</td>
      </tr>
      <tr>
        <th>交款金额</th>
        <td class="receipt__value" colspan="3"><span class="receipt__amount-caption">人民币（大写）</span>${formatChineseCurrency(realPrice)}</td>
        <td class="receipt__value" colspan="2">（小写）${amountText}</td>
        <td class="receipt__value receipt__amount-unit">元</td>
      </tr>
      ${positionRow}${adminfeeDateRow}
      <tr>
        <th>收款人</th>
        <td class="receipt__value" colspan="6">${escapeHtml(data.payee.trim())}</td>
      </tr>
    </table>
    <div class="receipt__footer">
      <span>地址：${escapeHtml(config.address)}</span>
      <span>电话：${escapeHtml(config.phone)}</span>
      <span>单位盖章：</span>
      <span>经办人：${escapeHtml(data.userName)}</span>
    </div>
  </div>`;
};

// 票据打印样式：内联进完整文档，新标签页打印时生效 20260922 修改
// 尺寸复刻原系统 PowerBuilder 专用票据（1 PBU ≈ 0.25px）：容器宽 2834 PBU=709px、标题 18pt、表格 11pt/行高 40px/
// 表头列 140px、页脚 10pt、打印边距上 9px 左右 11px；线宽外框 2px/内线 1px 近似 PB 9/5 线宽 20260926 修改
// 屏幕媒体下隐藏票据内容页（不显示中间页），票据仅在打印预览（print 媒体）展示 20260922 新增
const RECEIPT_STYLE = `
  @page { size: a4; margin: 0; }
  html, body { margin: 0; padding: 0; background: #fff; }
  /* 打印边距复刻 PB print.margin：上 96/1000 英寸≈9px、左右 110/1000 英寸≈11px，票据靠纸左上同 PB 打印 20260926 修改 */
  body { padding: 9px 11px; font-family: SimSun, '宋体', serif; color: #000; }
  /* 容器宽 709px（PB 2834 PBU）水平居中，上留白 18px（标题 y=72 PBU）；标题高 27px、至日期行 22px 同 PB 版式 20260926 修改 */
  .receipt { width: 709px; margin: 0 auto; padding: 18px 0 0; }
  .receipt__title { margin: 0 0 22px; font-size: 18pt; font-weight: 700; line-height: 27px; text-align: center; }
  /* 日期行 11pt、距表格 6px；No 固定左移 322px（PB x=1385）而非顶满右缘 20260926 修改 */
  .receipt__meta { position: relative; margin-bottom: 6px; font-size: 11pt; }
  .receipt__meta span:last-child { position: absolute; left: 322px; }
  /* 表格外框 2px 粗线、内部 1px 细线近似 PB 9/5 线宽；fixed 布局严格按列组定宽保证元列与号栏同宽对齐；
     行高 40px、表头列 140px、文本 11pt/行高 17px、超长截断同 PB 固定宽控件 20260926 修改 */
  table.receipt__table { width: 100%; table-layout: fixed; border-collapse: collapse; border: 2px solid #000; font-size: 11pt; }
  /* 七列网格全部固定同 PB 竖线分割：表头 140px、区域名 227px、区 57px、园区 82px、排 60px、排号+座号 85px、号 51px；
     金额行大写跨区域名/区/园区（366px）、小写跨排/排号座号（145px）、元=号列（51px）共用竖线 20260926 修改 */
  table.receipt__table col.receipt__col-label { width: 140px; }
  table.receipt__table col.receipt__col-pos-area { width: 227px; }
  table.receipt__table col.receipt__col-pos-parkcap { width: 57px; }
  table.receipt__table col.receipt__col-pos-park { width: 82px; }
  table.receipt__table col.receipt__col-pos-rowcap { width: 60px; }
  table.receipt__table col.receipt__col-pos-ynum { width: 85px; }
  table.receipt__table col.receipt__col-pos-numcap { width: 51px; }
  table.receipt__table th, table.receipt__table td { height: 40px; padding: 0 8px; border: 1px solid #000; font-weight: 400; line-height: 17px; text-align: center; white-space: nowrap; overflow: hidden; }
  table.receipt__table th { width: 140px; }
  table.receipt__table td.receipt__value { text-align: left; }
  /* 金额行：大写栏自动占余宽（内含“人民币（大写）”标题），小写/元列宽由列组定宽，元列居中同原版式 20260926 修改 */
  table.receipt__table td.receipt__amount-unit { text-align: center; }
  .receipt__amount-caption { color: #333; }
  /* 管理费票据行高 128 PBU=32px（销售票据 160 PBU=40px），起止日期行值居中同 PB 版式 20260926 新增 */
  .receipt--adminfee table.receipt__table th,
  .receipt--adminfee table.receipt__table td { height: 32px; }
  table.receipt__table td.receipt__date-value { text-align: center; }
  table.receipt__table td.receipt__date-cap { text-align: center; }
  /* 墓穴位置行六栏直接占用外层七列网格后六列：园区名称左对齐、其余居中，排号/座号数字转汉字 20260926 修改 */
  table.receipt__table td.receipt__position-area { text-align: left; }
  /* 页脚单行 10pt/行高 15px：地址占余宽、电话/单位盖章/经办人定宽，距表格 17px 同原系统票据页脚 20260926 修改 */
  .receipt__footer { display: flex; align-items: center; margin-top: 17px; font-size: 10pt; line-height: 15px; }
  .receipt__footer span:first-child { flex: 1; }
  .receipt__footer span:nth-child(2) { width: 151px; }
  .receipt__footer span:nth-child(3) { width: 92px; }
  .receipt__footer span:nth-child(4) { width: 126px; }
  /* 屏幕不显示票据内容页（中间页）及任何提示，仅打印预览展示票据；CSS 仅支持块注释，不能用 // 行注释 20260922 修复 */
  @media screen {
    .receipt { display: none; }
  }
`;

// 组装完整票据文档（含内联样式），写入新标签页后自动唤起打印预览；kind 区分销售/管理费票据 20260922 修改
export const buildReceiptHtml = (data: ReceiptData, config: ReceiptConfigData, kind: ReceiptKind = 'sale') =>
  `<!DOCTYPE html><html><head><meta charset="utf-8" /><title>票据</title><style>${RECEIPT_STYLE}</style></head><body>${buildReceiptBody(data, config, kind)}</body></html>`;

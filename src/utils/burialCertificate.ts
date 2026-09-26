// ============================================================
// 安葬证打印公共工具：墓位业务页下葬形态打印安葬证（新标签页打印）20260926 新增
// 安葬证为中文证书不随语言切换，版式固定尺寸（A4 居中、双线框、标题/正文/落款）
// ============================================================
import dayjs from 'dayjs';

import { escapeHtml, numToChinese } from '@/utils/receipt';

// 安葬证数据：墓位业务页下葬形态组装后传入 20260926 新增
export interface BurialCertData {
  // 逝者姓名
  deceased: string;
  // 安葬日期（YYYY-MM-DD），空值回退当天
  burialDate: string;
  // 墓位位置：园区名称/排号/座号（排号座号数字转汉字展示）
  park: string;
  yNum: string;
  xNum: string;
  // 墓位卡号：安葬证编号后缀 yyyymm+卡号，同票据编号规则 20260926 新增
  cardno: string;
  // 下葬记录创建日期：安葬证编号取 yyyymm 前缀；为空回退当天 20260926 新增
  createDate: string;
}

// 收据配制（前缀）：安葬证落款单位与票据共用同一配制 20260926 新增
export interface BurialCertConfigData {
  prefix: string;
}

// 日期转“YYYY年MM月DD日”，空值/无效回退当天 20260926 新增
const certDateText = (value: string) => {
  const date = value && dayjs(value).isValid() ? dayjs(value) : dayjs();
  return date.format('YYYY年MM月DD日');
};

// 组装完整安葬证文档（含内联样式），写入新标签页后自动唤起打印预览 20260926 新增
export const buildBurialCertHtml = (data: BurialCertData, config: BurialCertConfigData = { prefix: '' }) => {
  // 安葬证编号 = 下葬记录创建日期 yyyymm + 墓位卡号，创建日期为空时回退当天 20260926 新增
  const serialDate = data.createDate ? dayjs(data.createDate).format('YYYYMM') : dayjs().format('YYYYMM');
  const serialText = `${serialDate}${String(data.cardno ?? '').trim()}`;
  // 墓穴位置一行文本：园区名称 + 排号汉字 + 排 + 座号汉字 + 号 20260926 新增
  const positionText = `${data.park}${numToChinese(data.yNum)}排${numToChinese(data.xNum)}号`;
  const burialDateText = certDateText(data.burialDate);
  const signText = escapeHtml(config.prefix);
  return `<!DOCTYPE html><html><head><meta charset="utf-8" /><title>安葬证</title><style>${BURIAL_CERT_STYLE}</style></head><body>
  <div class="cert">
    <h1 class="cert__title">安葬证</h1>
    <div class="cert__no">No：${serialText}</div>
    <div class="cert__body">
      <p class="cert__line">兹证明逝者<span class="cert__strong">${escapeHtml(data.deceased)}</span></p>
      <p class="cert__line">于<span class="cert__strong">${burialDateText}</span>安葬于本公墓</p>
      <p class="cert__line cert__position">${escapeHtml(positionText)}</p>
      <p class="cert__line">特发此证</p>
    </div>
    <div class="cert__sign">
      <span>${signText}</span>
      <span>${burialDateText}</span>
    </div>
  </div>
</body></html>`;
};

// 安葬证打印样式：内联进完整文档，新标签页打印时生效 20260926 新增
// 固定尺寸：A4 页面、证书 640px 水平居中、双线外框 4px、标题 26pt/行高 40px、正文 14pt/行高 40px、
// 编号与落款 11pt、落款左右两端（单位/日期）；屏幕媒体下隐藏（仅打印预览展示）
const BURIAL_CERT_STYLE = `
  @page { size: a4; margin: 0; }
  html, body { margin: 0; padding: 0; background: #fff; }
  body { padding: 40px 20px; font-family: SimSun, '宋体', serif; color: #000; }
  .cert { width: 640px; margin: 0 auto; padding: 46px 56px 36px; border: 4px double #000; }
  .cert__title { margin: 0 0 14px; font-size: 26pt; font-weight: 700; line-height: 40px; text-align: center; letter-spacing: 12px; }
  .cert__no { margin-bottom: 26px; font-size: 11pt; line-height: 17px; text-align: right; }
  .cert__body p { margin: 0; font-size: 14pt; line-height: 40px; text-align: center; }
  .cert__strong { font-weight: 700; }
  .cert__position { font-weight: 700; }
  .cert__sign { display: flex; justify-content: space-between; margin-top: 60px; font-size: 11pt; line-height: 17px; }
  /* 屏幕不显示安葬证内容页（中间页），仅打印预览展示；CSS 仅支持块注释 */
  @media screen {
    .cert { display: none; }
  }
`;

// ============================================================
// 安葬证打印公共工具（墓位业务页下葬形态，新标签页打印）
// 安葬证为中文证书不随语言切换，版式固定尺寸
// 20260928 新增：安葬证套打版式（打印A/打印B，预印纸上按 PB d_room_card_print / d_room_card_printb 固定位置填字段）
// 20260926 版 A4 整证排版（buildBurialCertHtml）随下葬页安葬证打印按钮移除已无调用方，20261003 清理删除，
// 如需恢复可从 git 历史取回
// ============================================================
import { escapeHtml } from '@/utils/receipt';

// ============================================================
// 安葬证套打（打印A）：原 PB d_room_card_print 套打版式复刻 20260928 新增
// 预印证书纸固定版式，仅在指定位置填三个字段（无边框无背景）
// 换算：1 PBU = 0.25px（4 PBU = 1px）；页边距 110/96 千分英寸 → 11px/9px；
// 字段坐标 = 页边距 + PB 坐标/4；字号 13pt ≈ 17px，行高 88 PBU = 22px
// ============================================================

// 安葬证套打数据：页面组装后传入（对应原 room_card 表三列）20260928 新增
export interface RoomCardOverlayData {
  // 经办人（原 room_card.operate）
  operate: string;
  // 发证日期（原 room_card.dateoperate，yyyy mm dd 格式）
  dateoperate: string;
  // 墓位编号（原 room_card.cardno，20261003 随 room 列重命名为 serialNo）
  serialNo: string;
}

// 组装安葬证套打文档（含内联样式）：三字段绝对定位填入预印纸 20260928 新增
export const buildRoomCardOverlayHtml = (data: RoomCardOverlayData) => {
  // 字段坐标（页边距 11px/9px + PB 坐标/4）：
  // operate x=1733,y=532 → 444px,142px；dateoperate x=1751,y=1052 → 449px,272px；serialNo x=1751,y=1224 → 449px,315px 20260928 新增
  return `<!DOCTYPE html><html><head><meta charset="utf-8" /><title>安葬证打印</title><style>${ROOM_CARD_OVERLAY_STYLE}</style></head><body>
  <span class="overlay-field overlay-field--operate">${escapeHtml(data.operate)}</span>
  <span class="overlay-field overlay-field--dateoperate">${escapeHtml(data.dateoperate)}</span>
  <span class="overlay-field overlay-field--serialNo">${escapeHtml(data.serialNo)}</span>
</body></html>`;
};

// 安葬证套打样式：@page 零边距使字段从纸张左上角定位（坐标已含原打印页边距），
// 屏幕媒体下隐藏字段（中间页不可见，仅打印预览展示）；CSS 仅支持块注释 20260928 新增
const ROOM_CARD_OVERLAY_STYLE = `
  @page { size: a4; margin: 0; }
  html, body { margin: 0; padding: 0; background: #fff; }
  body { font-family: SimSun, '宋体', serif; color: #000; }
  .overlay-field { position: absolute; height: 22px; line-height: 22px; font-size: 17px; white-space: nowrap; }
  .overlay-field--operate { left: 444px; top: 142px; }
  .overlay-field--dateoperate { left: 449px; top: 272px; white-space: pre; }
  .overlay-field--serialNo { left: 449px; top: 315px; }
  @media screen {
    .overlay-field { visibility: hidden; }
  }
`;

// ============================================================
// 安葬证套打B（打印B）：原 PB d_room_card_printb 套打版式复刻 20260928 新增
// 同为预印证书纸固定版式，按 PB 坐标填字段；PB 中 usernameb/c/d 为隐藏列（x=1664 纸面
// 右列纵向三行），合葬打印或分位选三分（表单显示三个安葬者）时补充显示 20260928 修改
// ============================================================

// 安葬证套打B数据：页面组装后传入（对应原 room_card 表列）20260928 新增
export interface RoomCardOverlayBData {
  // 持证人（原 room_card.cardman）
  cardman: string;
  // 逝者关系（原 room_card.relation）
  relation: string;
  // 工作单位（原 room_card.company，小字号）
  company: string;
  // 住址（原 room_card.address，小字号）
  address: string;
  // 安葬者A（原 room_card.usernamea）
  usernamea: string;
  // 安葬日期（原 room_card.dateazrq，yyyy  mm   dd 格式）
  dateazrq: string;
  // 墓位位置行拆两段（原 PB y=908 四段 text）：园区名（右对齐自适应）与
  // 排座号段（左端锚定，排号右缘与安葬日期 mm 两位右缘对齐）20260928 修改
  park: string;
  rowSeat: string;
  // 合葬日期（原 room_card.datehzrq，yyyy  mm   dd 格式）：仅合葬打印显示于下葬日期
  // 正下方，空值回退当天 20260928 新增 20260928 修改
  datehzrq: string;
  // 安葬者B/C/D（原 room_card.usernameb/c/d）：随分位联动显示（同正常打印）20260928 修改
  usernameb: string;
  usernamec: string;
  usernamed: string;
}

// 组装安葬证套打B文档：type=normal 正常打印（全字段）/joint 合葬打印（仅安葬者与
// 合葬日期，其余隐藏）；equalDivision 为分位单选值（'1'一分/'2'二分/'3'三分）。
// 正常打印：全字段 + 合葬日期常显于下葬日期正下方（PB datehzrq x=443,y=1224）；
// 安葬者随分位联动：一分仅 B（17px 同A字号并与A居中），二分 B/C（13px 两行紧贴居中），
// 三分 B/C/D（11px 三行紧贴居中）；合葬打印：仅对应分位的安葬者 + 合葬日期 20260928 新增 20260928 修改
export const buildRoomCardOverlayBHtml = (
  data: RoomCardOverlayBData,
  type: 'normal' | 'joint' = 'normal',
  equalDivision: string = '1',
) => {
  // 合葬日期（两种模式均输出；合葬打印中作为主体字段之一，正常打印中在下葬日期正下方）20260928 新增 20260928 修改
  const hzField = `
  <span class="overlay-b overlay-b--datehzrq">${escapeHtml(data.datehzrq)}</span>`;
  // 安葬者B/C/D（随分位联动，正常/合葬打印相同）：三分全部、二分 B/C、一分仅 B 20260928 修改
  const bcdFields =
    equalDivision === '3'
      ? `
  <span class="overlay-b overlay-b--usernamed">${escapeHtml(data.usernamed)}</span>
  <span class="overlay-b overlay-b--usernamec">${escapeHtml(data.usernamec)}</span>
  <span class="overlay-b overlay-b--usernameb">${escapeHtml(data.usernameb)}</span>`
      : equalDivision === '2'
        ? `
  <span class="overlay-b overlay-b--usernamec overlay-b--two">${escapeHtml(data.usernamec)}</span>
  <span class="overlay-b overlay-b--usernameb overlay-b--two">${escapeHtml(data.usernameb)}</span>`
        : equalDivision === '1'
          ? `
  <span class="overlay-b overlay-b--usernameb overlay-b--one">${escapeHtml(data.usernameb)}</span>`
          : '';
  // 合葬打印：仅安葬者（按分位）+ 合葬日期，其它内容隐藏 20260928 修改
  if (type === 'joint') {
    return `<!DOCTYPE html><html><head><meta charset="utf-8" /><title>安葬证打印</title><style>${ROOM_CARD_OVERLAY_B_STYLE}</style></head><body>${hzField}${bcdFields}
</body></html>`;
  }
  // 正常打印：全字段 + 合葬日期 20260928 修改
  return `<!DOCTYPE html><html><head><meta charset="utf-8" /><title>安葬证打印</title><style>${ROOM_CARD_OVERLAY_B_STYLE}</style></head><body>
  <span class="overlay-b overlay-b--cardman">${escapeHtml(data.cardman)}</span>
  <span class="overlay-b overlay-b--relation">${escapeHtml(data.relation)}</span>
  <span class="overlay-b overlay-b--company">${escapeHtml(data.company)}</span>
  <span class="overlay-b overlay-b--address">${escapeHtml(data.address)}</span>
  <span class="overlay-b overlay-b--usernamea">${escapeHtml(data.usernamea)}</span>
  <span class="overlay-b overlay-b--position-park">${escapeHtml(data.park)}</span>
  <span class="overlay-b overlay-b--position-rowseat">${escapeHtml(data.rowSeat)}</span>
  <span class="overlay-b overlay-b--dateazrq">${escapeHtml(data.dateazrq)}</span>${hzField}${bcdFields}
</body></html>`;
};

// 安葬证套打B样式：坐标换算同 A（页边距 11px/9px + PB 坐标/4）；
// company/address 为 PB font.height=-9 → 11px，位置行为 -10 → 13px，其余 -13 → 17px；
// 位置行拆两段：排座号段左端锚定 177px——安葬日期 17px 数字半宽 8.5px，
// "2008"+两空格后 "07" 占 [173,190]，排号 13px 宽故 left=190-13，排号右缘与
// "07" 右缘重合；园区名段右对齐固定右缘，过长向左溢出（nowrap+text-align:right）20260928 修改
// 安葬者B/C/D（D上C中B下，PB 原顺序）：字号 11px 同住址；行高 11px 紧贴无空白行距；
// 左缘 215.5px 对齐下葬日期日“10”左缘（122+11×8.5）；三行占 [184,217] 中心 200px，
// 与安葬者A（[189,211] 中心 200px）上下居中对齐；日期字段 white-space:pre 保留多空格
// （nowrap 会合并连续空格致日期变短错位）20260928 修改 20260928 修复
// 屏幕媒体下隐藏字段（中间页不可见，仅打印预览展示）；CSS 仅支持块注释 20260928 新增
const ROOM_CARD_OVERLAY_B_STYLE = `
  @page { size: a4; margin: 0; }
  html, body { margin: 0; padding: 0; background: #fff; }
  body { font-family: SimSun, '宋体', serif; color: #000; }
  .overlay-b { position: absolute; height: 22px; line-height: 22px; font-size: 17px; white-space: nowrap; }
  .overlay-b--cardman { left: 98px; top: 24px; }
  .overlay-b--relation { left: 161px; top: 66px; }
  .overlay-b--company { left: 107px; top: 109px; font-size: 11px; }
  .overlay-b--address { left: 107px; top: 152px; font-size: 11px; }
  .overlay-b--usernamea { left: 107px; top: 189px; }
  .overlay-b--position-park { left: 73px; top: 236px; width: 78px; height: 15px; line-height: 15px; font-size: 13px; text-align: right; }
  .overlay-b--position-rowseat { left: 177px; top: 236px; height: 15px; line-height: 15px; font-size: 13px; }
  .overlay-b--dateazrq { left: 122px; top: 271px; white-space: pre; }
  .overlay-b--usernamed { left: 215.5px; top: 184px; height: 11px; line-height: 11px; font-size: 11px; }
  .overlay-b--usernamec { left: 215.5px; top: 195px; height: 11px; line-height: 11px; font-size: 11px; }
  .overlay-b--usernameb { left: 215.5px; top: 206px; height: 11px; line-height: 11px; font-size: 11px; }
  /* 二分专用覆盖（三分基础上字号加大到 13px，两行紧贴并与安葬者A居中）：
     安葬者A 占 [189,211] 中心 200px，两行 13px 行高紧贴占 [187,213] 中心 200px 20260928 新增 */
  .overlay-b--two { font-size: 13px; height: 13px; line-height: 13px; }
  .overlay-b--two.overlay-b--usernamec { top: 187px; }
  .overlay-b--two.overlay-b--usernameb { top: 200px; }
  /* 一分专用覆盖：仅安葬者B，字号 17px 同安葬者A，与A上下居中：
     A 占 [189,211] 中心 200px，B 行高 17px 占 [191.5,208.5] 中心 200px 20260928 新增 */
  .overlay-b--one { font-size: 17px; height: 17px; line-height: 17px; }
  .overlay-b--one.overlay-b--usernameb { top: 191.5px; }
  .overlay-b--datehzrq { left: 122px; top: 315px; white-space: pre; }
  @media screen {
    .overlay-b { visibility: hidden; }
  }
`;

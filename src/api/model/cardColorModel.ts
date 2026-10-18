// 卡片状态配色数据模型：库表 card_color 单行存储，configJson 解析后为本结构 20261011 新增
// 新增 reserved（已预定）态：预定登记只置 room.reserveStatus，与未销售/已销售并列成独立色态 20261017 新增
export type CardColorState = 'unsold' | 'reserved' | 'sold' | 'buried' | 'expired';

export interface CardColorItem {
  // 卡片底色：用户在卡片颜色页设定的主色
  color: string;
  // 外框色：由 color 按固定步长加深得到，页面只读展示（字段仍存库，便于日后单独微调某态外框）20261011 新增
  border: string;
  // 是否着色：false 时该状态卡片回落默认白底细灰框（不着色，非隐藏该墓位）20261011 新增
  isEnabled: boolean;
}

// 五态配色集合：key 固定为 unsold/reserved/sold/buried/expired
export type CardColorConfig = Record<CardColorState, CardColorItem>;

export interface CardColorModel {
  idConfig: number;
  // 库中原文 JSON 串（后端不解析、原样存取）
  configJson: string;
}

export interface ListCardColorResult {
  list: Array<CardColorModel>;
}

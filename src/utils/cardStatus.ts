import dayjs from 'dayjs';

import type { CardColorState } from '@/api/model/cardColorModel';
import { isCardStateEnabled } from '@/utils/cardTheme';

// 卡片状态色最小行字段集：销售状态/预定状态/安葬者/管理费结束日期，RoomModel 及扩展行类型均满足 20260926 新增 20261017 补 reserveStatus
export interface CardStatusRow {
  saleStatus?: string;
  reserveStatus?: string;
  deceased?: string | null;
  endDate?: string | null;
}

// 未销售/已销售/已预定判定（墓位业务页与本页共用同一口径）20261003 新增 20261011 导出已销售判定 20261017 补已预定判定
export const isUnsold = (status?: string) => status === 'statusType.saleStatusEnum.unsold';
export const isSold = (status?: string) => status === 'statusType.saleStatusEnum.sold';
// 已预定：预定登记只置 room.reserveStatus（不动 saleStatus），故按预定状态枚举单独命中 20261017 新增
const isReserved = (status?: string) => status === 'statusType.reserveStatusEnum.reserved';
// 历史 reserve 脏值判定：早期预定登记会把 room.saleStatus 改写为 reserve（20261011 已修正为只写 reserveStatus），
// 现已新增专门的已预定态，此类存量行归入已预定（而非未销售），色语义与新链路一致；仍单独成函数
// 而不并入 isUnsold，因墓位业务页有按钮拿 isUnsold 做禁用判断，这类行本就非 unsold、不影响禁用 20261011 新增 20261017 改归入已预定,
const isLegacyReserved = (status?: string) => status === 'statusType.saleStatusEnum.reserve';

// 各态命中条件：key 与卡片颜色页、配色 CSS 变量同源（unsold/reserved/sold/buried/expired）20261011 新增 20261017 加 reserved,
const STATE_MATCHERS: Record<CardColorState, (row: CardStatusRow) => boolean> = {
  unsold: (row) => isUnsold(row.saleStatus),
  // 已预定：预定状态为 reserved，兼容历史把 saleStatus 写成 reserve 的存量行 20261017 新增
  reserved: (row) => isReserved(row.reserveStatus) || isLegacyReserved(row.saleStatus),
  sold: (row) => isSold(row.saleStatus),
  // 已下葬：安葬者已写入 room.deceased
  buried: (row) => Boolean(row.deceased),
  // 管理期结束日期早于今天（不含当天）即到期
  expired: (row) => Boolean(row.endDate) && dayjs(row.endDate).isBefore(dayjs(), 'day'),
};

// 着色优先级升序：未销售 < 已预定 < 已销售 < 已下葬 < 管理到期（越靠后越优先）20261011 新增 20261017 插入已预定,
const STATE_PRIORITY: CardColorState[] = ['unsold', 'reserved', 'sold', 'buried', 'expired'];

// getCardStatusClass 选项 20261003 新增
export interface CardStatusClassOptions {
  // 本页是否参与“未销售”态（浅橙底 + 橙框）：墓位业务/墓位设置/墓位迁出/收管理费四页均已开启，
  // 默认关闭仅为保留按页回退的能力 20261003
  withUnsold?: boolean;
}

// 卡片状态色类名：只在「卡片颜色页已勾选启用」的态里按优先级取命中的最高一级，
// 一张卡最多下发一个状态类；全部未命中（包括命中态被取消勾选）时返回空串 → 卡片回落默认白底细灰框。
// 例：取消“已下葬”后，已下葬墓位递补为已销售绿；取消“已销售”后，未下葬的已销售墓位无态可命中→白底；
// 取消“未销售”后，未销售墓位白底。三态互斥链旧写法（expired>buried>sold 三选一 + 未销售独立叠加）已废弃 20261011 修改,
// 与墓位业务页共用，供墓位业务/墓位设置/墓位迁出/收管理费四页使用 20260926 新增
export function getCardStatusClass(prefix: string, row?: CardStatusRow | null, options?: CardStatusClassOptions) {
  if (!row) {
    return '';
  }
  let hit: CardColorState | '' = '';
  for (const state of STATE_PRIORITY) {
    // 未销售为按页开关态，其余三态各页均参与判定
    if (state === 'unsold' && !options?.withUnsold) {
      continue;
    }
    // 未勾选的态直接不参与判定，由后面的高优先级态递补
    if (!isCardStateEnabled(state)) {
      continue;
    }
    if (STATE_MATCHERS[state](row)) {
      hit = state;
    }
  }
  return hit ? `${prefix}-card--${hit}` : '';
}

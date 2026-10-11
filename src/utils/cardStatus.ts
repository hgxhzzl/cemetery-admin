import dayjs from 'dayjs';

import type { CardColorState } from '@/api/model/cardColorModel';
import { isCardStateEnabled } from '@/utils/cardTheme';

// 卡片状态色最小行字段集：销售状态/安葬者/管理费结束日期，RoomModel 及扩展行类型均满足 20260926 新增
export interface CardStatusRow {
  saleStatus?: string;
  deceased?: string | null;
  endDate?: string | null;
}

// 未销售/已销售判定（墓位业务页与本页共用同一口径）20261003 新增 20261011 导出已销售判定
export const isUnsold = (status?: string) => status === 'statusType.saleStatusEnum.unsold';
export const isSold = (status?: string) => status === 'statusType.saleStatusEnum.sold';
// 历史 reserve 脏值判定：早期预定登记会把 room.saleStatus 改写为 reserve（20261011 已修正为只写 reserveStatus），
// 存量行归入未销售则不会出现白底无色的空档；单独成函数而不并入 isUnsold，因墓位业务页有按钮拿 isUnsold
// 做禁用判断，合并会放开这类墓位的操作入口 20261011 新增,
const isLegacyReserved = (status?: string) => status === 'statusType.saleStatusEnum.reserve';

// 各态命中条件：key 与卡片颜色页、配色 CSS 变量同源（unsold/sold/buried/expired）20261011 新增,
// 未销售含历史 reserve 脏值：四态里没有预定态，预定中的墓位本质仍未售出；修正写入链路后新预定
// 不再产该值，此处仅为修数据前的存量行兜底（gm_data_003 福东 8排3号 实例）20261011 修改,
const STATE_MATCHERS: Record<CardColorState, (row: CardStatusRow) => boolean> = {
  unsold: (row) => isUnsold(row.saleStatus) || isLegacyReserved(row.saleStatus),
  sold: (row) => isSold(row.saleStatus),
  // 已下葬：安葬者已写入 room.deceased
  buried: (row) => Boolean(row.deceased),
  // 管理期结束日期早于今天（不含当天）即到期
  expired: (row) => Boolean(row.endDate) && dayjs(row.endDate).isBefore(dayjs(), 'day'),
};

// 着色优先级升序：未销售 < 已销售 < 已下葬 < 管理到期（越靠后越优先）20261011 新增,
const STATE_PRIORITY: CardColorState[] = ['unsold', 'sold', 'buried', 'expired'];

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

import dayjs from 'dayjs';

// 卡片外框状态色最小行字段集：销售状态/安葬者/管理费结束日期，RoomModel 及扩展行类型均满足 20260926 新增
export interface CardStatusRow {
  saleStatus?: string;
  deceased?: string;
  endDate?: string | null;
}

// 未销售判定：销售状态为 unsold（与墓位业务页同规则）20261003 新增
export const isUnsold = (status?: string) => status === 'statusType.saleStatusEnum.unsold';

// getCardStatusClass 选项 20261003 新增
export interface CardStatusClassOptions {
  // 是否叠加“未销售”背景态类名（公共 cms-card-status-frame 的 --unsold：浅橙底 + 橙框）；
  // 墓位设置/墓位迁出/收管理费三页均已显式开启，与墓位业务页四态同色；
  // 默认关闭仅为保留按页回退的能力 20261003
  withUnsold?: boolean;
}

// 卡片外框状态色类名：管理到期 > 已下葬 > 已销售（优先级降序，同一卡片只取一种）；
// 未销售背景态独立叠加，可与任一外框状态色共存（与墓位业务页 cardStatusClass 同规则）
// 与墓位业务页同规则，供墓位设置/墓位迁出/收管理费等卡片页共用 20260926 新增 20261003 支持未销售叠加态
export function getCardStatusClass(prefix: string, row?: CardStatusRow | null, options?: CardStatusClassOptions) {
  if (!row) {
    return '';
  }
  const classes: string[] = [];
  // 未销售：浅橙底 + 橙色外框，由卡片外框状态类之外的独立修饰类叠加，仅开启 withUnsold 的页面下发
  if (options?.withUnsold && isUnsold(row.saleStatus)) {
    classes.push(`${prefix}-card--unsold`);
  }
  // 管理期结束日期早于今天（不含当天）即到期
  if (row.endDate && dayjs(row.endDate).isBefore(dayjs(), 'day')) {
    classes.push(`${prefix}-card--expired`);
  } else if (row.deceased) {
    // 已下葬：安葬者已写入 room.deceased
    classes.push(`${prefix}-card--buried`);
  } else if (row.saleStatus === 'statusType.saleStatusEnum.sold') {
    classes.push(`${prefix}-card--sold`);
  }
  return classes.join(' ');
}

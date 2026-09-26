import dayjs from 'dayjs';

// 卡片外框状态色最小行字段集：销售状态/安葬者/管理费结束日期，RoomModel 及扩展行类型均满足 20260926 新增
export interface CardStatusRow {
  saleStatus?: string;
  deceased?: string;
  endDate?: string | null;
}

// 卡片外框状态色类名：管理到期 > 已下葬 > 已销售（优先级降序，同一卡片只取一种）
// 与墓位业务页同规则，供墓位设置/墓位迁出/收管理费等卡片页共用 20260926 新增
export function getCardStatusClass(prefix: string, row?: CardStatusRow | null) {
  if (!row) {
    return '';
  }
  // 管理期结束日期早于今天（不含当天）即到期
  if (row.endDate && dayjs(row.endDate).isBefore(dayjs(), 'day')) {
    return `${prefix}-card--expired`;
  }
  // 已下葬：安葬者已写入 room.deceased
  if (row.deceased) {
    return `${prefix}-card--buried`;
  }
  if (row.saleStatus === 'statusType.saleStatusEnum.sold') {
    return `${prefix}-card--sold`;
  }
  return '';
}

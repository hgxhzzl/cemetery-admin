// 模板遗留的数字枚举（CONTRACT_STATUS / CONTRACT_TYPES / CONTRACT_PAYMENT_TYPES）已废弃：
// 业务状态与类型改为向库中存 i18n 键字符串、显示时走 statusType.* 词条，20261003 清理删除

export const TYPE_USE_STATUS = [
  { label: 'statusType.useStatusEnum.use', value: 'statusType.useStatusEnum.use' },
  { label: 'statusType.useStatusEnum.stop', value: 'statusType.useStatusEnum.stop' },
];

export const TYPE_ENTERPRISE_TYPES = [
  { label: 'statusType.enterpriseTypeEnum.national', value: 'statusType.enterpriseTypeEnum.national' },
  { label: 'statusType.enterpriseTypeEnum.privately', value: 'statusType.enterpriseTypeEnum.privately' },
];

export const TYPE_CONTRACT_STATUS = [
  { label: 'statusType.contractStatusEnum.fail', value: 'statusType.contractStatusEnum.fail' },
  { label: 'statusType.contractStatusEnum.audit', value: 'statusType.contractStatusEnum.audit' },
  { label: 'statusType.contractStatusEnum.executing', value: 'statusType.contractStatusEnum.executing' },
  { label: 'statusType.contractStatusEnum.pending', value: 'statusType.contractStatusEnum.pending' },
  { label: 'statusType.contractStatusEnum.finish', value: 'statusType.contractStatusEnum.finish' },
];

export const TYPE_CONTRACT_TYPES = [
  { label: 'statusType.contractTypeEnum.main', value: 'statusType.contractTypeEnum.main' },
  { label: 'statusType.contractTypeEnum.sub', value: 'statusType.contractTypeEnum.sub' },
  { label: 'statusType.contractTypeEnum.supplement', value: 'statusType.contractTypeEnum.supplement' },
];

// 以下四个选项数组零引用（对应下拉筛选尚未存在，枚举仍由 statusType.* 词条提供），20261003 清理删除：
// TYPE_CONTRACT_PAY_TYPES、TYPE_SALE_STATUS、TYPE_RESERVE_STATUS、TYPE_INTO_STATUS

export const TYPE_ROOM_TYPES = [
  { label: 'statusType.roomTypeEnum.single', value: 'statusType.roomTypeEnum.single' },
  { label: 'statusType.roomTypeEnum.double', value: 'statusType.roomTypeEnum.double' },
  { label: 'statusType.roomTypeEnum.multiple', value: 'statusType.roomTypeEnum.multiple' },
];

// 业务卡片页与查询页共用的筛选标题宽度：显式传给 TDesign Form，避免回退到默认 100px 内联宽度
export const BUSINESS_BASIC_FORM_LABEL_WIDTH = 84;
export const QUERY_FORM_LABEL_WIDTH = BUSINESS_BASIC_FORM_LABEL_WIDTH;

// 通用请求头
export enum ContentTypeEnum {
  Json = 'application/json;charset=UTF-8',
  FormURLEncoded = 'application/x-www-form-urlencoded;charset=UTF-8',
  FormData = 'multipart/form-data;charset=UTF-8',
}

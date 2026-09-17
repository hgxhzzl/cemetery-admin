// 合同状态枚举
export const CONTRACT_STATUS = {
  FAIL: 0,
  AUDIT_PENDING: 1,
  EXEC_PENDING: 2,
  EXECUTING: 3,
  FINISH: 4,
};

// 合同类型枚举
export const CONTRACT_TYPES = {
  MAIN: 0,
  SUB: 1,
  SUPPLEMENT: 2,
};

// 合同收付类型枚举
export const CONTRACT_PAYMENT_TYPES = {
  PAYMENT: 0,
  RECEIPT: 1,
};

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

export const TYPE_CONTRACT_PAY_TYPES = [
  { label: 'statusType.payTypeEnum.payment', value: 'statusType.payTypeEnum.payment' },
  { label: 'statusType.payTypeEnum.receipt', value: 'statusType.payTypeEnum.receipt' },
];

export const TYPE_SALE_STATUS = [
  { label: 'statusType.saleStatusEnum.unsold', value: 'statusType.saleStatusEnum.unsold' },
  { label: 'statusType.saleStatusEnum.sold', value: 'statusType.saleStatusEnum.sold' },
  { label: 'statusType.saleStatusEnum.reserve', value: 'statusType.saleStatusEnum.reserve' },
];

export const TYPE_RESERVE_STATUS = [
  { label: 'statusType.reserveStatusEnum.unreserved', value: 'statusType.reserveStatusEnum.unreserved' },
  { label: 'statusType.reserveStatusEnum.reserved', value: 'statusType.reserveStatusEnum.reserved' },
];

export const TYPE_ROOM_TYPES = [
  { label: 'statusType.roomTypeEnum.single', value: 'statusType.roomTypeEnum.single' },
  { label: 'statusType.roomTypeEnum.double', value: 'statusType.roomTypeEnum.double' },
  { label: 'statusType.roomTypeEnum.multiple', value: 'statusType.roomTypeEnum.multiple' },
];

export const TYPE_INTO_STATUS = [
  { label: 'statusType.intoStatusEnum.incomplet', value: 'statusType.intoStatusEnum.incomplet' },
  { label: 'statusType.intoStatusEnum.buried', value: 'statusType.intoStatusEnum.buried' },
  { label: 'statusType.intoStatusEnum.full', value: 'statusType.intoStatusEnum.full' },
  { label: 'statusType.intoStatusEnum.reserve', value: 'statusType.intoStatusEnum.reserve' },
  { label: 'statusType.intoStatusEnum.examine', value: 'statusType.intoStatusEnum.examine' },
];

// 迁出状态：未迁出/已迁出，与其它状态字段同为枚举键存储 20260916 新增
export const TYPE_TRANSFER_OUT_STATUS = [
  { label: 'statusType.transferOutStatusEnum.notOut', value: 'statusType.transferOutStatusEnum.notOut' },
  { label: 'statusType.transferOutStatusEnum.out', value: 'statusType.transferOutStatusEnum.out' },
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

// 账户模块数据模型
export interface ListAccountResult {
  list: Array<AccountModel>;
}

export interface ListAccountPowerResult {
  list: Array<AccountPowerModel>;
}

export interface AccountModel {
  idAccount: number;
  account: string;
  head: string;
  phone: string;
  enterpriseType: string;
  useStatus: string;
  startDate: string;
  endDate: string;
  dataBaseName: string;
  address: string;
  createDate: string;
}

export interface AccountPowerModel {
  idMenu: string;
  dataBaseName: string;
  account: string;
  menuName: string;
  level: number;
  menuDescribe: string;
  operateCreate: number;
  operateModify: number;
  operateDelete: number;
  operateExamine: number;
  operateFinish: number;
  operatePower: number;
  useMenu: number;
}

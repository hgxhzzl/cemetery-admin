// 账户模块数据模型
export interface ListOperatorResult {
  list: Array<OperatorModel>;
}

export interface ListPowerResult {
  list: Array<PowerModel>;
}

export interface ListCountResult {
  list: Array<CountModel>;
}
export interface OperatorModel {
  idOperator: number;
  name: string;
  phone: string;
  duties: string;
  useStatus: string;
  team: string;
  joinDate: string;
  remark: string;
}
export interface SelectResult {
  list: Array<SelectModel>;
}
export interface SelectModel {
  value: number;
  label: string;
}

export interface CountModel {
  havePhone: number;
}

export interface PowerModel {
  idMenu: string;
  menuName: string;
  menuDescribe: string;
  dataBaseName: string;
  level: number;
  idPower: number;
  idOperator: number;
  operateCreate: number;
  operateModify: number;
  operateDelete: number;
  operateExamine: number;
  operateFinish: number;
  operatePower: number;
  operatPower?: number;
  useMenu: number;
  useCreate: number;
  useModify: number;
  useDelete: number;
  useExamine: number;
  useFinish: number;
  usePower: number;
}

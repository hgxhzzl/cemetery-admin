// 账户模块数据模型
export interface ListResult {
  list: Array<ContractModel>;
}

export interface SelectResult {
  list: Array<SelectModel>;
}
export interface SelectModel {
  value: number;
  label: string;
}

export interface ContractModel {
  idContract: number;
  contractName: string;
  contractNum: string;
  contractType: string;
  partyA: string;
  partyB: string;
  contractStatus: string;
  signDate: string;
  startDate: string;
  endDate: string;
  payType: string;
  contractAmount: string;
  remark: string;
  createDate: string;
}

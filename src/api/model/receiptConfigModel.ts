// 收据配制数据模型
export interface ReceiptConfigModel {
  idConfig: number;
  prefix: string;
  region: string;
  phone: string;
  address: string;
}

export interface ListReceiptConfigResult {
  list: Array<ReceiptConfigModel>;
}

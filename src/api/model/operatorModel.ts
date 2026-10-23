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
  region: string;
  // 缴费年限：库列 operator.termYears，逗号分隔串，表单内按多选数组互转（同区域）20261017 新增
  termYears: string;
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
  // 功能级权限白名单(json 列):NULL=不限功能(回退 useMenu 全权);非 NULL 仅显式 =1 的动作放行。
  // mysql2 对 json 列可能回对象或字符串,读取侧统一归一 20261023 功能级权限改造新增,
  powerConfig?: Record<string, { actions: Record<string, number> }> | string | null;
  // 该菜单的功能级权限模板(取自 gm_data_000.menu.powerConfig):{功能名:[动作...]};NULL=不做功能级管控,
  // 由 operatorPower/query 随权限行下发,权限页据此渲染矩阵 20261023 权限模板入库,
  menuTemplate?: Record<string, string[]> | string | null;
}

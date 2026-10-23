// 功能/动作中文标签与菜单模板解析(仅前端展示层):
// 功能级权限模板已入库(gm_data_000.menu.powerConfig),由 operatorPower/query 随权限行下发 menuTemplate,
// 前端不再维护 MENU_FUNCTIONS 目录副本;本文件只保留矩阵行头/列头的中文文案与 JSON 归一 20261023 权限模板入库,

// 功能名中文标签(配置页矩阵行头;单功能菜单的功能键=菜单名,未列出的回退用菜单中文名)
export const FUNCTION_LABELS: Record<string, string> = {
  sale: '销售',
  buried: '下葬',
  contacts: '联系人',
  reserve: '预定',
  certificate: '安葬证',
  remark: '备注',
  business: '墓位业务',
  transferOut: '墓位迁出',
  adminfee: '管理费',
  managementPeriod: '管理期限',
  operator: '操作人员',
  contract: '合同',
  account: '账户',
  room: '墓位设置',
  tagInfo: '选择设置',
  park: '园区设置',
  receiptConfig: '收据配制',
  cardColor: '卡片颜色',
};

// 动作中文标签(配置页矩阵列头);setting 用于选择设置/园区设置/收据配制/卡片颜色的整体保存动作(按钮“设置提交”)20261023 调整,
export const ACTION_LABELS: Record<string, string> = {
  create: '新建',
  modify: '修改',
  delete: '删除',
  power: '授权',
  setting: '设置提交',
};

// menu.powerConfig 功能模板:{ 功能名: [动作...] };json 列可能回对象或字符串,
// 非法/空模板返回 null(该菜单不做功能级管控),与后端 permissionTemplate.parseTemplate 同口径,
export type FunctionTemplate = Record<string, string[]>;

export function parseFunctionTemplate(raw: unknown): FunctionTemplate | null {
  if (raw === null || raw === undefined || raw === '') {
    return null;
  }
  let value: unknown = raw;
  if (typeof raw === 'string') {
    try {
      value = JSON.parse(raw);
    } catch {
      return null;
    }
  }
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }
  const template: FunctionTemplate = {};
  Object.entries(value as Record<string, unknown>).forEach(([fn, actions]) => {
    if (!fn || !Array.isArray(actions)) {
      return;
    }
    const list = [...new Set(actions.map((action) => String(action)).filter(Boolean))];
    if (list.length > 0) {
      template[fn] = list;
    }
  });
  return Object.keys(template).length > 0 ? template : null;
}

// 菜单标识归一:配置页行里的 menuName 取自 account_power,是 i18n key 形态('menu.gravePlotBusiness');
// 单功能菜单的功能键是菜单 name('gravePlotBusiness'),比较前统一去掉 'menu.' 前缀(不改动 $t 展示用的原始 key),
export function normalizeMenuKey(menuName: string): string {
  return String(menuName || '').replace(/^menu\./, '');
}

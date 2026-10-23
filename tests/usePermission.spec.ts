import { beforeEach, describe, expect, it, vi } from 'vitest';

// hasFunctionPower 只依赖 useUserStore 暴露的三块状态：isAccount / dataBaseName / userInfo.roles。
// 切断 @/store 的 pinia 模块链，使纯判权函数可在 node 环境直接导入并逐场景控制登录态。
// 与后端 rbac.requireFunctionPower 口径逐字对齐（NULL 回退 / 显式=1 放行 / 键缺失或=0 拒绝）。
// 20261023 功能级权限改造新增,
const store = vi.hoisted(() => ({
  value: {
    isAccount: '0',
    dataBaseName: 'gm_data_001',
    userInfo: { roles: [] as Array<Record<string, any>> },
  },
}));

vi.mock('@/store', () => ({
  useUserStore: () => store.value,
}));

import { ACTION_LABELS, FUNCTION_LABELS, normalizeMenuKey, parseFunctionTemplate } from '@/constants/permissionLabels';
import { hasFunctionPower } from '@/hooks/usePermission';

const MENU = 'gravePlotBusiness';

function setRoles(roles: Array<Record<string, any>>) {
  store.value.userInfo.roles = roles;
}

beforeEach(() => {
  store.value.isAccount = '0';
  store.value.dataBaseName = 'gm_data_001';
  setRoles([]);
});

describe('hasFunctionPower: 功能×动作白名单判权', () => {
  it('平台管理员直接放行（即使无任何菜单行）', () => {
    store.value.isAccount = '1';
    store.value.dataBaseName = 'gm_data_000';
    expect(hasFunctionPower(MENU, 'sale', 'create')).toBe(true);
  });

  it('菜单未授权（useMenu!==1）判无权', () => {
    setRoles([{ menuName: MENU, useMenu: 0, powerConfig: null }]);
    expect(hasFunctionPower(MENU, 'sale', 'create')).toBe(false);
  });

  it('菜单行缺失判无权', () => {
    setRoles([{ menuName: 'room', useMenu: 1, powerConfig: null }]);
    expect(hasFunctionPower(MENU, 'sale', 'create')).toBe(false);
  });

  it('powerConfig 为 NULL → 回退放行（兼容存量，useMenu=1 即全功能可用）', () => {
    setRoles([{ menuName: MENU, useMenu: 1, powerConfig: null }]);
    expect(hasFunctionPower(MENU, 'sale', 'create')).toBe(true);
  });

  it('powerConfig 显式=1 放行', () => {
    setRoles([{ menuName: MENU, useMenu: 1, powerConfig: { sale: { actions: { create: 1 } } } }]);
    expect(hasFunctionPower(MENU, 'sale', 'create')).toBe(true);
  });

  it('powerConfig 键缺失视为无权（缺省禁止）', () => {
    setRoles([{ menuName: MENU, useMenu: 1, powerConfig: { buried: { actions: { modify: 1 } } } }]);
    expect(hasFunctionPower(MENU, 'sale', 'create')).toBe(false);
  });

  it('powerConfig 显式=0 视为无权', () => {
    setRoles([{ menuName: MENU, useMenu: 1, powerConfig: { sale: { actions: { create: 0 } } } }]);
    expect(hasFunctionPower(MENU, 'sale', 'create')).toBe(false);
  });

  it('powerConfig 为 JSON 字符串（接口原样下发）同样正确解析', () => {
    setRoles([{ menuName: MENU, useMenu: 1, powerConfig: '{"sale":{"actions":{"modify":1}}}' }]);
    expect(hasFunctionPower(MENU, 'sale', 'modify')).toBe(true);
    expect(hasFunctionPower(MENU, 'sale', 'delete')).toBe(false);
  });

  it('powerConfig 为空对象 {} → 全禁', () => {
    setRoles([{ menuName: MENU, useMenu: 1, powerConfig: {} }]);
    expect(hasFunctionPower(MENU, 'sale', 'create')).toBe(false);
  });

  it('按 idMenu 匹配菜单行（与 menuName 双口径一致）', () => {
    setRoles([{ idMenu: '103107', useMenu: 1, powerConfig: { sale: { actions: { create: 1 } } } }]);
    expect(hasFunctionPower('103107', 'sale', 'create')).toBe(true);
    expect(hasFunctionPower('103107', 'sale', 'delete')).toBe(false);
  });

  it('单功能菜单（动作列迁移而来）:功能键=菜单名,显式授权才放行', () => {
    setRoles([{ menuName: 'transferOut', useMenu: 1, powerConfig: { transferOut: { actions: { create: 1 } } } }]);
    expect(hasFunctionPower('transferOut', 'transferOut', 'create')).toBe(true);
    expect(hasFunctionPower('transferOut', 'transferOut', 'delete')).toBe(false);
  });

  it('单功能菜单 powerConfig=NULL → 回退放行（存量全权）', () => {
    setRoles([{ menuName: 'operator', useMenu: 1, powerConfig: null }]);
    expect(hasFunctionPower('operator', 'operator', 'power')).toBe(true);
  });

  it('单功能菜单 {} → 全禁', () => {
    setRoles([{ menuName: 'managementPeriod', useMenu: 1, powerConfig: {} }]);
    expect(hasFunctionPower('managementPeriod', 'managementPeriod', 'modify')).toBe(false);
  });

  it('配置类菜单(补全):tagInfo 功能键=菜单名,仅 setting 授权', () => {
    setRoles([{ menuName: 'tagInfo', useMenu: 1, powerConfig: { tagInfo: { actions: { setting: 1 } } } }]);
    expect(hasFunctionPower('tagInfo', 'tagInfo', 'setting')).toBe(true);
    // 旧键 modify 不再被任何页面使用,即使库里残留也不应放行新按钮,
    expect(hasFunctionPower('tagInfo', 'tagInfo', 'modify')).toBe(false);
    expect(hasFunctionPower('tagInfo', 'tagInfo', 'create')).toBe(false);
  });

  it('配置类菜单 powerConfig=NULL → 回退放行(park)', () => {
    setRoles([{ menuName: 'park', useMenu: 1, powerConfig: null }]);
    expect(hasFunctionPower('park', 'park', 'setting')).toBe(true);
  });
});

// 功能模板已入库(menu.powerConfig),前端不再有目录副本;parseFunctionTemplate 负责把接口下发的
// menuTemplate(对象或 JSON 字符串)归一成配置页矩阵直接可用的 { 功能名: [动作...] } 20261023 权限模板入库,
describe('parseFunctionTemplate: menu.powerConfig 模板归一', () => {
  it('对象形态原样保留(含多功能的墓位业务)', () => {
    const template = parseFunctionTemplate({ sale: ['create', 'delete'], business: ['create'] });
    expect(template).toEqual({ sale: ['create', 'delete'], business: ['create'] });
  });

  it('json 字符串形态(接口原样下发)同样解析', () => {
    expect(parseFunctionTemplate('{"tagInfo":["modify"]}')).toEqual({ tagInfo: ['modify'] });
  });

  it('null / 空串 / 非法 json / 非对象 / 空模板 → null(不做功能级管控)', () => {
    expect(parseFunctionTemplate(null)).toBeNull();
    expect(parseFunctionTemplate(undefined)).toBeNull();
    expect(parseFunctionTemplate('')).toBeNull();
    expect(parseFunctionTemplate('not-json')).toBeNull();
    expect(parseFunctionTemplate(['create'])).toBeNull();
    expect(parseFunctionTemplate({})).toBeNull();
    expect(parseFunctionTemplate({ tagInfo: [] })).toBeNull();
    expect(parseFunctionTemplate({ tagInfo: 'modify' })).toBeNull();
  });

  it('动作去重去空,空动作的功能键被丢弃', () => {
    expect(parseFunctionTemplate({ sale: ['create', 'create', ''], empty: [] })).toEqual({
      sale: ['create'],
    });
  });

  it('矩阵行头/列头标签齐备(配置类菜单与全部动作)', () => {
    ['sale', 'tagInfo', 'park', 'receiptConfig', 'cardColor'].forEach((fn) => {
      expect(FUNCTION_LABELS[fn]).toBeTruthy();
    });
    ['create', 'modify', 'delete', 'power', 'setting'].forEach((action) => {
      expect(ACTION_LABELS[action]).toBeTruthy();
    });
  });

  it('normalizeMenuKey 去掉 i18n 前缀(行内 menuName 为 menu.xxx 形态)', () => {
    expect(normalizeMenuKey('menu.gravePlotBusiness')).toBe('gravePlotBusiness');
    expect(normalizeMenuKey('gravePlotBusiness')).toBe('gravePlotBusiness');
    expect(normalizeMenuKey('')).toBe('');
  });
});

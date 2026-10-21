// 双语语言包键位对齐用例(审查修复 20261021 P2):页面的失败提示统一走 translate('operate.*FailedPrompt'),
// 新增词条时只补一种语言不会报错,只会在英文界面显示成键名原文,故用键集合逐项比对兜住,
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

// 这里必须用接口的索引签名而不是 Record<string, string | LocaleTree>,后者是映射类型,
// 映射类型不允许被类型别名递归自引用(vue-tsc 会报 TS2456)20261021 审查修复 P2,
interface LocaleTree {
  [key: string]: string | LocaleTree;
}

const flattenKeys = (tree: LocaleTree, prefix = ''): string[] =>
  Object.entries(tree).flatMap(([key, value]) => {
    const full = prefix ? `${prefix}.${key}` : key;
    return value && typeof value === 'object' ? flattenKeys(value, full) : [full];
  });

const load = (file: string) =>
  JSON.parse(readFileSync(fileURLToPath(new URL(file, import.meta.url)), 'utf8')) as LocaleTree;

describe('双语语言包', () => {
  const zh = flattenKeys(load('../src/locales/lang/zh_CN.json')).sort();
  const en = flattenKeys(load('../src/locales/lang/en_US.json')).sort();

  it('zh_CN 与 en_US 的叶子键集合完全一致', () => {
    expect(zh.filter((key) => !en.includes(key))).toEqual([]);
    expect(en.filter((key) => !zh.includes(key))).toEqual([]);
  });

  it('两种语言的叶子键数量一致(防止新增词条只补一边)', () => {
    expect(zh.length).toBe(en.length);
  });

  it('失败提示词条齐备(页面 catch 透出后端文案时的回退口径)', () => {
    [
      'operate.createdFailedPrompt',
      'operate.modifyFailedPrompt',
      'operate.deleteFailedPrompt',
      'operate.reserveFailedPrompt',
      'operate.finishFailedPrompt',
      'operate.examineFailedPrompt',
      'operate.listLoadFailedPrompt',
      'operate.exportFailedPrompt',
    ].forEach((key) => {
      expect(zh).toContain(key);
      expect(en).toContain(key);
    });
  });
});

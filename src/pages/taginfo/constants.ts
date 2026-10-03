import type { FormRule, UploadFile } from 'tdesign-vue-next';

export const FORM_RULES: Record<string, FormRule[]> = {
  name: [{ required: true, message: '请输入合同名称', type: 'error' }],
  type: [{ required: true, message: '请选择合同类型', type: 'error' }],
  payment: [{ required: true, message: '请选择合同收付类型', type: 'error' }],
  amount: [{ required: true, message: '请输入合同金额', type: 'error' }],
  partyA: [{ required: true, message: '请选择甲方', type: 'error' }],
  partyB: [{ required: true, message: '请选择乙方', type: 'error' }],
  signDate: [{ required: true, message: '请选择日期', type: 'error' }],
  startDate: [{ required: true, message: '请选择日期', type: 'error' }],
  endDate: [{ required: true, message: '请选择日期', type: 'error' }],
};

export const INITIAL_DATA = {
  dutiesNumber: 0,
  teamNumber: 0,
  // 逝者关系标签数量上限（tagset.deceasedRelationNumber）20261003 新增
  deceasedRelationNumber: 0,
  regionNumber: 0,
  partyB: '',
  signDate: '',
  startDate: '',
  endDate: '',
  payment: '1',
  amount: 0,
  comment: '',
  files: [] as Array<UploadFile>,
};

export const INITIAL_TAGMAX = {
  dutiesNumber: 0,
  teamNumber: 0,
  // 逝者关系标签数量上限 20261003 新增
  deceasedRelationNumber: 0,
  regionNumber: 0,
};

export const INITIAL_TAGJSON = {
  tagName: '',
  tagType: '',
};
// 模板演示残留零引用，20261003 清理删除：INITIAL_TAGLIST（标签列表占位，现由接口驱动）
// 与 PARTY_A_OPTIONS / PARTY_B_OPTIONS（Company A/B 甲方乙方选项，属合同演示页搬到本页的无效残留）

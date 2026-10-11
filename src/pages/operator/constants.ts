import type { FormRule } from 'tdesign-vue-next';

export const FORM_RULES: Record<string, FormRule[]> = {
  contractName: [{ required: true, message: '  ', type: 'error', trigger: 'change' }],
  contractType: [{ required: true, message: '  ', type: 'error', trigger: 'change' }],
  payType: [{ required: true, message: '  ', type: 'error', trigger: 'change' }],
  contractAmount: [{ required: true, message: '  ', type: 'error', trigger: 'change' }],
  partyA: [{ required: true, message: '  ', type: 'error', trigger: 'change' }],
  partyB: [{ required: true, message: '   ', type: 'error', trigger: 'change' }],
  signDate: [{ required: true, message: '  ', type: 'error', trigger: 'change' }],
  startDate: [{ required: true, message: '  ', type: 'error', trigger: 'change' }],
  endDate: [{ required: true, message: '  ', type: 'error', trigger: 'change' }],
};
export const INITIAL_DATA = {
  idOperator: 0,
  name: '',
  phone: '',
  duties: '',
  team: '',
  useStatus: '',
  joinDate: '',
  // 区域多选：表单内为数组，与后端逗号分隔字符串在回显/提交两处互转 20261010 修改
  region: [] as string[],
};

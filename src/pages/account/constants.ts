import type { FormRule } from 'tdesign-vue-next';

export const FORM_RULES: Record<string, FormRule[]> = {
  account: [{ required: true, message: '  ', type: 'error', trigger: 'change' }],
  head: [{ required: true, message: '  ', type: 'error', trigger: 'change' }],
  phone: [{ required: true, message: '  ', type: 'error', trigger: 'change' }],
  useStatus: [{ required: true, message: '  ', type: 'error', trigger: 'change' }],
  dataBaseName: [{ required: true, message: '  ', type: 'error', trigger: 'change' }],
  address: [{ required: true, message: '   ', type: 'error', trigger: 'change' }],
  startDate: [{ required: true, message: '  ', type: 'error', trigger: 'change' }],
  endDate: [{ required: true, message: '  ', type: 'error', trigger: 'change' }],
};
export const INITIAL_DATA = {
  idAccount: 0,
  account: '',
  head: '',
  phone: '',
  enterpriseType: '',
  useStatus: '',
  startDate: '',
  endDate: '',
  dataBaseName: '',
  address: '',
};

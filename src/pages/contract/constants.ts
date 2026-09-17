import type { FormRule } from 'tdesign-vue-next';

import { t } from '@/locales';

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
  idContract: 0,
  contractName: '',
  contractNum: '',
  contractType: '',
  partyA: '',
  partyB: '',
  contractStatus: '',
  signDate: '',
  startDate: '',
  endDate: '',
  payType: '1',
  contractAmount: '0',
  remark: '',
};
// zhuzhelong 后改实现中英文
export const TYPE_CONTRACT_TYPE = [
  { label: t('pages.contract.contractTypeEnum.main'), value: 0 },
  { label: t('pages.contract.contractTypeEnum.sub'), value: 1 },
  { label: t('pages.contract.contractTypeEnum.supplement'), value: 2 },
];

export const TYPE_CONTRACT_STATUS = [
  { label: t('pages.contract.contractStatusEnum.fail'), value: 0 },
  { label: t('pages.contract.contractStatusEnum.audit'), value: 1 },
  { label: t('pages.contract.contractStatusEnum.executing'), value: 2 },
  { label: t('pages.contract.contractStatusEnum.pending'), value: 3 },
  { label: t('pages.contract.contractStatusEnum.finish'), value: 4 },
];

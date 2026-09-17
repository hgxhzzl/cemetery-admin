<template>
  <div>
    <!-- 列表页面开始 -->
    <div v-show="isListShow">
      <t-card class="list-card-container" :bordered="false">
        <t-row justify="space-between">
          <div class="left-operation-container">
            <t-button v-if="userInfo.useCreate === 1" @click="handleClickCreate">{{ $t('operate.create') }} </t-button>
          </div>
          <div class="search-input">
            <t-input
              v-model="searchValue"
              :placeholder="$t('pages.contract.placeholder')"
              clearable
              @blur="changeSearchFocus(true)"
            >
              <template #suffix-icon>
                <search-icon size="16px" />
              </template>
            </t-input>
          </div>
        </t-row>
        <t-table
          :data="data"
          :columns="COLUMNS"
          row-key="index"
          table-layout="fixed"
          :max-height="530"
          :fixed-rows="undefined"
          :bordered="false"
          lazy-load
          stripe
        >
          <template #contractStatus="{ row }">
            <t-tag v-if="row.contractStatus === 'statusType.contractStatusEnum.fail'" theme="danger" variant="light">
              {{ $t('statusType.contractStatusEnum.fail') }}</t-tag
            >
            <t-tag v-if="row.contractStatus === 'statusType.contractStatusEnum.audit'" theme="warning" variant="light">
              {{ $t('statusType.contractStatusEnum.audit') }}
            </t-tag>
            <t-tag
              v-if="row.contractStatus === 'statusType.contractStatusEnum.pending'"
              theme="warning"
              variant="light"
            >
              {{ $t('statusType.contractStatusEnum.pending') }}
            </t-tag>
            <t-tag
              v-if="row.contractStatus === 'statusType.contractStatusEnum.executing'"
              theme="success"
              variant="light"
            >
              {{ $t('statusType.contractStatusEnum.executing') }}
            </t-tag>
            <t-tag v-if="row.contractStatus === 'statusType.contractStatusEnum.finish'" theme="success" variant="light">
              {{ $t('statusType.contractStatusEnum.finish') }}
            </t-tag>
          </template>
          <template #contractType="{ row }">
            <p>{{ $t(row.contractType) }}</p>
          </template>
          <template #payType="{ row }">
            <div v-if="row.payType === 'statusType.payTypeEnum.payment'" class="payment-col">
              {{ $t('statusType.payTypeEnum.payment') }}<trend class="dashboard-item-trend" type="up" />
            </div>
            <div v-if="row.payType === 'statusType.payTypeEnum.receipt'" class="payment-col">
              {{ $t('statusType.payTypeEnum.receipt') }}<trend class="dashboard-item-trend" type="down" />
            </div>
          </template>
          <template #op="slotProps">
            <t-space>
              <t-link theme="primary" @click="handleClickDetail(slotProps)"> {{ $t('operate.detail') }}</t-link>
              <t-link v-if="userInfo.useDelete === 1" theme="danger" @click="handleClickDelete(slotProps)">
                {{ $t('operate.delete') }}</t-link
              >
              <t-link v-if="userInfo.useModify === 1" theme="danger" @click="handleClickModify(slotProps)">
                {{ $t('operate.modify') }}</t-link
              >
            </t-space>
          </template>
        </t-table>
        <div v-if="isListTotal" style="text-align: left; padding-left: 15px">{{ listTotal }}</div>
      </t-card>

      <t-dialog
        v-model:visible="confirmVisible"
        :header="dialogHeader"
        :body="confirmBody"
        :on-cancel="onCancel"
        @confirm="onConfirmDelete"
      />
    </div>
    <!-- 列表页面结束 -->
    <!-- 详情页面开始 -->
    <div v-if="isDetailShow" class="detail-base">
      <t-card :title="$t('pages.detailBase.baseInfo.title')" :bordered="false">
        <template #actions>
          <t-button theme="default" shape="square" variant="text" @click="ClickDetailClose()">
            <rollback-icon size="16px" />
          </t-button>
        </template>
        <div v-if="isReloading" class="info-block">
          <div v-for="(item, index) in detailData" :key="index" class="info-item">
            <h1>{{ item.name }}</h1>
            <span
              :class="{
                ['inProgress']: item.type && item.type.value === 'inProgress',
                ['pdf']: item.type && item.type.value === 'pdf',
              }"
            >
              <i v-if="item.type && item.type.key === 'contractStatus'" />
              {{ item.value }}
            </span>
          </div>
        </div>
      </t-card>
    </div>
    <!-- 详情页面结束 -->
    <!-- 新建合同开始 -->

    <div v-if="isCreateShow">
      <t-form ref="formCreate" class="base-form" :data="formData" label-align="top" :label-width="100" @reset="onReset">
        <div class="form-basic-container">
          <div class="form-basic-item">
            <div v-show="isCreate" class="form-basic-container-title">
              {{ $t('pages.contract.creatTitle') }}
              <t-button style="float: right" theme="default" shape="square" variant="text" @click="ClickCreateClose()">
                <rollback-icon size="16px" />
              </t-button>
            </div>
            <div v-show="isModify" class="form-basic-container-title">
              {{ $t('pages.contract.modifyTitle') }}
              <t-button style="float: right" theme="default" shape="square" variant="text" @click="ClickCreateClose()">
                <rollback-icon size="16px" />
              </t-button>
            </div>
            <!-- formdata -->
            <t-row class="row-gap" :gutter="[32, 24]">
              <t-col :span="6">
                <t-form-item :required="true" :label="$t('pages.contract.contractName')" name="contractName">
                  <t-input
                    v-model="formData.contractName"
                    :maxcharacter="30"
                    show-limit-number
                    :style="{ width: '322px' }"
                    :placeholder="$t('pages.contract.contractNamePlaceholder')"
                  />
                </t-form-item>
              </t-col>

              <t-col :span="6">
                <t-form-item :label="$t('pages.contract.contractType')" name="contractType">
                  <t-select
                    v-model="formData.contractType"
                    :style="{ width: '322px' }"
                    class="demo-select-base"
                    clearable
                  >
                    <t-option
                      v-for="(item, index) in TYPE_CONTRACT_TYPES"
                      :key="index"
                      :value="item.value"
                      :label="t(item.label)"
                    >
                      {{ t(item.label) }}
                    </t-option>
                  </t-select>
                </t-form-item>
              </t-col>

              <!-- 合同收付类型 -->
              <t-col :span="6">
                <t-form-item :label="$t('pages.contract.payType')" name="payType">
                  <t-radio-group v-model="formData.payType">
                    <t-radio value="statusType.payTypeEnum.receipt"> {{ $t('pages.contract.receive') }} </t-radio>
                    <t-radio value="statusType.payTypeEnum.payment"> {{ $t('pages.contract.pay') }} </t-radio>
                  </t-radio-group>
                  <!-- <span class="space-item" /> -->
                  <div>
                    <t-input-number
                      v-model="formData.contractAmount"
                      large-number
                      max="9999999"
                      min="0"
                      :format="format"
                      theme="normal"
                      :placeholder="$t('pages.contract.contractAmountPlaceholder')"
                      :style="{ width: '160px' }"
                    />
                  </div>
                </t-form-item>
              </t-col>
              <!-- 合同编号 -->
              <t-col :span="6">
                <t-form-item :label="$t('pages.contract.contractNum')" name="contractNum">
                  <t-input
                    v-model="formData.contractNum"
                    :maxcharacter="20"
                    show-limit-number
                    :style="{ width: '322px' }"
                    :placeholder="$t('pages.contract.contractNumPlaceholder')"
                  />
                </t-form-item>
              </t-col>

              <t-col :span="6">
                <t-form-item :label="$t('pages.contract.partyA')" name="partyA">
                  <t-select
                    v-model="formData.partyA"
                    :style="{ width: '322px' }"
                    class="demo-select-base"
                    :placeholder="$t('pages.contract.contractTypePlaceholder')"
                    clearable
                  >
                    <t-option
                      v-for="(item, index) in dataPartyAList"
                      :key="index"
                      :value="item.value"
                      :label="item.label"
                    >
                      {{ item.label }}
                    </t-option>
                  </t-select>
                </t-form-item>
              </t-col>
              <t-col :span="6">
                <t-form-item :label="$t('pages.contract.partyB')" name="partyB">
                  <t-select
                    v-model="formData.partyB"
                    :style="{ width: '322px' }"
                    :placeholder="$t('pages.contract.contractTypePlaceholder')"
                    class="demo-select-base"
                    clearable
                  >
                    <t-option
                      v-for="(item, index) in dataPartyBList"
                      :key="index"
                      :value="item.value"
                      :label="item.label"
                    >
                      {{ item.label }}
                    </t-option>
                  </t-select>
                </t-form-item>
              </t-col>
              <!-- 合同状态 -->
              <t-col :span="6">
                <t-form-item :label="$t('pages.contract.contractStatus')" name="contractStatus">
                  <t-select
                    v-model="formData.contractStatus"
                    :style="{ width: '322px' }"
                    class="demo-select-base"
                    clearable
                  >
                    <t-option
                      v-for="(item, index) in TYPE_CONTRACT_STATUS"
                      :key="index"
                      :value="item.value"
                      :label="t(item.label)"
                    >
                      {{ t(item.label) }}
                    </t-option>
                  </t-select>
                </t-form-item>
              </t-col>
              <t-col :span="6">
                <t-form-item :label="$t('pages.contract.signDate')" name="signDate">
                  <t-date-picker
                    v-model="formData.signDate"
                    :style="{ width: '322px' }"
                    theme="primary"
                    mode="date"
                    separator="/"
                    :placeholder="$t('pages.contract.signDatePlaceholder')"
                  />
                </t-form-item>
              </t-col>
              <t-col :span="6">
                <t-form-item :label="$t('pages.contract.startDate')" name="startDate">
                  <t-date-picker
                    v-model="formData.startDate"
                    :style="{ width: '322px' }"
                    theme="primary"
                    mode="date"
                    separator="/"
                    :placeholder="$t('pages.contract.startDatePlaceholder')"
                  />
                </t-form-item>
              </t-col>
              <t-col :span="6">
                <t-form-item :label="$t('pages.contract.endDate')" name="endDate">
                  <t-date-picker
                    v-model="formData.endDate"
                    :style="{ width: '322px' }"
                    theme="primary"
                    mode="date"
                    separator="/"
                    :placeholder="$t('pages.contract.endDatePlaceholder')"
                  />
                </t-form-item>
              </t-col>
            </t-row>

            <t-form-item :label="$t('pages.contract.remark')" name="remark">
              <t-textarea
                v-model="formData.remark"
                :maxcharacter="100"
                :height="124"
                :placeholder="$t('pages.contract.remarkPlaceholder')"
              />
            </t-form-item>
          </div>
        </div>
        <div class="form-submit-container">
          <div class="form-submit-sub">
            <div class="form-submit-left">
              <t-button theme="primary" class="form-submit-confirm" @click="ClickSubmit()">
                {{ $t('operate.confirm') }}
              </t-button>
              <t-button v-if="isCreate" class="form-submit-cancel" theme="default" type="reset">
                {{ $t('operate.cancel') }}
              </t-button>
              <t-button v-if="isModify" class="form-submit-cancel" theme="default" @click="ClickReset()">
                {{ $t('operate.cancel') }}
              </t-button>
            </div>
          </div>
        </div>
      </t-form>
    </div>
    <!-- 新建合同结束 -->
  </div>
</template>
<script lang="ts">
export default {
  name: 'Contract',
};
</script>
<script setup lang="ts">
import { RollbackIcon, SearchIcon } from 'tdesign-icons-vue-next';
import type { InputNumberValue, PrimaryTableCol, TableRowData } from 'tdesign-vue-next';
import { MessagePlugin } from 'tdesign-vue-next';
import { computed, onMounted, ref } from 'vue';

import {
  deleContract,
  getAllList,
  getIdList,
  getNameList,
  getPartyAList,
  getPartyBList,
  insertContract,
  updateContract,
} from '@/api/contract';
import type { ContractModel, SelectModel } from '@/api/model/contractModel';
import Trend from '@/components/trend/index.vue';
import { TYPE_CONTRACT_STATUS, TYPE_CONTRACT_TYPES } from '@/constants';
import { usePermission } from '@/hooks';
import { i18n, t } from '@/locales';
import { logError } from '@/utils/logger';

import { INITIAL_DATA } from './constants';

// 合同模块权限对象按 idMenu(101102) 精确匹配，权限不足时兼容空对象避免运行时报错 20260827 修改
const userInfo = usePermission('101102');
const translate = (key: string) => String(i18n.global.t(key));

// 列表代码开始
const isListShow = ref(false);
const isDetailShow = ref(false);
const isCreateShow = ref(false);
const isReloading = ref(false);
const isCreate = ref(false);
const isModify = ref(false);
const dataPartyAList = ref<SelectModel[]>([]);
const dataPartyBList = ref<SelectModel[]>([]);
const isListTotal = ref(false);
const deleteIdx = ref(-1);

const dialogHeader = translate('operate.deleteDataCPrompt');
let listTotal = '';
// 显示控制
const controlPageShow = (name: string) => {
  if (name === 'list') {
    isCreateShow.value = false;
    isDetailShow.value = false;
    isCreate.value = false;
    isModify.value = false;
    isReloading.value = false;
    isListShow.value = true;
  }
  if (name === 'detail') {
    isCreateShow.value = false;
    isListShow.value = false;
    isReloading.value = true;
    isDetailShow.value = true;
  }
  if (name === 'createCreate') {
    isDetailShow.value = false;
    isListShow.value = false;
    isCreateShow.value = true;
    isModify.value = false;
    isCreate.value = true;
  }
  if (name === 'createModify') {
    setTimeout(() => {
      isListShow.value = false;
      isDetailShow.value = false;
      isCreate.value = false;
      isModify.value = true;
      isCreateShow.value = true;
    }, 180);
  }
  if (name === 'listTotal') {
    isListTotal.value = false;
    listTotal = translate('operate.total') + data.value.length + translate('operate.records');
    isListTotal.value = true;
  }
};

const COLUMNS: PrimaryTableCol<TableRowData>[] = [
  // { colKey: 'row-select', type: 'multiple', width: 64, fixed: 'left' },
  {
    title: translate('pages.contract.contractName'),
    align: 'left',
    width: 320,
    colKey: 'contractName',
    fixed: 'left',
  },
  { title: translate('pages.contract.contractStatus'), colKey: 'contractStatus', width: 160 },
  {
    title: translate('pages.contract.contractNum'),
    width: 140,
    ellipsis: true,
    colKey: 'contractNum',
  },
  {
    title: translate('pages.contract.contractType'),
    width: 140,
    ellipsis: true,
    colKey: 'contractType',
  },
  {
    title: translate('pages.contract.payType'),
    width: 140,
    ellipsis: true,
    colKey: 'payType',
  },
  {
    title: translate('pages.contract.contractAmount'),
    width: 160,
    ellipsis: true,
    colKey: 'contractAmount',
  },
  {
    title: translate('pages.contract.operation'),
    align: 'left',
    fixed: 'right',
    width: 160,
    colKey: 'op',
  },
];

const data = ref<ContractModel[]>([]);
const searchValue = ref('');

const changeSearchFocus = async (value: boolean) => {
  try {
    const { list } = await getNameList(searchValue.value);
    data.value = list;
    controlPageShow('listTotal');
  } catch (e) {
    logError(e);
  }
};

// const dataLoading = ref(false);
// 数据加载
const fetchData = async () => {
  // dataLoading.value = true;
  try {
    const { list } = await getAllList();
    data.value = list;
    controlPageShow('listTotal');
  } catch (e) {
    logError(e);
  }
};

const confirmBody = computed(() => {
  if (deleteIdx.value > -1) {
    const { contractName } = data.value[deleteIdx.value];
    return translate('operate.deleteDataAPrompt') + contractName + translate('operate.deleteDataBPrompt');
  }
  return '';
});

onMounted(() => {
  fetchData();
  setTimeout(() => {
    isListShow.value = true;
  }, 280);
});

const confirmVisible = ref(false);

const onConfirmDelete = async () => {
  const { idContract } = data.value[deleteIdx.value];
  data.value.splice(deleteIdx.value, 1);
  try {
    await deleContract(idContract);
    controlPageShow('listTotal');
    MessagePlugin.success(translate('operate.deleteSuccessPrompt'));
  } catch (e) {
    logError(e);
  }
};

const onCancel = () => {
  deleteIdx.value = -1;
};

// 详细加载
const handleClickDetail = async (row: { row: ContractModel }) => {
  const dataQuery = ref<ContractModel[]>([]);
  try {
    const { list } = await getIdList(row.row.idContract);
    dataQuery.value = list;
    detailData[0].value = dataQuery.value[0].contractName;
    detailData[1].value = translate(dataQuery.value[0].contractStatus);
    detailData[2].value = dataQuery.value[0].contractNum;
    detailData[3].value = translate(dataQuery.value[0].contractType);
    detailData[4].value = translate(dataQuery.value[0].payType);
    detailData[5].value = dataQuery.value[0].contractAmount;
    detailData[6].value = dataQuery.value[0].partyA;
    detailData[7].value = dataQuery.value[0].partyB;
    detailData[8].value = dataQuery.value[0].signDate;
    detailData[9].value = dataQuery.value[0].startDate;
    detailData[10].value = dataQuery.value[0].endDate;
    detailData[11].value = dataQuery.value[0].createDate;
    controlPageShow('detail');
  } catch (e) {
    logError(e);
  }
};

// 详细数据重新加载
const handleClickModify = async (row: { row: ContractModel }) => {
  getContractID(row.row.idContract);
  controlPageShow('createModify');
};

const getContractID = async (id: number) => {
  try {
    const { list } = await getIdList(id);
    const dataQuery = list[0];
    formData.value = dataQuery;
  } catch (e) {
    logError(e);
  }
};
const handleClickCreate = async () => {
  // 甲方
  try {
    const { list } = await getPartyAList();
    dataPartyAList.value = list;
  } catch (e) {
    logError(e);
  }
  // 乙方
  try {
    const { list } = await getPartyBList();
    dataPartyBList.value = list;
  } catch (e) {
    logError(e);
  }
  controlPageShow('createCreate');
};

const handleClickDelete = (row: { rowIndex: number }) => {
  deleteIdx.value = row.rowIndex;
  confirmVisible.value = true;
};

// 列表结束
// 详情开始
const ClickDetailClose = () => {
  controlPageShow('list');
};

const detailData = [
  {
    name: translate('pages.contract.contractName'),
    colKey: 'contractName',
    value: '总部办公用品采购项目',
    serialNumber: '0',
    type: null,
  },
  {
    name: translate('pages.contract.contractStatus'),
    colKey: 'contractStatus',
    value: '履行中',
    serialNumber: '1',
    type: {
      key: 'contractStatus',
      value: 'inProgress',
    },
  },
  {
    name: translate('pages.contract.contractNum'),
    colKey: 'contractNum',
    value: 'BH00010',
    serialNumber: '2',
    type: null,
  },
  {
    name: translate('pages.contract.contractType'),
    colKey: 'contractType',
    value: translate('pages.contract.contractTypeEnum.main'),
    serialNumber: '3',
    type: null,
  },
  {
    name: translate('pages.contract.payType'),
    colKey: 'payType',
    value: translate('pages.contract.payType'),
    serialNumber: '4',
    type: null,
  },
  {
    name: translate('pages.contract.contractAmount'),
    colKey: 'contractAmount',
    value: '¥ 5,000,000',
    serialNumber: '5',
    type: null,
  },
  {
    name: translate('pages.contract.partyA'),
    colKey: 'partyA',
    value: '腾讯科技（深圳）有限公司',
    serialNumber: '6',
    type: null,
  },
  {
    name: translate('pages.contract.partyB'),
    colKey: 'partyB',
    value: '欧尚',
    serialNumber: '7',
    type: null,
  },
  {
    name: translate('pages.contract.signDate'),
    colKey: 'signDate',
    value: '2020-12-20',
    serialNumber: '8',
    type: null,
  },
  {
    name: translate('pages.contract.startDate'),
    colKey: 'startDate',
    value: '2021-01-20',
    serialNumber: '9',
    type: null,
  },
  {
    name: translate('pages.contract.endDate'),
    colKey: 'endDate',
    value: '2022-12-20',
    serialNumber: '10',
    type: null,
  },
  {
    name: translate('pages.contract.createDate'),
    colKey: 'createDate',
    value: '2020-12-22 10:00:00',
    serialNumber: '11',
    type: null,
  },
];
// 详情结束
// 新建开始
const formCreate = ref<{ reset: () => void } | null>(null);
const formData = ref({ ...INITIAL_DATA });

const format = (val: InputNumberValue) => {
  return String(val ?? '').replace(/\d{1,3}(?=(\d{3})+(\.|$))/g, '$&,');
};

const ClickCreateClose = () => {
  formCreate.value?.reset();
  controlPageShow('list');
};

const ClickReset = () => {
  getContractID(formData.value.idContract);
};

const onReset = () => {
  // 表单重置：恢复初始数据 20260917 优化
  formData.value = { ...INITIAL_DATA };
};

const ClickSubmit = async () => {
  const Amount = formData.value.contractAmount.toString();
  if (Amount === '') {
    formData.value.contractAmount = '0';
  }

  if (formData.value.contractName === '') {
    return MessagePlugin.warning(translate('pages.contract.contractNamePlaceholder'));
  }
  if (formData.value.contractType === '' || formData.value.contractType === undefined) {
    return MessagePlugin.warning(translate('pages.contract.contractTypePlaceholder'));
  }
  if (formData.value.partyA === '' || formData.value.partyA === undefined) {
    return MessagePlugin.warning(translate('pages.contract.partyAPlaceholder'));
  }
  if (formData.value.partyB === '' || formData.value.partyB === undefined) {
    return MessagePlugin.warning(translate('pages.contract.partyBPlaceholder'));
  }
  if (formData.value.signDate === '') {
    return MessagePlugin.warning(translate('pages.contract.signDatePlaceholder'));
  }
  if (formData.value.startDate === '') {
    return MessagePlugin.warning(translate('pages.contract.startDatePlaceholder'));
  }
  if (formData.value.endDate === '') {
    return MessagePlugin.warning(translate('pages.contract.endDatePlaceholder'));
  }
  if (formData.value.payType === '' || formData.value.payType === undefined) {
    return MessagePlugin.warning(translate('pages.contract.payTypePlaceholder'));
  }
  if (formData.value.contractStatus === '' || formData.value.contractStatus === undefined) {
    return MessagePlugin.warning(translate('pages.contract.contractStatusPlaceholder'));
  }
  // 将Proxy对象转换为JSON字符串,不转也可以
  const jsonformDataString = JSON.stringify(formData.value);
  if (formData.value.idContract === 0) {
    try {
      await insertContract(jsonformDataString);
      MessagePlugin.success(translate('operate.createdSuccessPrompt'));
      fetchData();
      ClickCreateClose();
    } catch (e) {
      logError(e);
      MessagePlugin.success(translate('operate.createdFailedPrompt'));
    }
  } else {
    try {
      await updateContract(jsonformDataString);
      MessagePlugin.success(translate('operate.modifySuccessPrompt'));
      fetchData();
      ClickCreateClose();
    } catch (e) {
      logError(e);
      MessagePlugin.success(translate('operate.modifyFailedPrompt'));
    }
  }
};
</script>
<style lang="less" scoped>
@import './index.less';
</style>
<style lang="less" scoped></style>

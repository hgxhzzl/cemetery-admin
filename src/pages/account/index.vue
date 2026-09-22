<template>
  <div>
    <!-- list begin -->
    <div v-show="isListShow">
      <t-card class="list-card-container" :bordered="false">
        <t-row justify="space-between">
          <div class="left-operation-container">
            <t-button v-if="userInfo.useCreate === 1" @click="handleClickCreate">{{ $t('operate.create') }} </t-button>
          </div>

          <div class="search-input">
            <t-input
              v-model="searchValue"
              :placeholder="$t('pages.account.placeholder')"
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
          <template #enterpriseType="{ row }">
            <t-tag
              v-if="row.enterpriseType === 'statusType.enterpriseTypeEnum.national'"
              theme="primary"
              variant="light"
            >
              {{ $t('statusType.enterpriseTypeEnum.national') }}
            </t-tag>
            <t-tag
              v-if="row.enterpriseType === 'statusType.enterpriseTypeEnum.privately'"
              theme="warning"
              variant="light"
            >
              {{ $t('statusType.enterpriseTypeEnum.privately') }}
            </t-tag>
          </template>
          <template #useStatus="{ row }">
            <t-tag v-if="row.useStatus === 'statusType.useStatusEnum.use'" theme="primary" variant="light">
              {{ $t('statusType.useStatusEnum.use') }}
            </t-tag>
            <t-tag v-if="row.useStatus === 'statusType.useStatusEnum.stop'" theme="warning" variant="light">
              {{ $t('statusType.useStatusEnum.stop') }}
            </t-tag>
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
              <t-link theme="warning" @click="handleClickPower(slotProps)"> {{ $t('operate.power') }}</t-link>
              <t-link theme="danger" @click="handleClickCreateDataBase(slotProps)">
                {{ $t('operate.createDatabase') }}</t-link
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
    <!-- list end -->
    <!-- detail begin -->
    <div v-if="isDetailShow" class="detail-base">
      <t-card :title="$t('pages.account.detailTitle')" :bordered="false">
        <template #actions>
          <t-button class="cms-back-btn" theme="default" variant="text" @click="ClickDetailClose()">
            {{ $t('operate.backDetail') }}
            <rollback-icon size="16px" />
          </t-button>
        </template>
        <div v-if="isReloading" class="info-block">
          <div v-for="(item, index) in detailData" :key="index" class="info-item">
            <h1>{{ item.name }}</h1>
            <span>
              <i v-if="item.type && item.type.key === 'useStatus'" />
              {{ item.value }}
            </span>
          </div>
        </div>
      </t-card>
    </div>
    <!-- detail end -->
    <!-- create begin -->
    <div v-if="isCreateShow">
      <t-form ref="formCreate" class="base-form" :data="formData" label-align="top" :label-width="100" @reset="onReset">
        <div class="form-basic-container">
          <div class="form-basic-item">
            <div v-show="isCreate" class="form-basic-container-title">
              {{ $t('pages.account.creatTitle') }}
              <t-button
                class="cms-back-btn"
                style="float: right"
                theme="default"
                variant="text"
                @click="ClickCreateClose()"
              >
                {{ $t('operate.backDetail') }}
                <rollback-icon size="16px" />
              </t-button>
            </div>
            <div v-show="isModify" class="form-basic-container-title">
              {{ $t('pages.account.modifyTitle') }}
              <t-button
                class="cms-back-btn"
                style="float: right"
                theme="default"
                variant="text"
                @click="ClickCreateClose()"
              >
                {{ $t('operate.backDetail') }}
                <rollback-icon size="16px" />
              </t-button>
            </div>
            <t-row class="row-gap" :gutter="[32, 5]">
              <t-col :span="6">
                <t-form-item :required="true" :label="$t('pages.account.account')" name="account">
                  <t-input
                    v-model="formData.account"
                    :maxcharacter="20"
                    show-limit-number
                    :style="{ width: '322px' }"
                    :placeholder="$t('pages.account.accountPlaceholder')"
                  />
                </t-form-item>
              </t-col>
              <t-col :span="6">
                <t-form-item :label="$t('pages.account.enterpriseType')" name="enterpriseType">
                  <t-select
                    v-model="formData.enterpriseType"
                    :style="{ width: '322px' }"
                    class="demo-select-base"
                    clearable
                  >
                    <t-option
                      v-for="(item, index) in TYPE_ENTERPRISE_TYPES"
                      :key="index"
                      :value="item.value"
                      :label="t(item.label)"
                    >
                      {{ t(item.label) }}
                    </t-option>
                  </t-select>
                </t-form-item>
              </t-col>
              <!-- 账户负责人 -->
              <t-col :span="6">
                <t-form-item :label="$t('pages.account.head')" name="head">
                  <t-input
                    v-model="formData.head"
                    :maxcharacter="10"
                    show-limit-number
                    :style="{ width: '322px' }"
                    :placeholder="$t('pages.account.headPlaceholder')"
                  />
                </t-form-item>
              </t-col>
              <!-- 电话 -->
              <t-col :span="6">
                <t-form-item :label="$t('pages.account.phone')" name="phone">
                  <t-input
                    v-model="formData.phone"
                    :maxcharacter="11"
                    show-limit-number
                    :style="{ width: '322px' }"
                    :placeholder="$t('pages.account.phonePlaceholder')"
                  />
                </t-form-item>
              </t-col>
              <!-- 数据库 -->
              <t-col :span="6">
                <t-form-item :label="$t('pages.account.dataBaseName')" name="dataBaseName">
                  <t-input
                    v-model="formData.dataBaseName"
                    :maxcharacter="11"
                    show-limit-number
                    :style="{ width: '322px' }"
                    :placeholder="$t('pages.account.dataBaseNamePlaceholder')"
                  />
                </t-form-item>
              </t-col>
              <!-- 账户状态 -->
              <t-col :span="6">
                <t-form-item :label="$t('pages.account.useStatus')" name="useStatus">
                  <t-select v-model="formData.useStatus" :style="{ width: '322px' }" class="demo-select-base" clearable>
                    <t-option
                      v-for="(item, index) in TYPE_USE_STATUS"
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
                <t-form-item :label="$t('pages.account.startDate')" name="startDate">
                  <t-date-picker
                    v-model="formData.startDate"
                    :style="{ width: '322px' }"
                    theme="primary"
                    mode="date"
                    separator="/"
                    :placeholder="$t('pages.account.startDatePlaceholder')"
                  />
                </t-form-item>
              </t-col>
              <t-col :span="6">
                <t-form-item :label="$t('pages.account.endDate')" name="endDate">
                  <t-date-picker
                    v-model="formData.endDate"
                    :style="{ width: '322px' }"
                    theme="primary"
                    mode="date"
                    separator="/"
                    :placeholder="$t('pages.account.endDatePlaceholder')"
                  />
                </t-form-item>
              </t-col>
            </t-row>
            <t-form-item :label="$t('pages.account.address')" name="address">
              <t-input
                v-model="formData.address"
                :maxcharacter="40"
                show-limit-number
                :placeholder="$t('pages.account.addressPlaceholder')"
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
    <!-- create end -->
    <!-- Power begin -->
    <div v-if="isPowerShow" class="detail-base">
      <t-form class="base-form" label-align="top" :label-width="100">
        <t-card :title="operatorName" :bordered="false">
          <template #actions>
            <t-button class="cms-back-btn" theme="default" variant="text" @click="ClickOperatorPoweClose()">
              {{ $t('operate.backDetail') }}
              <rollback-icon size="16px" />
            </t-button>
          </template>

          <t-table
            :data="dataPower"
            :columns="COLUMNSMENU"
            row-key="index"
            table-layout="fixed"
            :max-height="530"
            :fixed-rows="undefined"
            :bordered="false"
            style="padding-top: 12px"
            lazy-load
            stripe
          >
            <template #menuName="{ row }">
              <p v-if="row.level === 1">{{ $t(row.menuName) }}</p>
              <p v-if="row.level === 2">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{{ $t(row.menuName) }}</p>
            </template>
            <template #menuDescribe="{ row }">
              <p>{{ $t(row.menuDescribe) }}</p>
            </template>
            <template #op="{ row }">
              <template v-if="row.useMenu === 0">
                <t-checkbox
                  class="checkbox-list"
                  :default-checked="false"
                  @change="onPowerMenuChange(row.idMenu, row.dataBaseName)"
                  >{{ $t('operate.use') }}</t-checkbox
                >
              </template>
              <template v-if="row.useMenu === 1">
                <t-checkbox
                  class="checkbox-list"
                  :default-checked="true"
                  @change="onPowerMenuChange(row.idMenu, row.dataBaseName)"
                  >{{ $t('operate.use') }}</t-checkbox
                >
              </template>
              <!-- modify -->
            </template>
          </t-table>

          <!-- <div v-if="isListTotal" style="text-align: left; padding-left: 15px">{{ listTotal }}</div> -->
        </t-card>
      </t-form>
    </div>
  </div>
</template>
<script lang="ts">
export default {
  name: 'Account',
};
</script>
<script setup lang="ts">
import { RollbackIcon, SearchIcon } from 'tdesign-icons-vue-next';
import type { PrimaryTableCol, TableRowData } from 'tdesign-vue-next';
import { MessagePlugin } from 'tdesign-vue-next';
import { computed, onMounted, ref } from 'vue';

import {
  CreateDataBase,
  deleteAccount,
  getAccountPowerList,
  getAllList,
  getIdList,
  getNameList,
  insertAccount,
  updateAccount,
  updateAccountPower,
} from '@/api/account';
import type { AccountModel, AccountPowerModel } from '@/api/model/accountModel';
import { TYPE_ENTERPRISE_TYPES, TYPE_USE_STATUS } from '@/constants';
import { usePermission } from '@/hooks';
import { i18n, t } from '@/locales';
import { getPermissionStore, useUserStore } from '@/store';
import { logError } from '@/utils/logger';

import { INITIAL_DATA } from './constants';

// 账户模块权限对象按 idMenu(101101) 精确匹配，权限不足时兼容空对象避免运行时报错 20260827 修改
const userInfo = usePermission('101101');
const currentUserStore = useUserStore();
const permissionStore = getPermissionStore();
const translate = (key: string) => String(i18n.global.t(key));

// 列表开始
const isListShow = ref(false);
const isDetailShow = ref(false);
const isCreateShow = ref(false);
const isReloading = ref(false);

const isCreate = ref(false);
const isModify = ref(false);
const isListTotal = ref(false);
const deleteIdx = ref(-1);
const dialogHeader = translate('operate.deleteDataCPrompt');
const isPowerShow = ref(false);
const operatorName = ref('');
let listTotal = '';

// 显示控制
const controlPageShow = (name: string) => {
  if (name === 'list') {
    isCreateShow.value = false;
    isDetailShow.value = false;
    isCreate.value = false;
    isModify.value = false;
    isReloading.value = false;
    isPowerShow.value = false;
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
  if (name === 'operatePower') {
    setTimeout(() => {
      isListShow.value = false;
      isPowerShow.value = true;
    }, 80);
  }
};

const COLUMNS: PrimaryTableCol<TableRowData>[] = [
  // { colKey: 'row-select', type: 'multiple', width: 64, fixed: 'left' },
  {
    title: translate('pages.account.account'),
    align: 'left',
    width: 220,
    colKey: 'account',
    fixed: 'left',
  },
  { title: translate('pages.account.head'), width: 160, ellipsis: true, colKey: 'head' },
  {
    title: translate('pages.account.phone'),
    width: 150,
    ellipsis: true,
    colKey: 'phone',
  },
  {
    title: translate('pages.account.enterpriseType'),
    width: 150,
    ellipsis: true,
    colKey: 'enterpriseType',
  },
  {
    title: translate('pages.account.useStatus'),
    width: 150,
    ellipsis: true,
    colKey: 'useStatus',
  },
  {
    title: translate('pages.account.dataBaseName'),
    width: 150,
    ellipsis: true,
    colKey: 'dataBaseName',
  },
  {
    title: translate('operate.operation'),
    align: 'left',
    fixed: 'right',
    width: 360,
    colKey: 'op',
  },
];

const data = ref<AccountModel[]>([]);
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

const fetchData = async () => {
  try {
    const { list } = await getAllList();
    data.value = list;
    controlPageShow('listTotal');
  } catch (e) {
    logError(e);
  }
};

const confirmBody = computed(() => {
  // 删除后 deleteIdx 未复位会越界解构报错，需先校验下标有效性 20260916 修复
  if (deleteIdx.value > -1 && data.value[deleteIdx.value]) {
    const { account } = data.value[deleteIdx.value];
    return (
      translate('operate.deleteDataAPrompt') +
      account +
      translate('operate.deleteDataBPrompt') +
      translate('pages.account.deleteCascadePrompt')
    );
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
  const idx = deleteIdx.value;
  if (idx < 0 || !data.value[idx]) {
    deleteIdx.value = -1;
    return;
  }
  const { idAccount } = data.value[idx];
  try {
    await deleteAccount(idAccount);
    // 删除成功后同步本地列表，并复位下标避免 confirmBody 越界 20260916 修改
    data.value.splice(idx, 1);
    deleteIdx.value = -1;
    confirmVisible.value = false;
    controlPageShow('listTotal');
    MessagePlugin.success(translate('operate.deleteSuccessPrompt'));
  } catch (e) {
    logError(e);
    MessagePlugin.error(translate('operate.deleteFailedPrompt'));
  }
};

const onCancel = () => {
  deleteIdx.value = -1;
};

// 详细加载
const handleClickDetail = async (row: { row: AccountModel }) => {
  const dataQuery = ref<AccountModel[]>([]);
  try {
    const { list } = await getIdList(row.row.idAccount);
    dataQuery.value = list;
  } catch (e) {
    logError(e);
  }
  detailData[0].value = dataQuery.value[0].account;
  detailData[1].value = translate(dataQuery.value[0].enterpriseType);
  detailData[2].value = dataQuery.value[0].head;
  detailData[3].value = dataQuery.value[0].phone;
  detailData[4].value = dataQuery.value[0].address;
  detailData[5].value = translate(dataQuery.value[0].useStatus);
  detailData[6].value = dataQuery.value[0].dataBaseName;
  detailData[7].value = dataQuery.value[0].startDate;
  detailData[8].value = dataQuery.value[0].endDate;
  detailData[9].value = dataQuery.value[0].createDate;
  controlPageShow('detail');
};

const handleClickModify = async (row: { row: AccountModel }) => {
  getAccountID(row.row.idAccount);
  controlPageShow('createModify');
};

const getAccountID = async (id: number) => {
  try {
    const { list } = await getIdList(id);
    const dataQuery = list[0];
    formData.value = dataQuery;
  } catch (e) {
    logError(e);
  }
};

const handleClickCreate = async () => {
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
    name: translate('pages.account.account'),
    colKey: 'account',
    value: '总部办公用品采购项目',
    serialNumber: '0',
    type: null,
  },
  {
    name: translate('pages.account.enterpriseType'),
    colKey: 'enterpriseType',
    value: translate('statusType.enterpriseTypeEnum.national'),
    serialNumber: '1',
    type: null,
  },
  {
    name: translate('pages.account.head'),
    colKey: 'head',
    value: 'BH00010',
    serialNumber: '2',
    type: null,
  },
  {
    name: translate('pages.account.phone'),
    colKey: 'phone',
    value: '13766895959',
    serialNumber: '3',
    type: null,
  },
  {
    name: translate('pages.account.address'),
    colKey: 'address',
    value: '2020-12-22 10:00:00',
    serialNumber: '4',
    type: null,
  },
  {
    name: translate('pages.account.useStatus'),
    colKey: 'useStatus',
    value: '使用',
    serialNumber: '5',
    type: {
      key: 'useStatus',
      value: 'use',
    },
  },
  {
    name: translate('pages.account.dataBaseName'),
    colKey: 'dataBaseName',
    value: 'xxx',
    serialNumber: '6',
    type: null,
  },

  {
    name: translate('pages.account.startDate'),
    colKey: 'startDate',
    value: '2021-01-20',
    serialNumber: '7',
    type: null,
  },
  {
    name: translate('pages.account.endDate'),
    colKey: 'endDate',
    value: '2022-12-20',
    serialNumber: '8',
    type: null,
  },
  {
    name: translate('pages.account.createDate'),
    colKey: 'createDate',
    value: '2020-12-22 10:00:00',
    serialNumber: '9',
    type: null,
  },
];
// detail end
// creat begin
const formCreate = ref<{ reset: () => void } | null>(null);
const formData = ref({ ...INITIAL_DATA });
const ClickCreateClose = () => {
  // 不易，先定义对应变量formCreate，后可用
  formCreate.value?.reset();
  controlPageShow('list');
};
const ClickReset = () => {
  getAccountID(formData.value.idAccount);
};

const onReset = () => {
  // 表单重置：恢复初始数据 20260917 优化
  formData.value = { ...INITIAL_DATA };
};

const ClickSubmit = async () => {
  if (formData.value.account === '') {
    return MessagePlugin.warning(translate('pages.account.accountPlaceholder'));
  }
  if (formData.value.enterpriseType === '' || formData.value.enterpriseType === undefined) {
    return MessagePlugin.warning(translate('pages.account.enterpriseTypePlaceholder'));
  }
  if (formData.value.head === '') {
    return MessagePlugin.warning(translate('pages.account.headPlaceholder'));
  }
  if (formData.value.phone === '') {
    return MessagePlugin.warning(translate('pages.account.phonePlaceholder'));
  }
  if (formData.value.startDate === '') {
    return MessagePlugin.warning(translate('pages.account.startDatePlaceholder'));
  }
  if (formData.value.endDate === '') {
    return MessagePlugin.warning(translate('pages.account.endDatePlaceholder'));
  }
  if (formData.value.dataBaseName === '') {
    return MessagePlugin.warning(translate('pages.account.dataBaseNamePlaceholder'));
  }
  if (formData.value.useStatus === '' || formData.value.useStatus === undefined) {
    return MessagePlugin.warning(translate('pages.account.useStatusPlaceholder'));
  }
  // 修改回填的 password 哈希不能随表单提交，否则后端二次哈希导致密码失效 20260916 修复
  const submitFormData = { ...formData.value };
  delete (submitFormData as Record<string, unknown>).password;
  const jsonformDataString = JSON.stringify(submitFormData);
  if (formData.value.idAccount === 0) {
    try {
      await insertAccount(jsonformDataString);
      MessagePlugin.success(translate('operate.createdSuccessPrompt'));
      fetchData();
      ClickCreateClose();
    } catch (e) {
      logError(e);
      MessagePlugin.error(translate('operate.createdFailedPrompt'));
    }
  } else {
    try {
      await updateAccount(jsonformDataString);
      MessagePlugin.success(translate('operate.modifySuccessPrompt'));
      fetchData();
      ClickCreateClose();
    } catch (e) {
      logError(e);
      MessagePlugin.error(translate('operate.modifyFailedPrompt'));
    }
  }
};

// AccountPowe begin
const handleClickPower = async (row: { row: AccountModel }) => {
  getDataPower(row.row.dataBaseName, row.row.account);
  operatorName.value = `${translate('pages.account.accountPowerTitle')}(${row.row.account})`;
  controlPageShow('operatePower');
};
const COLUMNSMENU: PrimaryTableCol[] = [
  // { colKey: 'row-select', type: 'multiple', width: 64, fixed: 'left' },
  {
    title: translate('pages.operator.menuName'),
    align: 'left',
    width: 200,
    colKey: 'menuName',
    fixed: 'left',
  },
  {
    title: translate('pages.operator.menuDescribe'),
    width: 360,
    ellipsis: true,
    colKey: 'menuDescribe',
  },

  {
    title: translate('pages.operator.menuOperation'),
    align: 'left',
    fixed: 'right',
    width: 120,
    colKey: 'op',
  },
];
const dataPower = ref<AccountPowerModel[]>([]);
const onPowerMenuChange = (idMenu: string, dataBaseName: string) => {
  onPowerChange(idMenu, dataBaseName);
};
const onPowerChange = async (idMenu: string, dataBaseName: string) => {
  const json = { idMenu: '', dataBaseName: '' };
  json.idMenu = idMenu;
  json.dataBaseName = dataBaseName;
  try {
    await updateAccountPower(json);
    const target = dataPower.value.find((item) => item.idMenu === idMenu && item.dataBaseName === dataBaseName);
    if (target) {
      target.useMenu = target.useMenu === 1 ? 0 : 1;

      if (currentUserStore.dataBaseName === dataBaseName) {
        currentUserStore.updatePermissionField(idMenu, 'useMenu', target.useMenu);
        permissionStore.updateBusinessPermission(idMenu, 'useMenu', target.useMenu);
      }
    }
  } catch (e) {
    logError(e);
  }
};
const ClickOperatorPoweClose = () => {
  // formCreate.value.reset();
  controlPageShow('list');
};
const getDataPower = async (dataBaseName: string, account: string) => {
  // 打开权限页先清空旧数据，避免接口异常或切换账户时残留上一次的列表 20260916 修复
  dataPower.value = [];
  try {
    const { list } = await getAccountPowerList(dataBaseName, account);
    dataPower.value = list;
  } catch (e) {
    logError(e);
  }
};

// CreatDataBase begin
const handleClickCreateDataBase = async (row: { row: AccountModel }) => {
  const json = { dataBaseName: '' };
  json.dataBaseName = row.row.dataBaseName;
  try {
    const res = await CreateDataBase(json);
    // 后端事务接口返回 {code, affectedRows}，以 code === 0 判定成功，避免无data字段被默认转换误报失败 20260827联调修复,
    if (res?.code === 0) {
      MessagePlugin.success(translate('operate.createDatabaseSuccessPrompt'));
    } else {
      MessagePlugin.error(translate('operate.createDatabaseFailedPrompt'));
    }
  } catch (e) {
    logError(e);
    MessagePlugin.error(translate('operate.createDatabaseFailedPrompt'));
  }
};
</script>
<style lang="less" scoped>
@import './index.less';
</style>
<style lang="less" scoped></style>

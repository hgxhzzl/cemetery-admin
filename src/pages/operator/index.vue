<template>
  <div>
    <!-- list begin -->
    <div v-show="isListShow">
      <t-card class="list-card-container" :bordered="false">
        <t-row justify="space-between">
          <div class="left-operation-container">
            <t-button v-if="userInfo.useCreate === 1" @click="handleClickCreate">{{ $t('operate.create') }} </t-button>
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
              <div v-if="slotProps.row.isAccount === 0 && userInfo.useDelete === 1">
                <t-link theme="danger" @click="handleClickDelete(slotProps)"> {{ $t('operate.delete') }}</t-link>
              </div>
              <t-link v-if="userInfo.useModify === 1" theme="danger" @click="handleClickModify(slotProps)">
                {{ $t('operate.modify') }}</t-link
              >
              <t-link v-if="userInfo.usePower === 1" theme="danger" @click="handleClickPower(slotProps)">
                {{ $t('operate.power') }}</t-link
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
      <t-card :title="$t('pages.operator.detailTitle')" :bordered="false">
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
              {{ $t('pages.operator.creatTitle') }}
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
              {{ $t('pages.operator.modifyTitle') }}
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
            <t-row class="row-gap" :gutter="[32, 24]">
              <t-col :span="6">
                <t-form-item :required="true" :label="$t('pages.operator.name')" name="name">
                  <t-input
                    v-model="formData.name"
                    :maxcharacter="20"
                    show-limit-number
                    :style="{ width: '322px' }"
                    :placeholder="$t('pages.operator.namePlaceholder')"
                  />
                </t-form-item>
              </t-col>

              <t-col :span="6">
                <t-form-item :label="$t('pages.operator.phone')" name="phone">
                  <t-input
                    v-model="formData.phone"
                    :maxcharacter="11"
                    show-limit-number
                    :style="{ width: '322px' }"
                    :placeholder="$t('pages.operator.phonePlaceholder')"
                  />
                </t-form-item>
              </t-col>
              <t-col :span="6">
                <t-form-item :label="$t('pages.operator.useStatus')" name="useStatus">
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
                <t-form-item :label="$t('pages.operator.duties')" name="duties">
                  <t-select
                    v-model="formData.duties"
                    :style="{ width: '322px' }"
                    class="demo-select-base"
                    :placeholder="$t('pages.operator.dutiesPlaceholder')"
                    clearable
                  >
                    <t-option
                      v-for="(item, index) in dataDutiesList"
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
                <t-form-item :label="$t('pages.operator.team')" name="team">
                  <t-select
                    v-model="formData.team"
                    :style="{ width: '322px' }"
                    :placeholder="$t('pages.operator.teamPlaceholder')"
                    class="demo-select-base"
                    clearable
                  >
                    <t-option
                      v-for="(item, index) in dataTeamList"
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
                <t-form-item :label="$t('pages.operator.joinDate')" name="joinDate">
                  <t-date-picker
                    v-model="formData.joinDate"
                    :style="{ width: '322px' }"
                    theme="primary"
                    mode="date"
                    separator="/"
                    :placeholder="$t('pages.operator.joinDatePlaceholder')"
                  />
                </t-form-item>
              </t-col>
            </t-row>

            <!-- 备注统一限制50字 20260917 修改 -->
            <t-form-item :label="$t('pages.operator.remark')" name="remark">
              <t-input
                v-model="formData.remark"
                :height="124"
                :maxcharacter="50"
                show-limit-number
                :placeholder="$t('pages.operator.remarkPlaceholder')"
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
    <!-- creat end -->
    <!-- Power begin -->
    <div v-show="isPowerShow" class="detail-base">
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
              <div v-if="row.useMenu === 1">
                <t-checkbox :default-checked="true" @change="onPowerMenuChange('useMenu', row.idPower)">
                  <p v-if="row.level === 1">{{ $t(row.menuName) }}</p>
                  <p v-if="row.level === 2">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{{ $t(row.menuName) }}</p>
                </t-checkbox>
              </div>
              <div v-if="row.useMenu === 0">
                <t-checkbox :default-checked="false" @change="onPowerMenuChange('useMenu', row.idPower)">
                  <p v-if="row.level === 1">{{ $t(row.menuName) }}</p>
                  <p v-if="row.level === 2">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{{ $t(row.menuName) }}</p>
                </t-checkbox>
              </div>
            </template>
            <template #op="{ row }">
              <!-- create mysql create字段设置无符号填冲零有影响，注意不要勾选 -->

              <template v-if="row.operateCreate === 1 && row.useCreate === 0">
                <t-checkbox
                  class="checkbox-list"
                  :default-checked="false"
                  @change="onPowerCreateChange('useCreate', row.idPower)"
                  >{{ $t('operate.create') }}</t-checkbox
                >
              </template>
              <template v-if="row.operateCreate === 1 && row.useCreate === 1">
                <t-checkbox
                  class="checkbox-list"
                  :default-checked="true"
                  @change="onPowerCreateChange('useCreate', row.idPower)"
                  >{{ $t('operate.create') }}</t-checkbox
                >
              </template>
              <!-- modify -->
              <template v-if="row.operateModify === 1 && row.useModify === 0">
                <t-checkbox
                  class="checkbox-list"
                  :default-checked="false"
                  @change="onPowerModifyChange('useModify', row.idPower)"
                  >{{ $t('operate.modify') }}</t-checkbox
                >
              </template>
              <template v-if="row.operateModify === 1 && row.useModify === 1">
                <t-checkbox
                  class="checkbox-list"
                  :default-checked="true"
                  @change="onPowerModifyChange('useModify', row.idPower)"
                  >{{ $t('operate.modify') }}</t-checkbox
                >
              </template>
              <!-- delete -->
              <template v-if="row.operateDelete === 1 && row.useDelete === 0">
                <t-checkbox
                  class="checkbox-list"
                  :default-checked="false"
                  @change="onPowerDeleteChange('useDelete', row.idPower)"
                  >{{ $t('operate.delete') }}</t-checkbox
                >
              </template>
              <template v-if="row.operateDelete === 1 && row.useDelete === 1">
                <t-checkbox
                  class="checkbox-list"
                  :default-checked="true"
                  @change="onPowerDeleteChange('useDelete', row.idPower)"
                  >{{ $t('operate.delete') }}</t-checkbox
                >
              </template>
              <!-- account_power 表已删除 operateSale/operateReserve 字段,销售/预定复选框同步移除 20260902 联调清理 -->
              <!-- examine -->
              <template v-if="row.operateExamine === 1 && row.useExamine === 0">
                <t-checkbox
                  class="checkbox-list"
                  :default-checked="false"
                  @change="onPowerExamineChange('useExamine', row.idPower)"
                  >{{ $t('operate.examine') }}</t-checkbox
                >
              </template>
              <template v-if="row.operateExamine === 1 && row.useExamine === 1">
                <t-checkbox
                  class="checkbox-list"
                  :default-checked="true"
                  @change="onPowerExamineChange('useExamine', row.idPower)"
                  >{{ $t('operate.examine') }}</t-checkbox
                >
              </template>
              <!-- finish -->
              <template v-if="row.operateFinish === 1 && row.useFinish === 0">
                <t-checkbox
                  class="checkbox-list"
                  :default-checked="false"
                  @change="onPowerFinishChange('useFinish', row.idPower)"
                  >{{ $t('operate.finish') }}</t-checkbox
                >
              </template>
              <template v-if="row.operateFinish === 1 && row.useFinish === 1">
                <t-checkbox
                  class="checkbox-list"
                  :default-checked="true"
                  @change="onPowerFinishChange('useFinish', row.idPower)"
                  >{{ $t('operate.finish') }}</t-checkbox
                >
              </template>
              <!-- power -->
              <template v-if="row.operatPower === 1 && row.usePower === 0">
                <t-checkbox
                  class="checkbox-list"
                  :default-checked="false"
                  @change="onPowerPowerChange('usePower', row.idPower)"
                  >{{ $t('operate.power') }}</t-checkbox
                >
              </template>
              <template v-if="row.operatPower === 1 && row.usePower === 1">
                <t-checkbox
                  class="checkbox-list"
                  :default-checked="true"
                  @change="onPowerPowerChange('usePower', row.idPower)"
                  >{{ $t('operate.power') }}</t-checkbox
                >
              </template>
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
  name: 'Operator',
};
</script>
<script setup lang="ts">
import { RollbackIcon } from 'tdesign-icons-vue-next';
import type { PrimaryTableCol } from 'tdesign-vue-next';
import { MessagePlugin } from 'tdesign-vue-next';
import { computed, onMounted, ref } from 'vue';

import type { OperatorModel, PowerModel, SelectModel } from '@/api/model/operatorModel';
import {
  deleteOperator,
  getAllList,
  getDutiesList,
  getHavePhone,
  getIdList,
  getOperatorPowerList,
  getTeamList,
  insertOperator,
  updateOperator,
  updatePower,
} from '@/api/operator';
import { TYPE_USE_STATUS } from '@/constants';
import { usePermission } from '@/hooks';
import { i18n, t } from '@/locales';
import { getPermissionStore, useUserStore } from '@/store';
import type { UserPermissionField } from '@/types/interface';
import { logError } from '@/utils/logger';

import { INITIAL_DATA } from './constants';

// 操作人员模块权限对象按 idMenu(102104) 精确匹配，权限不足时兼容空对象避免运行时报错 20260916 修复：原 102103 是园区设置菜单，操作人员应为 102104
const userInfo = usePermission('102104');
const currentUserStore = useUserStore();
const permissionStore = getPermissionStore();
const translate = (key: string) => String(i18n.global.t(key));

// list begin
const isListShow = ref(false);
const isDetailShow = ref(false);
const isCreateShow = ref(false);
const isReloading = ref(false);
const isPowerShow = ref(false);

const isCreate = ref(false);
const isModify = ref(false);
const isListTotal = ref(false);

const dataDutiesList = ref<SelectModel[]>([]);
const dataTeamList = ref<SelectModel[]>([]);
const deleteIdx = ref(-1);
const dialogHeader = translate('operate.deleteDataCPrompt');
let listTotal = '';
const operatorName = ref('');

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
    isModify.value = false;
    isCreate.value = true;
    isCreateShow.value = true;
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
    isListShow.value = false;
    isPowerShow.value = true;
  }
};

const COLUMNS: PrimaryTableCol[] = [
  // { colKey: 'row-select', type: 'multiple', width: 64, fixed: 'left' },
  {
    title: translate('pages.operator.name'),
    align: 'left',
    width: 200,
    colKey: 'name',
    fixed: 'left',
  },

  { title: translate('pages.operator.phone'), align: 'left', colKey: 'phone', width: 160, fixed: 'left' },
  {
    title: translate('pages.operator.duties'),
    width: 160,
    ellipsis: true,
    colKey: 'duties',
  },
  {
    title: translate('pages.operator.team'),
    width: 160,
    ellipsis: true,
    colKey: 'team',
  },
  {
    title: translate('pages.operator.useStatus'),
    width: 120,
    ellipsis: true,
    colKey: 'useStatus',
  },

  {
    title: translate('operate.operation'),
    align: 'left',
    fixed: 'right',
    width: 220,
    colKey: 'op',
  },
];

const data = ref<OperatorModel[]>([]);
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
  // 建立对一个值的变化监听deleteIdx，deleteIdx在handleClickDelete事件中发生变化
  // 删除后 deleteIdx 未复位会越界解构报错，需先校验下标有效性 20260824 修复，
  if (deleteIdx.value > -1 && data.value[deleteIdx.value]) {
    const { name } = data.value[deleteIdx.value];
    return translate('operate.deleteDataAPrompt') + name + translate('operate.deleteDataBPrompt');
  }
  return '';
});

onMounted(() => {
  fetchData();
  setTimeout(() => {
    controlPageShow('list');
  }, 280);
});

const confirmVisible = ref(false);
const onConfirmDelete = async () => {
  const { idOperator } = data.value[deleteIdx.value];
  data.value.splice(deleteIdx.value, 1);
  // splice 后立即复位，避免 confirmBody computed 重新求值时越界 20260824 修复，
  deleteIdx.value = -1;
  try {
    await deleteOperator(idOperator);
    confirmVisible.value = false;
    controlPageShow('listTotal');
    MessagePlugin.success(translate('operate.deleteSuccessPrompt'));
  } catch (e) {
    logError(e);
  }
};

const onCancel = () => {
  deleteIdx.value = -1;
};

const handleClickDetail = async (row: { row: OperatorModel }) => {
  const dataQuery = ref<OperatorModel[]>([]);
  try {
    const { list } = await getIdList(row.row.idOperator);
    dataQuery.value = list;
  } catch (e) {
    logError(e);
  }
  detailData[0].value = dataQuery.value[0].name;
  detailData[1].value = dataQuery.value[0].phone;
  detailData[2].value = dataQuery.value[0].duties;
  detailData[3].value = dataQuery.value[0].team;
  detailData[4].value = translate(dataQuery.value[0].useStatus);
  detailData[5].value = dataQuery.value[0].joinDate;
  controlPageShow('detail');
};

//
const handleClickModify = async (row: { row: OperatorModel }) => {
  getOperatorID(row.row.idOperator);
  editSelectData();
  controlPageShow('createModify');
};
const handleClickPower = async (row: { row: OperatorModel }) => {
  getDataPower(row.row.idOperator);
  operatorName.value = `${translate('pages.operator.operatorPowerTitle')}(${row.row.name})`;
  controlPageShow('operatePower');
};

const getOperatorID = async (id: number) => {
  try {
    const { list } = await getIdList(id);
    const dataQuery = list[0];
    formData.value = dataQuery;
  } catch (e) {
    logError(e);
  }
};

const editSelectData = async () => {
  try {
    const { list } = await getDutiesList();
    dataDutiesList.value = list;
  } catch (e) {
    logError(e);
  }
  // team
  try {
    const { list } = await getTeamList();
    dataTeamList.value = list;
  } catch (e) {
    logError(e);
  }
};

const handleClickCreate = async () => {
  // 进入新增前必须清空表单数据，否则残留的 idOperator 会让提交误走更新分支 20260824 修复，
  formData.value = { ...INITIAL_DATA };
  editSelectData();
  controlPageShow('createCreate');
};

const handleClickDelete = (row: { rowIndex: number }) => {
  deleteIdx.value = row.rowIndex;
  confirmVisible.value = true;
};

// list end
// detail begin
const ClickDetailClose = () => {
  controlPageShow('list');
};

const detailData = [
  {
    name: translate('pages.operator.name'),
    colKey: 'name',
    value: '',
    serialNumber: '0',
    type: null,
  },
  {
    name: translate('pages.operator.phone'),
    colKey: 'phone',
    value: '',
    serialNumber: '1',
    type: null,
  },
  {
    name: translate('pages.operator.duties'),
    colKey: 'duties',
    value: '',
    serialNumber: '2',
    type: null,
  },
  {
    name: translate('pages.operator.team'),
    colKey: 'team',
    value: '',
    serialNumber: '3',
    type: null,
  },
  {
    name: translate('pages.operator.useStatus'),
    colKey: 'useStatus',
    value: '',
    serialNumber: '4',
    type: {
      key: 'useStatus',
      value: 'inProgress',
    },
  },
  {
    name: translate('pages.operator.joinDate'),
    colKey: 'joinDate',
    value: '',
    serialNumber: '11',
    type: null,
  },
];
// detail end
// creat begin
const formCreate = ref<{ reset: () => void } | null>(null);
const formData = ref({ ...INITIAL_DATA });
const ClickCreateClose = () => {
  formCreate.value?.reset();
  // reset 只恢复表单挂载时的快照，修改流程下快照本身带记录数据，需显式还原初始值 20260824 修复，
  formData.value = { ...INITIAL_DATA };
  controlPageShow('list');
};

const ClickReset = () => {
  getOperatorID(formData.value.idOperator);
};

const onReset = () => {
  // 表单重置：恢复初始数据 20260917 优化
  formData.value = { ...INITIAL_DATA };
};

// 后端返回的日期是ISO-8601格式(带T/Z),MySQL不识别,提交前需转为标准格式 20260827 联调修复,
const padTwo = (n: number) => String(n).padStart(2, '0');
const toMysqlDateTime = (value: string) => {
  if (!value) return value;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return `${d.getFullYear()}-${padTwo(d.getMonth() + 1)}-${padTwo(d.getDate())} ${padTwo(d.getHours())}:${padTwo(
    d.getMinutes(),
  )}:${padTwo(d.getSeconds())}`;
};
const formatSubmitData = (data: Partial<OperatorModel> & { password?: string; createDate?: string }) => {
  const submitData = { ...data };
  // 修改表单无密码输入框，回填的旧哈希不能随提交，否则后端二次哈希导致登录失效 20260916 修复
  delete submitData.password;
  if (submitData.joinDate) {
    submitData.joinDate = toMysqlDateTime(submitData.joinDate).slice(0, 10);
  }
  if (submitData.createDate) {
    submitData.createDate = toMysqlDateTime(submitData.createDate);
  }
  return submitData;
};

const ClickSubmit = async () => {
  if (formData.value.name === '') {
    return MessagePlugin.warning(translate('pages.operator.namePlaceholder'));
  }
  if (formData.value.phone === '') {
    return MessagePlugin.warning(translate('pages.operator.phonePlaceholder'));
  }
  if (formData.value.duties === '' || formData.value.duties === undefined) {
    return MessagePlugin.warning(translate('pages.operator.dutiesPlaceholder'));
  }
  if (formData.value.team === '' || formData.value.team === undefined) {
    return MessagePlugin.warning(translate('pages.operator.teamPlaceholder'));
  }
  if (formData.value.useStatus === '' || formData.value.useStatus === undefined) {
    return MessagePlugin.warning(translate('pages.operator.useStatusPlaceholder'));
  }

  if (formData.value.joinDate === '' || formData.value.joinDate === null) {
    return MessagePlugin.warning(translate('pages.operator.joinDatePlaceholder'));
  }

  try {
    const { list } = await getHavePhone(formData.value.idOperator, formData.value.phone);
    const { havePhone } = list[0];
    if (havePhone === 0) {
      // 直接提交对象,不能JSON.stringify双重编码,否则后端body解析成字符串导致500 20260827 联调修复,
      const submitData = formatSubmitData(formData.value);
      if (formData.value.idOperator === 0) {
        try {
          await insertOperator(submitData);
          MessagePlugin.success(translate('operate.createdSuccessPrompt'));
          fetchData();
          ClickCreateClose();
        } catch (e) {
          logError(e);
          MessagePlugin.error(translate('operate.createdFailedPrompt'));
        }
      } else {
        try {
          await updateOperator(submitData);
          MessagePlugin.success(translate('operate.modifySuccessPrompt'));
          fetchData();
          ClickCreateClose();
        } catch (e) {
          logError(e);
          MessagePlugin.error(translate('operate.modifyFailedPrompt'));
        }
      }
    } else {
      return MessagePlugin.warning(translate('pages.operator.havePhonePlaceholder'));
    }
  } catch (e) {
    logError(e);
  }
};

// OperatorPowe begin
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
    title: translate('pages.operator.menuOperation'),
    align: 'left',
    fixed: 'right',
    width: 460,
    colKey: 'op',
  },
];
const dataPower = ref<PowerModel[]>([]);
const ClickOperatorPoweClose = () => {
  // formCreate.value.reset();
  controlPageShow('list');
};

const getDataPower = async (id: number) => {
  try {
    const { list } = await getOperatorPowerList(id);
    dataPower.value = list;
  } catch (e) {
    logError(e);
  }
};

const onPowerMenuChange = (power: string, row: number) => {
  onPowerChange(power, row);
};
const onPowerCreateChange = (power: string, row: number) => {
  onPowerChange(power, row);
};
const onPowerModifyChange = (power: string, row: number) => {
  onPowerChange(power, row);
};
const onPowerDeleteChange = (power: string, row: number) => {
  onPowerChange(power, row);
};
const onPowerExamineChange = (power: string, row: number) => {
  onPowerChange(power, row);
};
const onPowerFinishChange = (power: string, row: number) => {
  onPowerChange(power, row);
};
const onPowerPowerChange = (power: string, row: number) => {
  onPowerChange(power, row);
};

const onPowerChange = async (power: string, row: number) => {
  const json = { idPower: 0, field: '' };
  json.field = power;
  json.idPower = row;
  try {
    await updatePower(json);
    const target = dataPower.value.find((item) => item.idPower === row);
    if (target) {
      const permissionField = power as keyof PowerModel;
      const currentValue = Number(target[permissionField] || 0);
      target[permissionField] = (currentValue === 1 ? 0 : 1) as never;

      if (target.idOperator === currentUserStore.userId) {
        currentUserStore.updatePermissionField(
          target.idMenu,
          power as UserPermissionField,
          Number(target[permissionField]),
        );
        if (power === 'useMenu') {
          permissionStore.updateBusinessPermission(target.idMenu, 'useMenu', Number(target[permissionField]));
        }
      }
    }
  } catch (e) {
    logError(e);
  }
};
</script>
<style lang="less" scoped>
@import './index.less';
</style>
<style lang="less" scoped></style>

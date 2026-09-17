<template>
  <!-- 参照墓区下葬查询页骨架：单根 div + 列表(常驻挂载)/详情(v-if)/修改(v-if) 视图切换 20260915 新增 -->
  <div>
    <!-- 列表页面开始：列表始终挂载，详情/修改显示时用 list-view-hidden 高度塌陷+不可见。
      不用 v-show(display:none)：display:none 会使表格尺寸归零，TDesign 表格内部 ResizeObserver
      在隐藏期间以 0 尺寸刷新固定列偏移与表头 sticky 状态，返回列表后 200ms 延迟修正期间列表错位晃动 -->
    <div :class="{ 'list-view-hidden': !isListShow }">
      <t-card class="cms-query-list-card-container" :bordered="false">
        <!-- 筛选条件：区域/园区/结束日期时间段与查询按钮尽量同行 -->
        <t-form
          class="cms-query-filter-form"
          :data="formData"
          :label-width="QUERY_FORM_LABEL_WIDTH"
          colon
          @submit="onSubmit"
        >
          <div class="cms-query-filter-row cms-query-filter-row-fixed-three">
            <t-form-item
              :label="t('pages.managementPeriod.region')"
              name="region"
              class="cms-filter-item cms-filter-item-query cms-filter-item-basic"
            >
              <t-select
                v-model="formData.region"
                class="cms-filter-control"
                :options="regionOptions"
                :placeholder="t('pages.managementPeriod.regionPlaceholder')"
                clearable
                @change="onRegionChange"
              />
            </t-form-item>

            <t-form-item
              :label="t('pages.managementPeriod.park')"
              name="park"
              class="cms-filter-item cms-filter-item-query cms-filter-item-basic"
            >
              <t-select
                v-model="formData.park"
                class="cms-filter-control"
                :options="parkOptions"
                :placeholder="t('pages.managementPeriod.parkPlaceholder')"
                clearable
              />
            </t-form-item>

            <t-form-item
              :label="t('pages.managementPeriod.date')"
              name="endDate"
              class="cms-filter-item cms-filter-item-query cms-filter-item-basic"
            >
              <t-date-picker
                v-model="formData.endDate"
                class="cms-filter-control"
                mode="date"
                :placeholder="t('pages.managementPeriod.datePlaceholder')"
              />
            </t-form-item>

            <div class="cms-query-operation-container">
              <t-button theme="primary" type="submit">{{ t('operate.query') }}</t-button>
              <!-- 导出当前条件下全部数据：循环分页拉取后生成 CSV 文件下载 -->
              <t-button theme="default" :loading="exporting" @click="handleExport">{{ t('operate.export') }}</t-button>
            </div>
          </div>
        </t-form>

        <!-- 表格高度随屏幕自适应：每页 40 条(约1920px)远超表格高度，滚动条必然出现，无需再封顶 20260913 修改 -->
        <t-table
          ref="tableRef"
          :data="data"
          :columns="COLUMNS"
          row-key="idRoom"
          table-layout="fixed"
          max-height="calc(100vh - 378px)"
          :bordered="false"
          lazy-load
          stripe
          @scroll="handleScroll"
        >
          <template #endDate="{ row }">
            {{ formatDate(row.endDate) }}
          </template>
          <template #op="{ row }">
            <div class="cms-management-op">
              <t-link theme="primary" @click="handleClickDetail(row)">
                {{ t('operate.detail') }}
              </t-link>
              <!-- 修改按管理期限菜单(104102)权限门控：operator_power.useModify 20260915 新增 -->
              <t-link v-if="userInfo.useModify === 1" theme="primary" @click="handleClickModify(row)">
                {{ t('operate.modify') }}
              </t-link>
            </div>
          </template>
        </t-table>
        <!-- 底部信息行：左侧记录总数，右侧滚动加载状态，固定一行保持卡片高度与下葬查询页一致(672px) -->
        <div v-if="pagination.total > 0" class="cms-query-summary">
          <span>{{ translate('operate.total') }}{{ pagination.total }}{{ translate('operate.records') }}</span>
          <span v-if="loading" class="cms-query-summary-status">{{ t('pages.managementPeriod.loading') }}</span>
          <span v-else-if="!hasMore" class="cms-query-summary-status">{{ t('pages.managementPeriod.noMore') }}</span>
        </div>
      </t-card>
    </div>
    <!-- 列表页面结束 -->

    <!-- 详情页面开始：与其它业务页共用 room-detail 组件，展示与下葬查询详情完全一致 20260915 新增 -->
    <room-detail
      v-if="isDetailShow"
      :room="detailRoom"
      :reserve="detailReserve"
      :sale="detailSale"
      :buried="detailBuried"
      :adminfees="detailAdminfees"
      :contacts="detailContacts"
      @close="ClickDetailClose"
    />
    <!-- 详情页面结束 -->

    <!-- 管理期限修改开始：参照管理费收款登记表单骨架，仅保留期限变更所需字段 20260915 新增 -->
    <div v-if="isModifyShow">
      <t-form class="base-form" :data="formPeriodData" label-align="top" :label-width="100">
        <div class="form-basic-container">
          <div class="form-basic-item">
            <div class="form-basic-container-title">
              {{ t('pages.managementPeriod.modifyTitle') }}
              <t-button style="float: right" theme="default" shape="square" variant="text" @click="ClickModifyClose()">
                <rollback-icon size="16px" />
              </t-button>
            </div>

            <!-- 墓穴信息展示行：数据取自当前列表行 -->
            <t-row class="info-block des" :gutter="[62, 5]">
              <t-col :span="6">
                <span>{{ t('pages.managementPeriod.park') }} : {{ formRoomData.park }}</span>
              </t-col>
              <t-col :span="6">
                <span>{{ t('pages.managementPeriod.xyNumber') }} : {{ formRoomData.xyNumber }}</span>
              </t-col>
              <t-col :span="6">
                <span>{{ t('pages.managementPeriod.contacts') }} : {{ formRoomData.contacts }}</span>
              </t-col>
              <t-col :span="6">
                <span>{{ t('pages.managementPeriod.contactsPhone') }} : {{ formRoomData.contactsPhone }}</span>
              </t-col>
            </t-row>

            <!-- 期限变更表单：原结束日期只读代入，新结束日期选择，原因必填 -->
            <t-row class="info-block des" :gutter="[62, 5]">
              <t-col :span="6">
                <t-form-item :label="t('pages.managementPeriod.oldEndDate')" name="oldEndDate">
                  <t-input
                    v-model="formPeriodData.oldEndDate"
                    readonly
                    :style="{ width: '322px' }"
                    :placeholder="t('pages.managementPeriod.endDatePlaceholder')"
                  />
                </t-form-item>
              </t-col>
              <t-col :span="6">
                <t-form-item :required="true" :label="t('pages.managementPeriod.newEndDate')" name="newEndDate">
                  <t-date-picker
                    v-model="formPeriodData.newEndDate"
                    :style="{ width: '322px' }"
                    theme="primary"
                    mode="date"
                    separator="/"
                    :placeholder="t('pages.managementPeriod.newEndDatePlaceholder')"
                  />
                </t-form-item>
              </t-col>
              <t-col :span="12">
                <t-form-item :required="true" :label="t('pages.managementPeriod.reason')" name="reason">
                  <t-input
                    v-model="formPeriodData.reason"
                    :maxcharacter="100"
                    show-limit-number
                    :style="{ width: '322px' }"
                    :placeholder="t('pages.managementPeriod.reasonPlaceholder')"
                  />
                </t-form-item>
              </t-col>
            </t-row>
          </div>
        </div>

        <div class="form-submit-container">
          <div class="form-submit-sub">
            <div class="form-submit-left">
              <t-button theme="primary" class="form-submit-confirm" @click="ClickSubmit()">
                {{ t('operate.confirm') }}
              </t-button>

              <t-button class="form-submit-cancel" theme="default" @click="ClickModifyClose()">
                {{ t('operate.cancel') }}
              </t-button>
            </div>
          </div>
        </div>
      </t-form>
    </div>
    <!-- 管理期限修改结束 -->
  </div>
</template>
<script lang="ts">
export default {
  name: 'ManagementPeriod',
};
</script>
<script setup lang="ts">
import dayjs from 'dayjs';
import { RollbackIcon } from 'tdesign-icons-vue-next';
import type { PrimaryTableCol, TableRowData } from 'tdesign-vue-next';
import { MessagePlugin } from 'tdesign-vue-next';
import { computed, nextTick, onMounted, ref } from 'vue';

import type { ManagementPeriodModel } from '@/api/managementPeriod';
import { getManagementPeriodList, updateManagementPeriod } from '@/api/managementPeriod';
import type { ListParkModel, SelectModel } from '@/api/model/parkModel';
import { getParkList, getRegionList } from '@/api/park';
import RoomDetail from '@/components/room-detail/index.vue';
import { QUERY_FORM_LABEL_WIDTH } from '@/constants';
import { useInfiniteScrollQuery, useLayoutScrollRestore, usePermission, useRoomDetail, useTabCacheName } from '@/hooks';
import { t, translate } from '@/locales';
import { exportCsv } from '@/utils/csv';
import { formatDate } from '@/utils/date';
import { logError } from '@/utils/logger';

// ============================================================
// 管理期限页：参照下葬查询页骨架，筛选查询 + 明细分页 + 公共详情 + 期限修改 20260915 新增
// ============================================================

// ==================== 通用：视图切换与权限 ====================
// 向 tab 记录登记组件真实 name：路由 name 为小写 managementPeriod，与组件名不一致，
// 不登记则 keep-alive 无法缓存本页，切换路由时 out-in 过渡会卡死导致其它页面打不开
useTabCacheName('ManagementPeriod');

// 管理期限权限对象按 idMenu(104102) 精确匹配，权限不足时兼容空对象避免运行时报错 20260915 新增
const userInfo = usePermission('104102');

// 视图互斥显示：列表 / 详情 / 修改。列表始终挂载，
// 详情/修改显示时列表通过 list-view-hidden 高度塌陷隐藏，无需单独的列表态标记
const isListShow = ref(true);
const isDetailShow = ref(false);
const isModifyShow = ref(false);

// ==================== 列表：筛选与表格 ====================
// 列宽调整：每列足够展示完整内容(表头不截断)，容器不足时横向滚动而非压缩 20260915 新增
const COLUMNS: PrimaryTableCol<TableRowData>[] = [
  // TDesign 内置序号列：当前页内从 1 自动递增，固定在左侧便于横向滚动时可见
  {
    title: translate('pages.managementPeriod.index'),
    width: 64,
    align: 'center',
    colKey: 'serial-number',
    fixed: 'left',
  },
  { title: translate('pages.managementPeriod.region'), align: 'left', width: 110, colKey: 'region', ellipsis: true },
  { title: translate('pages.managementPeriod.park'), align: 'left', width: 200, colKey: 'park', ellipsis: true },
  { title: translate('pages.managementPeriod.xyNumber'), width: 130, colKey: 'xyNumber', ellipsis: true },
  { title: translate('pages.managementPeriod.endDate'), width: 120, colKey: 'endDate' },
  { title: translate('pages.managementPeriod.contacts'), width: 110, colKey: 'contacts', ellipsis: true },
  { title: translate('pages.managementPeriod.contactsPhone'), width: 170, colKey: 'contactsPhone' },
  {
    title: translate('operate.operation'),
    align: 'left',
    fixed: 'right',
    width: 120,
    colKey: 'op',
  },
];

interface FormData {
  region: string;
  park: string;
  endDate: string;
}

const searchForm: FormData = {
  region: '',
  park: '',
  // 结束日期默认今天：查询结束日期早于今天的墓位
  endDate: dayjs().format('YYYY-MM-DD'),
};

const formData = ref<FormData>({ ...searchForm });
const tableRef = ref();
const dataRegionList = ref<Array<SelectModel>>([]);
const dataParkList = ref<Array<ListParkModel>>([]);

// 无限滚动加载状态机（分页/防抖/到底追加/查询重置滚动归零）收敛于公共 useInfiniteScrollQuery 20260914 抽取
const { data, pagination, loading, hasMore, fetchData, onSubmit, handleScroll } =
  useInfiniteScrollQuery<ManagementPeriodModel>(
    (current, pageSize) => getManagementPeriodList(getQueryParams(current, pageSize)),
    tableRef,
  );

const regionOptions = computed(() => dataRegionList.value.map((item) => ({ value: item.value, label: item.label })));

// 园区下拉随所选区域联动过滤（区域接口 value 即区域名）
const parkOptions = computed(() => {
  const { region } = formData.value;
  if (!region) {
    return dataParkList.value.map((item) => ({ value: item.value, label: item.label }));
  }
  return dataParkList.value
    .filter((item) => item.region === region)
    .map((item) => ({ value: item.value, label: item.label }));
});

// 当前筛选条件查询参数：列表滚动分页与全量导出共用，避免两处条件拼装不一致
const getQueryParams = (current: number, pageSize: number) => {
  return {
    region: formData.value.region,
    park: formData.value.park,
    endDate: formData.value.endDate,
    current,
    pageSize,
  };
};

// ==================== 列表：导出 ====================
// 导出进行中标记：防止重复点击并发拉取
const exporting = ref(false);

// 导出当前筛选条件下的全部数据：分页拉取与 CSV 生成收敛于公共 exportCsv 20260914 抽取
const handleExport = async () => {
  if (exporting.value) {
    return;
  }
  exporting.value = true;
  try {
    // 表头与表格列一致：序号/区域/园区/墓区编号/结束日期/联系人/联系人电话
    await exportCsv<ManagementPeriodModel>({
      fileName: '管理期限',
      headers: [
        translate('pages.managementPeriod.index'),
        translate('pages.managementPeriod.region'),
        translate('pages.managementPeriod.park'),
        translate('pages.managementPeriod.xyNumber'),
        translate('pages.managementPeriod.endDate'),
        translate('pages.managementPeriod.contacts'),
        translate('pages.managementPeriod.contactsPhone'),
      ],
      fetchPage: (current, pageSize) => getManagementPeriodList(getQueryParams(current, pageSize)),
      // 序号从 1 连续编号；日期与列表一致格式化
      rowToLine: (row, index) => [
        index + 1,
        row.region,
        row.park,
        row.xyNumber,
        formatDate(row.endDate),
        row.contacts,
        row.contactsPhone,
      ],
    });
  } catch (e) {
    logError(e);
  } finally {
    exporting.value = false;
  }
};

// 切换区域时清空园区选择，避免园区与区域不匹配
const onRegionChange = () => {
  formData.value.park = '';
};

// ==================== 详情：与其它业务页共用 room-detail 组件 ====================
// 详情统一由 room-detail 组件展示，数据加载收敛于 useRoomDetail；滚动位置恢复收敛于 useLayoutScrollRestore 20260914 抽取
const {
  detailRoom,
  detailReserve,
  detailSale,
  detailBuried,
  detailAdminfees,
  detailContacts,
  loadDetail,
  clearDetail,
} = useRoomDetail();
const { saveScrollTop, restoreScrollTop } = useLayoutScrollRestore();

// 点击行详情：拉取单条墓位数据与活动预定/销售/下葬/收款/联系人记录后进入详情视图（与下葬查询详情一致）
const handleClickDetail = async (row: ManagementPeriodModel) => {
  try {
    await loadDetail(row.idRoom);
    // 切换详情前记录外层滚动容器位置，返回列表时恢复：详情视图高度远大于列表，
    // 若返回时滚动位置被浏览器钳制到新最大值，列表会瞬间跳变
    saveScrollTop();
    isListShow.value = false;
    isDetailShow.value = true;
  } catch (e) {
    logError(e);
  }
};

// 详情关闭：清空详情数据并回到列表
const ClickDetailClose = () => {
  clearDetail();
  isDetailShow.value = false;
  isListShow.value = true;
  // 返回列表：恢复外层滚动位置，并立即重算表格固定列偏移/表头状态。
  // 不等 TDesign ResizeObserver 的 200ms 延迟修正，避免固定列错位回正造成的晃动
  nextTick(() => {
    restoreScrollTop();
    tableRef.value?.refreshTable?.();
  });
};

// ==================== 修改：管理期限变更登记 ====================
// 修改页墓穴信息展示行：数据取自当前列表行（列表行已含全部展示字段，无需再查库）20260915 新增
interface RoomBriefData {
  park: string;
  xyNumber: string;
  contacts: string;
  contactsPhone: string;
}

interface PeriodFormData {
  idRoom: number;
  // 原结束日期：代入列表行结束日期，只读存档
  oldEndDate: string;
  // 新结束日期：日期选择录入
  newEndDate: string;
  // 变更原因
  reason: string;
}

const INITIAL_PERIOD_DATA: PeriodFormData = {
  idRoom: 0,
  oldEndDate: '',
  newEndDate: '',
  reason: '',
};

const formRoomData = ref<RoomBriefData>({ park: '', xyNumber: '', contacts: '', contactsPhone: '' });
const formPeriodData = ref<PeriodFormData>({ ...INITIAL_PERIOD_DATA });

// 点击行“修改”：代入原结束日期并进入修改视图（参照管理费收款登记页骨架，仅保留期限变更字段）
const handleClickModify = (row: ManagementPeriodModel) => {
  formRoomData.value = {
    park: row.park,
    xyNumber: row.xyNumber,
    contacts: row.contacts,
    contactsPhone: row.contactsPhone,
  };
  formPeriodData.value = {
    idRoom: row.idRoom,
    // 原结束日期代入列表行结束日期（YYYY-MM-DD）
    oldEndDate: formatDate(row.endDate),
    newEndDate: '',
    reason: '',
  };
  saveScrollTop();
  isListShow.value = false;
  isModifyShow.value = true;
};

// 修改视图关闭：清空表单数据并回到列表
const ClickModifyClose = () => {
  formRoomData.value = { park: '', xyNumber: '', contacts: '', contactsPhone: '' };
  formPeriodData.value = { ...INITIAL_PERIOD_DATA };
  isModifyShow.value = false;
  isListShow.value = true;
  nextTick(() => {
    restoreScrollTop();
    tableRef.value?.refreshTable?.();
  });
};

// 提交期限修改：新结束日期与原因必填校验；成功后刷新列表并关闭修改视图 20260915 新增
const ClickSubmit = async () => {
  if (!formPeriodData.value.newEndDate) {
    return MessagePlugin.warning(translate('pages.managementPeriod.newEndDatePlaceholder'));
  }
  if (!formPeriodData.value.reason.trim()) {
    return MessagePlugin.warning(translate('pages.managementPeriod.reasonPlaceholder'));
  }
  try {
    await updateManagementPeriod(formPeriodData.value);
    MessagePlugin.success(translate('operate.modifySuccessPrompt'));
    await fetchData(true);
    ClickModifyClose();
  } catch (e) {
    logError(e);
    MessagePlugin.error(translate('operate.modifyFailedPrompt'));
  }
};

// 区域下拉数据加载
const loadRegionOptions = async () => {
  try {
    const { list } = await getRegionList();
    dataRegionList.value = list;
  } catch (e) {
    logError(e);
  }
};

// 园区下拉数据加载
const loadParkOptions = async () => {
  try {
    const { list } = await getParkList();
    dataParkList.value = list;
  } catch (e) {
    logError(e);
  }
};

onMounted(() => {
  loadRegionOptions();
  loadParkOptions();
  fetchData(true);
});
</script>
<style lang="less" scoped>
@import './index.less';
</style>

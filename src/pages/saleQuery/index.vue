<template>
  <!-- 参照合同页骨架重构：单根 div + 列表(常驻挂载)/详情(v-if) 视图切换 20260911 重构 -->
  <div>
    <!-- 列表页面开始：列表始终挂载，详情显示时用 list-view-hidden 高度塌陷+不可见。
      不用 v-show(display:none)：display:none 会使表格尺寸归零，TDesign 表格内部 ResizeObserver
      在隐藏期间以 0 尺寸刷新固定列偏移与表头 sticky 状态，返回列表后 200ms 延迟修正期间列表错位晃动 20260912 修改 -->
    <div :class="{ 'list-view-hidden': isDetailShow }">
      <t-card class="cms-query-list-card-container" :bordered="false">
        <!-- 筛选条件：区域/园区/时间段与查询按钮尽量同行 -->
        <t-form
          class="cms-query-filter-form"
          :data="formData"
          :label-width="QUERY_FORM_LABEL_WIDTH"
          colon
          @submit="onSubmit"
        >
          <div class="cms-query-filter-row cms-query-filter-row-fixed-three">
            <t-form-item
              :label="t('pages.saleQuery.region')"
              name="region"
              class="cms-filter-item cms-filter-item-query cms-filter-item-basic"
            >
              <t-select
                v-model="formData.region"
                class="cms-filter-control"
                :options="regionOptions"
                :placeholder="t('pages.saleQuery.regionPlaceholder')"
                clearable
                @change="onRegionChange"
              />
            </t-form-item>

            <t-form-item
              :label="t('pages.saleQuery.park')"
              name="park"
              class="cms-filter-item cms-filter-item-query cms-filter-item-basic"
            >
              <t-select
                v-model="formData.park"
                class="cms-filter-control"
                :options="parkOptions"
                :placeholder="t('pages.saleQuery.parkPlaceholder')"
                clearable
              />
            </t-form-item>

            <t-form-item
              :label="t('pages.saleQuery.dateRange')"
              name="dateRange"
              class="cms-filter-item cms-filter-item-query cms-filter-item-date-range"
            >
              <t-date-range-picker
                v-model="formData.dateRange"
                class="cms-filter-control"
                mode="date"
                clearable
                :placeholder="[t('pages.saleQuery.startDatePlaceholder'), t('pages.saleQuery.endDatePlaceholder')]"
              />
            </t-form-item>

            <div class="cms-query-operation-container">
              <t-button theme="primary" type="submit">{{ t('operate.query') }}</t-button>
              <!-- 导出当前条件下全部数据：循环分页拉取后生成 CSV 文件下载 20260912 新增 -->
              <t-button theme="default" :loading="exporting" @click="handleExport">{{ t('operate.export') }}</t-button>
            </div>
          </div>
        </t-form>

        <!-- 表格高度随屏幕自适应：每页 40 条远超表格高度，滚动条必然出现 20260913 修改 -->
        <t-table
          ref="tableRef"
          :data="data"
          :columns="COLUMNS"
          row-key="idSale"
          table-layout="fixed"
          max-height="calc(100vh - 378px)"
          :bordered="false"
          lazy-load
          stripe
          @scroll="handleScroll"
        >
          <template #price="{ row }">
            {{ formatPrice(row.price) }}
          </template>
          <template #realPrice="{ row }">
            {{ formatPrice(row.realPrice) }}
          </template>
          <template #createDate="{ row }">
            {{ formatDate(row.createDate) }}
          </template>
          <template #op="{ row }">
            <t-link theme="primary" @click="handleClickDetail(row)">
              {{ t('operate.detail') }}
            </t-link>
          </template>
        </t-table>
        <!-- 底部信息行：左侧记录总数，右侧滚动加载状态，固定一行保持卡片高度与合同页一致(672px) 20260911 修改 -->
        <div v-if="pagination.total > 0" class="cms-query-summary">
          <div class="cms-query-summary-left">
            <span>{{ translate('operate.total') }}{{ pagination.total }}{{ translate('operate.records') }}</span>
            <!-- 金额合计：实际售价总和，千分位格式化 20260913 新增 -->
            <span class="cms-query-summary-amount"
              >{{ t('pages.saleQuery.totalAmount') }}：{{ formatPrice(pagination.totalAmount) }}</span
            >
          </div>
          <span v-if="loading" class="cms-query-summary-status">{{ t('pages.saleQuery.loading') }}</span>
          <span v-else-if="!hasMore" class="cms-query-summary-status">{{ t('pages.saleQuery.noMore') }}</span>
        </div>
      </t-card>
    </div>
    <!-- 列表页面结束 -->

    <!-- 详情页面开始：与墓区下葬页共用 room-detail 组件 20260911 新增 -->
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
  </div>
</template>
<script lang="ts">
export default {
  name: 'SaleQuery',
};
</script>
<script setup lang="ts">
import dayjs from 'dayjs';
import type { PrimaryTableCol, TableRowData } from 'tdesign-vue-next';
import { computed, nextTick, onMounted, ref } from 'vue';

import type { ListParkModel, SelectModel } from '@/api/model/parkModel';
import { getParkList, getRegionList } from '@/api/park';
import type { SaleQueryModel } from '@/api/saleQuery';
import { getSaleQueryList } from '@/api/saleQuery';
import RoomDetail from '@/components/room-detail/index.vue';
import { QUERY_FORM_LABEL_WIDTH } from '@/constants';
import { useInfiniteScrollQuery, useLayoutScrollRestore, useRoomDetail, useTabCacheName } from '@/hooks';
import { t, translate } from '@/locales';
import { exportCsv } from '@/utils/csv';
import { formatDate } from '@/utils/date';
import { formatPrice } from '@/utils/format';
import { logError } from '@/utils/logger';

// ============================================================
// 墓区销售查询页：参照合同页骨架，筛选查询 + 明细分页 + 公共详情 20260911 重构
// ============================================================

// ==================== 通用：视图切换 ====================
// 向 tab 记录登记组件真实 name：路由 name 为小写 saleQuery，与组件名不一致，
// 不登记则 keep-alive 无法缓存本页，切换路由时 out-in 过渡会卡死导致其它页面打不开 20260911 重构
useTabCacheName('SaleQuery');

// 视图互斥显示：列表 / 详情。仅详情态需响应式：列表始终挂载，
// 详情显示时列表通过 list-view-hidden 高度塌陷隐藏，无需单独的列表态标记 20260912 优化
const isDetailShow = ref(false);

// ==================== 列表：筛选与表格 ====================
// 列宽调整：每列足够展示完整内容，容器不足时横向滚动而非压缩 20260913 修改
const COLUMNS: PrimaryTableCol<TableRowData>[] = [
  // TDesign 内置序号列：当前页内从 1 自动递增，固定在左侧便于横向滚动时可见 20260911 新增
  { title: translate('pages.saleQuery.index'), width: 64, align: 'center', colKey: 'serial-number', fixed: 'left' },
  { title: translate('pages.saleQuery.region'), align: 'left', width: 110, colKey: 'region', ellipsis: true },
  { title: translate('pages.saleQuery.park'), align: 'left', width: 200, colKey: 'park', ellipsis: true },
  { title: translate('pages.saleQuery.xyNumber'), width: 130, colKey: 'xyNumber', ellipsis: true },
  { title: translate('pages.saleQuery.price'), width: 120, align: 'right', colKey: 'price' },
  { title: translate('pages.saleQuery.realPrice'), width: 120, align: 'right', colKey: 'realPrice' },
  { title: translate('pages.saleQuery.payer'), width: 110, colKey: 'payer', ellipsis: true },
  { title: translate('pages.saleQuery.payerPhone'), width: 170, colKey: 'payerPhone' },
  { title: translate('pages.saleQuery.createDate'), width: 120, colKey: 'createDate' },
  {
    title: translate('operate.operation'),
    align: 'left',
    fixed: 'right',
    width: 80,
    colKey: 'op',
  },
];

interface FormData {
  region: string;
  park: string;
  dateRange: string[];
}

const searchForm: FormData = {
  region: '',
  park: '',
  // 时间段默认最近一个月：如今天 2026-09-11，则默认 2026-08-11 至 2026-09-11 20260911 新增
  dateRange: [dayjs().subtract(1, 'month').format('YYYY-MM-DD'), dayjs().format('YYYY-MM-DD')],
};

const formData = ref<FormData>({ ...searchForm });
const tableRef = ref();
const dataRegionList = ref<Array<SelectModel>>([]);
const dataParkList = ref<Array<ListParkModel>>([]);

// 无限滚动加载状态机（分页/防抖/到底追加/查询重置滚动归零）收敛于公共 useInfiniteScrollQuery 20260914 抽取
const { data, pagination, loading, hasMore, fetchData, onSubmit, handleScroll } =
  useInfiniteScrollQuery<SaleQueryModel>(
    (current, pageSize) => getSaleQueryList(getQueryParams(current, pageSize)),
    tableRef,
  );

const regionOptions = computed(() => dataRegionList.value.map((item) => ({ value: item.value, label: item.label })));

// 园区下拉随所选区域联动过滤（区域接口 value 即区域名） 20260911 重构
const parkOptions = computed(() => {
  const { region } = formData.value;
  if (!region) {
    return dataParkList.value.map((item) => ({ value: item.value, label: item.label }));
  }
  return dataParkList.value
    .filter((item) => item.region === region)
    .map((item) => ({ value: item.value, label: item.label }));
});

// 创建日期在库中为 datetime，列表统一格式化为 yyyy-mm-dd 显示，收敛于公共 formatDate 20260914 抽取

// 当前筛选条件查询参数：列表分页与全量导出共用，避免两处条件拼装不一致 20260912 优化
const getQueryParams = (current: number, pageSize: number) => {
  const [startDate, endDate] = formData.value.dateRange || [];
  return {
    region: formData.value.region,
    park: formData.value.park,
    startDate,
    endDate,
    current,
    pageSize,
  };
};

// ==================== 列表：导出 ====================
// 导出进行中标记：防止重复点击并发拉取 20260912 新增
const exporting = ref(false);

// 导出当前筛选条件下的全部数据：分页拉取与 CSV 生成收敛于公共 exportCsv 20260914 抽取
const handleExport = async () => {
  if (exporting.value) {
    return;
  }
  exporting.value = true;
  try {
    // 表头与表格列一致：序号/区域/园区/墓区编号/价格/实际价格/付款人/付款人电话/创建日期 20260912 新增
    await exportCsv<SaleQueryModel>({
      fileName: '墓区销售查询',
      headers: [
        translate('pages.saleQuery.index'),
        translate('pages.saleQuery.region'),
        translate('pages.saleQuery.park'),
        translate('pages.saleQuery.xyNumber'),
        translate('pages.saleQuery.price'),
        translate('pages.saleQuery.realPrice'),
        translate('pages.saleQuery.payer'),
        translate('pages.saleQuery.payerPhone'),
        translate('pages.saleQuery.createDate'),
      ],
      fetchPage: (current, pageSize) => getSaleQueryList(getQueryParams(current, pageSize)),
      // 序号从 1 连续编号；价格导出原始数值便于 Excel 求和；日期与列表一致格式化 20260912 新增
      rowToLine: (row, index) => [
        index + 1,
        row.region,
        row.park,
        row.xyNumber,
        row.price,
        row.realPrice,
        row.payer,
        row.payerPhone,
        formatDate(row.createDate),
      ],
    });
  } catch (e) {
    logError(e);
  } finally {
    exporting.value = false;
  }
};

// 切换区域时清空园区选择，避免园区与区域不匹配 20260911 重构
const onRegionChange = () => {
  formData.value.park = '';
};

// 滚动到底部自动加载下一页逻辑收敛于公共 useInfiniteScrollQuery 20260914 抽取

// ==================== 详情：与下葬页共用 room-detail 组件 ====================
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

// 点击行详情：拉取单条墓位数据与活动预定/销售/下葬记录后进入详情视图 20260911 重构
const handleClickDetail = async (row: SaleQueryModel) => {
  try {
    await loadDetail(row.idRoom);
    // 切换详情前记录外层滚动容器位置，返回列表时恢复：详情视图高度远大于列表，
    // 若返回时滚动位置被浏览器钳制到新最大值，列表会瞬间跳变 20260912 修改
    saveScrollTop();
    isDetailShow.value = true;
  } catch (e) {
    logError(e);
  }
};

// 详情关闭：清空详情数据并回到列表 20260911 重构
const ClickDetailClose = () => {
  clearDetail();
  isDetailShow.value = false;
  // 返回列表：恢复外层滚动位置，并立即重算表格固定列偏移/表头状态。
  // 不等 TDesign ResizeObserver 的 200ms 延迟修正，避免固定列错位回正造成的晃动 20260912 修改
  nextTick(() => {
    restoreScrollTop();
    tableRef.value?.refreshTable?.();
  });
};

// 区域下拉数据加载 20260912 优化
const loadRegionOptions = async () => {
  try {
    const { list } = await getRegionList();
    dataRegionList.value = list;
  } catch (e) {
    logError(e);
  }
};

// 园区下拉数据加载 20260912 优化
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
<style lang="less" scoped></style>

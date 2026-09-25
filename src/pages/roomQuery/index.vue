<template>
  <!-- 参照销售查询页骨架：单根 div + 列表(常驻挂载)/详情(v-if) 视图切换 20260924 新增 -->
  <div>
    <!-- 列表页面开始：列表始终挂载，详情显示时用 list-view-hidden 高度塌陷+不可见，
      不用 v-show(display:none)：display:none 会使表格尺寸归零，TDesign 表格内部 ResizeObserver
      在隐藏期间以 0 尺寸刷新固定列偏移与表头 sticky 状态，返回列表后 200ms 延迟修正期间列表错位晃动 20260924 新增 -->
    <div :class="{ 'list-view-hidden': isDetailShow }">
      <t-card class="cms-query-list-card-container" :bordered="false">
        <!-- 筛选条件分两行：第一行区域/园区/销售日期与查询/导出按钮（恢复最初公共样式），第二行关键词 20260924 修改 -->
        <t-form
          class="cms-query-filter-form cms-query-filter-form-roomquery"
          :data="formData"
          :label-width="QUERY_FORM_LABEL_WIDTH"
          colon
          @submit="onSubmit"
        >
          <div class="cms-query-filter-row cms-query-filter-row-fixed-three">
            <t-form-item
              :label="t('pages.roomQuery.region')"
              name="region"
              class="cms-filter-item cms-filter-item-query cms-filter-item-basic"
            >
              <t-select
                v-model="formData.region"
                class="cms-filter-control"
                :options="regionOptions"
                :placeholder="t('pages.roomQuery.regionPlaceholder')"
                clearable
                @change="onRegionChange"
              />
            </t-form-item>

            <t-form-item
              :label="t('pages.roomQuery.park')"
              name="park"
              class="cms-filter-item cms-filter-item-query cms-filter-item-basic"
            >
              <t-select
                v-model="formData.park"
                class="cms-filter-control"
                :options="parkOptions"
                :placeholder="t('pages.roomQuery.parkPlaceholder')"
                clearable
              />
            </t-form-item>

            <t-form-item
              :label="t('pages.roomQuery.saleDate')"
              name="dateRange"
              class="cms-filter-item cms-filter-item-query cms-filter-item-date-range"
            >
              <t-date-range-picker
                v-model="formData.dateRange"
                class="cms-filter-control"
                mode="date"
                clearable
                :placeholder="[t('pages.roomQuery.startDatePlaceholder'), t('pages.roomQuery.endDatePlaceholder')]"
              />
            </t-form-item>

            <div class="cms-query-operation-container">
              <t-button theme="primary" type="submit">{{ t('operate.query') }}</t-button>
              <!-- 导出当前条件下全部数据：循环分页拉取后生成 CSV 文件下载 20260924 新增 -->
              <t-button theme="default" :loading="exporting" @click="handleExport">{{ t('operate.export') }}</t-button>
            </div>
          </div>

          <!-- 第二行：关键词输入框独占一行（标题继承 t-form 公共 label-width 84px，与区域/园区标题一致）20260924 修改 -->
          <div class="cms-query-filter-row cms-query-filter-row-second">
            <t-form-item
              :label="t('pages.roomQuery.keyword')"
              name="keyword"
              class="cms-filter-item cms-filter-item-query cms-filter-item-keyword"
            >
              <t-input
                v-model="formData.keyword"
                class="cms-filter-control"
                :placeholder="t('pages.roomQuery.keywordPlaceholder')"
                clearable
              />
            </t-form-item>

            <!-- 销售状态/迁出状态四个多选框：已销售默认勾选；一对复选框只勾其一时按该状态过滤，
                 都勾或都不勾时不过滤该状态 20260924 新增 -->
            <div class="cms-query-filter-status-group">
              <t-checkbox v-model="formData.sold">{{ t('statusType.saleStatusEnum.sold') }}</t-checkbox>
              <t-checkbox v-model="formData.unsold">{{ t('statusType.saleStatusEnum.unsold') }}</t-checkbox>
              <t-checkbox v-model="formData.out">{{ t('statusType.transferOutStatusEnum.out') }}</t-checkbox>
              <t-checkbox v-model="formData.notOut">{{ t('statusType.transferOutStatusEnum.notOut') }}</t-checkbox>
            </div>
          </div>
        </t-form>

        <!-- 列表表格加 .cms-query-table 类：供 min-width mixin 精准命中，避免穿透详情表格 20260924 新增 -->
        <!-- 查询区两行（其他查询页为一行）：高度多占约 44px（12px 行距+32px 控件高），表格区最大高度相应扣减 20260924 修改 -->
        <t-table
          ref="tableRef"
          class="cms-query-table"
          :data="data"
          :columns="COLUMNS"
          row-key="idRoom"
          table-layout="fixed"
          max-height="calc(100vh - 422px)"
          :bordered="false"
          lazy-load
          stripe
          @scroll="handleScroll"
        >
          <template #createDate="{ row }">
            {{ formatDate(row.createDate) }}
          </template>
          <template #op="{ row }">
            <t-link theme="primary" @click="handleClickDetail(row)">
              {{ t('operate.detail') }}
            </t-link>
          </template>
        </t-table>
        <!-- 底部信息行：左侧记录总数，右侧滚动加载状态，与销售查询页一致 20260924 新增 -->
        <div v-if="pagination.total > 0" class="cms-query-summary">
          <div class="cms-query-summary-left">
            <span>{{ translate('operate.total') }}{{ pagination.total }}{{ translate('operate.records') }}</span>
          </div>
          <span v-if="loading" class="cms-query-summary-status">{{ t('pages.roomQuery.loading') }}</span>
          <span v-else-if="!hasMore" class="cms-query-summary-status">{{ t('pages.roomQuery.noMore') }}</span>
        </div>
      </t-card>
    </div>
    <!-- 列表页面结束 -->

    <!-- 详情页面开始：与销售查询页共用 room-detail 组件 20260924 新增 -->
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
  name: 'RoomQuery',
};
</script>
<script setup lang="ts">
import type { PrimaryTableCol, TableRowData } from 'tdesign-vue-next';
import { computed, nextTick, onMounted, ref } from 'vue';

import type { ListParkModel, SelectModel } from '@/api/model/parkModel';
import { getParkList, getRegionList } from '@/api/park';
import type { RoomQueryModel } from '@/api/roomQuery';
import { getRoomQueryList } from '@/api/roomQuery';
import RoomDetail from '@/components/room-detail/index.vue';
import { QUERY_FORM_LABEL_WIDTH } from '@/constants';
import { useInfiniteScrollQuery, useLayoutScrollRestore, useRoomDetail, useTabCacheName } from '@/hooks';
import { t, translate } from '@/locales';
import { exportCsv } from '@/utils/csv';
import { formatDate } from '@/utils/date';
import { logError } from '@/utils/logger';

// ============================================================
// 墓位信息查询页：参照销售查询页骨架，筛选查询 + 明细分页 + 公共详情 20260924 新增
// ============================================================

// ==================== 通用：视图切换 ====================
// 向 tab 记录登记组件真实 name：路由 name 为小写 roomQuery，与组件名不一致，
// 不登记则 keep-alive 无法缓存本页，切换路由时 out-in 过渡会卡死导致其它页面打不开 20260924 新增
useTabCacheName('RoomQuery');

// 视图互斥显示：列表 / 详情。仅详情态需响应式：列表始终挂载，
// 详情显示时列表通过 list-view-hidden 高度塌陷隐藏，无需单独的列表态标记 20260924 新增
const isDetailShow = ref(false);

// ==================== 列表：筛选与表格 ====================
// 列宽调整：每列足够展示完整内容，容器不足时横向滚动而非压缩 20260924 新增
const COLUMNS: PrimaryTableCol<TableRowData>[] = [
  // TDesign 内置序号列：当前页内从 1 自动递增，固定在左侧便于横向滚动时可见 20260924 新增
  { title: translate('pages.roomQuery.index'), width: 64, align: 'center', colKey: 'serial-number', fixed: 'left' },
  { title: translate('pages.roomQuery.region'), align: 'left', width: 110, colKey: 'region', ellipsis: true },
  { title: translate('pages.roomQuery.park'), align: 'left', width: 200, colKey: 'park', ellipsis: true },
  { title: translate('pages.roomQuery.xyNumber'), width: 130, colKey: 'xyNumber', ellipsis: true },
  { title: translate('pages.roomQuery.buyer'), width: 110, colKey: 'buyer', ellipsis: true },
  { title: translate('pages.roomQuery.payerPhone'), width: 170, colKey: 'payerPhone', ellipsis: true },
  { title: translate('pages.roomQuery.createDate'), width: 120, colKey: 'createDate' },
  { title: translate('pages.roomQuery.deceased'), width: 110, colKey: 'deceased', ellipsis: true },
  { title: translate('pages.roomQuery.contacts'), width: 110, colKey: 'contacts', ellipsis: true },
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
  keyword: string;
  // 销售状态/迁出状态多选：true 为勾选，已销售默认勾选（只看已销售），其余默认不勾（不过滤）20260924 新增
  sold: boolean;
  unsold: boolean;
  out: boolean;
  notOut: boolean;
}

const searchForm: FormData = {
  region: '',
  park: '',
  // 时间段默认空值：不限销售日期 20260924 修改
  dateRange: [],
  keyword: '',
  sold: true,
  unsold: false,
  out: false,
  notOut: false,
};

const formData = ref<FormData>({ ...searchForm });
const tableRef = ref();
const dataRegionList = ref<Array<SelectModel>>([]);
const dataParkList = ref<Array<ListParkModel>>([]);

// 无限滚动加载状态机（分页/防抖/到底追加/查询重置滚动归零）收敛于公共 useInfiniteScrollQuery 20260924 新增
const { data, pagination, loading, hasMore, fetchData, onSubmit, handleScroll } =
  useInfiniteScrollQuery<RoomQueryModel>(
    (current, pageSize) => getRoomQueryList(getQueryParams(current, pageSize)),
    tableRef,
  );

const regionOptions = computed(() => dataRegionList.value.map((item) => ({ value: item.value, label: item.label })));

// 园区下拉随所选区域联动过滤（区域接口 value 即区域名）20260924 新增
const parkOptions = computed(() => {
  const { region } = formData.value;
  if (!region) {
    return dataParkList.value.map((item) => ({ value: item.value, label: item.label }));
  }
  return dataParkList.value
    .filter((item) => item.region === region)
    .map((item) => ({ value: item.value, label: item.label }));
});

// 当前筛选条件查询参数：列表分页与全量导出共用，避免两处条件拼装不一致 20260924 新增
const getQueryParams = (current: number, pageSize: number) => {
  const [startDate, endDate] = formData.value.dateRange || [];
  return {
    region: formData.value.region,
    park: formData.value.park,
    startDate,
    endDate,
    // 关键词：按墓区编号/购买人/联系人/电话/安葬者拼串包含查找，为空时后端不拼接该条件 20260924 新增
    keyword: formData.value.keyword,
    // 销售状态/迁出状态多选：一对复选框只勾其一时后端按该状态过滤，都勾或都不勾时不过滤 20260924 新增
    sold: formData.value.sold,
    unsold: formData.value.unsold,
    out: formData.value.out,
    notOut: formData.value.notOut,
    current,
    pageSize,
  };
};

// ==================== 列表：导出 ====================
// 导出进行中标记：防止重复点击并发拉取 20260924 新增
const exporting = ref(false);

// 导出当前筛选条件下的全部数据：分页拉取与 CSV 生成收敛于公共 exportCsv 20260924 新增
const handleExport = async () => {
  if (exporting.value) {
    return;
  }
  exporting.value = true;
  try {
    // 表头与表格列一致：序号/区域/园区/墓位编号/购买人/购买人电话/销售日期/安葬者/联系人 20260924 修改
    await exportCsv<RoomQueryModel>({
      fileName: '墓位信息查询',
      headers: [
        translate('pages.roomQuery.index'),
        translate('pages.roomQuery.region'),
        translate('pages.roomQuery.park'),
        translate('pages.roomQuery.xyNumber'),
        translate('pages.roomQuery.buyer'),
        translate('pages.roomQuery.payerPhone'),
        translate('pages.roomQuery.createDate'),
        translate('pages.roomQuery.deceased'),
        translate('pages.roomQuery.contacts'),
      ],
      fetchPage: (current, pageSize) => getRoomQueryList(getQueryParams(current, pageSize)),
      // 序号从 1 连续编号；日期与列表一致格式化 20260924 修改
      rowToLine: (row, index) => [
        index + 1,
        row.region,
        row.park,
        row.xyNumber,
        row.buyer,
        row.payerPhone,
        formatDate(row.createDate ?? undefined),
        row.deceased,
        row.contacts,
      ],
    });
  } catch (e) {
    logError(e);
  } finally {
    exporting.value = false;
  }
};

// 切换区域时清空园区选择，避免园区与区域不匹配 20260924 新增
const onRegionChange = () => {
  formData.value.park = '';
};

// ==================== 详情：与销售查询页共用 room-detail 组件 ====================
// 详情统一由 room-detail 组件展示，数据加载收敛于 useRoomDetail；滚动位置恢复收敛于 useLayoutScrollRestore 20260924 新增
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

// 点击行详情：拉取单条墓位数据与活动预定/销售/下葬记录后进入详情视图 20260924 新增
const handleClickDetail = async (row: RoomQueryModel) => {
  try {
    await loadDetail(row.idRoom);
    // 切换详情前记录外层滚动容器位置，返回列表时恢复：详情视图高度远大于列表，
    // 若返回时滚动位置被浏览器钳制到新最大值，列表会瞬间跳变 20260924 新增
    saveScrollTop();
    isDetailShow.value = true;
  } catch (e) {
    logError(e);
  }
};

// 详情关闭：清空详情数据并回到列表 20260924 新增
const ClickDetailClose = () => {
  clearDetail();
  isDetailShow.value = false;
  // 返回列表：恢复外层滚动位置，并立即重算表格固定列偏移/表头状态。
  // 不等 TDesign ResizeObserver 的 200ms 延迟修正，避免固定列错位回正造成的晃动 20260924 新增
  nextTick(() => {
    restoreScrollTop();
    tableRef.value?.refreshTable?.();
  });
};

// 区域下拉数据加载 20260924 新增
const loadRegionOptions = async () => {
  try {
    const { list } = await getRegionList();
    dataRegionList.value = list;
  } catch (e) {
    logError(e);
  }
};

// 园区下拉数据加载 20260924 新增
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

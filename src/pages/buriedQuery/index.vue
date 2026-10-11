<template>
  <!-- 参照墓区销售查询页骨架：单根 div + 列表(常驻挂载)/详情(v-if) 视图切换 20260912 新增 -->
  <div>
    <!-- 列表页面开始：列表始终挂载，详情显示时用 list-view-hidden 高度塌陷+不可见。
      不用 v-show(display:none)：display:none 会使表格尺寸归零，TDesign 表格内部 ResizeObserver
      在隐藏期间以 0 尺寸刷新固定列偏移与表头 sticky 状态，返回列表后 200ms 延迟修正期间列表错位晃动 -->
    <div :class="{ 'list-view-hidden': isDetailShow }">
      <t-card class="cms-query-list-card-container" :bordered="false">
        <!-- 筛选条件：区域/园区/下葬时间段与查询按钮尽量同行 -->
        <t-form
          class="cms-query-filter-form"
          :data="formData"
          :label-width="QUERY_FORM_LABEL_WIDTH"
          colon
          @submit="onSubmit"
        >
          <div class="cms-query-filter-row cms-query-filter-row-fixed-three">
            <t-form-item
              :label="t('pages.buriedQuery.region')"
              name="region"
              class="cms-filter-item cms-filter-item-query cms-filter-item-basic"
            >
              <!-- 区域为必选项：有初值且不提供清除按钮，避免无区域的全量查询 20261010 修改 -->
              <t-select
                v-model="formData.region"
                class="cms-filter-control"
                :options="regionOptions"
                :placeholder="t('pages.buriedQuery.regionPlaceholder')"
                @change="onRegionChange"
              />
            </t-form-item>

            <t-form-item
              :label="t('pages.buriedQuery.park')"
              name="park"
              class="cms-filter-item cms-filter-item-query cms-filter-item-basic"
            >
              <t-select
                v-model="formData.park"
                class="cms-filter-control"
                :options="parkOptions"
                :placeholder="t('pages.buriedQuery.parkPlaceholder')"
                clearable
              />
            </t-form-item>

            <t-form-item
              :label="t('pages.buriedQuery.dateRange')"
              name="dateRange"
              class="cms-filter-item cms-filter-item-query cms-filter-item-date-range"
            >
              <t-date-range-picker
                v-model="formData.dateRange"
                class="cms-filter-control"
                mode="date"
                clearable
                :placeholder="[t('pages.buriedQuery.startDatePlaceholder'), t('pages.buriedQuery.endDatePlaceholder')]"
              />
            </t-form-item>

            <div class="cms-query-operation-container">
              <t-button theme="primary" type="submit">{{ t('operate.query') }}</t-button>
              <!-- 导出当前条件下全部数据：循环分页拉取后生成 CSV 文件下载 -->
              <t-button theme="default" :loading="exporting" @click="handleExport">{{ t('operate.export') }}</t-button>
            </div>
          </div>

          <!-- 第二行：记录排序方式单选（服务端排序，切换即重查首页）20261011 新增 -->
          <div class="cms-query-filter-row cms-query-filter-row-second">
            <t-form-item
              :label="t('pages.buriedQuery.sortLabel')"
              name="sortMode"
              class="cms-filter-item buried-sort-item"
            >
              <t-radio-group v-model="formData.sortMode" @change="onSortModeChange">
                <t-radio value="park">{{ t('pages.buriedQuery.sortParkFirst') }}</t-radio>
                <t-radio value="date">{{ t('pages.buriedQuery.sortDateFirst') }}</t-radio>
              </t-radio-group>
            </t-form-item>
          </div>
        </t-form>

        <!-- 表格高度随屏幕自适应：每页 40 条(约1920px)远超表格高度，滚动条必然出现，无需再封顶 20260913 修改 -->
        <!-- 筛选区拆为两行（新增排序单选行）：高度多占约 44px（12px 行距+32px 控件高），表格区最大高度相应扣减，同墓位信息查询页 20261011 修改 -->
        <t-table
          ref="tableRef"
          class="cms-query-table"
          :data="data"
          :columns="COLUMNS"
          row-key="idBuried"
          table-layout="fixed"
          max-height="calc(100vh - 422px)"
          :bordered="false"
          lazy-load
          stripe
          @scroll="handleScroll"
        >
          <template #burialDate="{ row }">
            {{ formatDate(row.burialDate) }}
          </template>
          <!-- 墓位类型库中存的是 i18n key(statusType.roomTypeEnum.*)，需翻译后展示，同墓位详情/卡片页写法 20261011 新增 -->
          <template #roomType="{ row }">
            {{ row.roomType ? t(row.roomType) : '' }}
          </template>
          <!-- 新增三列的展示格式：两个日期列与既有日期列同样走 formatDate，金额千分位写法同墓位信息查询页 20261011 新增 -->
          <template #deathDate="{ row }">
            {{ formatDate(row.deathDate) }}
          </template>
          <template #saleDate="{ row }">
            {{ formatDate(row.saleDate) }}
          </template>
          <template #realPrice="{ row }">
            {{ formatPrice(row.realPrice) }}
          </template>
          <template #createDate="{ row }">
            {{ formatDate(row.createDate) }}
          </template>
          <template #remark="{ row }">
            <span :title="row.remark">{{ row.remark }}</span>
          </template>
          <template #op="{ row }">
            <t-link theme="primary" @click="handleClickDetail(row)">
              {{ t('operate.detail') }}
            </t-link>
          </template>
        </t-table>
        <!-- 底部信息行：左侧记录总数，右侧滚动加载状态，固定一行保持卡片高度与销售查询页一致(672px) -->
        <div v-if="pagination.total > 0" class="cms-query-summary">
          <span>{{ translate('operate.total') }}{{ pagination.total }}{{ translate('operate.records') }}</span>
          <span v-if="loading" class="cms-query-summary-status">{{ t('pages.buriedQuery.loading') }}</span>
          <span v-else-if="!hasMore" class="cms-query-summary-status">{{ t('pages.buriedQuery.noMore') }}</span>
        </div>
      </t-card>
    </div>
    <!-- 列表页面结束 -->

    <!-- 详情页面开始：与其它业务页共用 room-detail 组件 20260912 新增 -->
    <room-detail
      v-if="isDetailShow"
      :room="detailRoom"
      :reserve="detailReserve"
      :sale="detailSale"
      :buried="detailBuried"
      :adminfees="detailAdminfees"
      :contacts="detailContacts"
      :transfer-out="detailTransferOut"
      @close="ClickDetailClose"
    />
    <!-- 详情页面结束 -->
  </div>
</template>
<script lang="ts">
export default {
  name: 'BuriedQuery',
};
</script>
<script setup lang="ts">
import type { PrimaryTableCol, TableRowData } from 'tdesign-vue-next';
import { computed, nextTick, onMounted, ref } from 'vue';

import type { BuriedQueryModel } from '@/api/buriedQuery';
import { getBuriedQueryList } from '@/api/buriedQuery';
import type { ListParkModel, SelectModel } from '@/api/model/parkModel';
import { getParkList, getRegionList } from '@/api/park';
import RoomDetail from '@/components/room-detail/index.vue';
import { QUERY_FORM_LABEL_WIDTH } from '@/constants';
import { useInfiniteScrollQuery, useLayoutScrollRestore, useRoomDetail, useTabCacheName } from '@/hooks';
import { t, translate } from '@/locales';
import { exportCsv } from '@/utils/csv';
import { formatDate } from '@/utils/date';
import { formatPrice } from '@/utils/format';
import { logError } from '@/utils/logger';

// ============================================================
// 墓区下葬查询页：参照销售查询页骨架，筛选查询 + 明细分页 + 公共详情 20260912 新增
// ============================================================

// ==================== 通用：视图切换 ====================
// 向 tab 记录登记组件真实 name：路由 name 为小写 buriedQuery，与组件名不一致，
// 不登记则 keep-alive 无法缓存本页，切换路由时 out-in 过渡会卡死导致其它页面打不开
useTabCacheName('BuriedQuery');

// 视图互斥显示：列表 / 详情。仅详情态需响应式：列表始终挂载，
// 详情显示时列表通过 list-view-hidden 高度塌陷隐藏，无需单独的列表态标记
const isDetailShow = ref(false);

// ==================== 列表：筛选与表格 ====================
// 列宽调整：每列足够展示完整内容(表头不截断)，总宽与模板列表页一致；容器不足时横向滚动而非压缩 20260913 修改
const COLUMNS: PrimaryTableCol<TableRowData>[] = [
  // TDesign 内置序号列：当前页内从 1 自动递增，固定在左侧便于横向滚动时可见
  { title: translate('pages.buriedQuery.index'), width: 64, align: 'center', colKey: 'serial-number', fixed: 'left' },
  { title: translate('pages.buriedQuery.region'), align: 'left', width: 110, colKey: 'region', ellipsis: true },
  { title: translate('pages.buriedQuery.park'), align: 'left', width: 200, colKey: 'park', ellipsis: true },
  { title: translate('pages.buriedQuery.xyNumber'), width: 130, colKey: 'xyNumber', ellipsis: true },
  // 墓位类型（room.roomType）：与详情页字段序一致，紧跟位置之后 20261011 新增
  { title: translate('pages.buriedQuery.roomType'), width: 100, colKey: 'roomType' },
  { title: translate('pages.buriedQuery.deceased'), width: 140, colKey: 'deceased', ellipsis: true },
  // 身份证号列宽 200px 确保 18 位号码完整显示（同下葬登记页）20261011 新增
  { title: translate('pages.buriedQuery.deceasedIDCard'), width: 200, colKey: 'deceasedIDCard' },
  // 死亡日期排在下葬日期前：先亡后葬符合读序 20261011 新增
  { title: translate('pages.buriedQuery.deathDate'), width: 120, colKey: 'deathDate' },
  { title: translate('pages.buriedQuery.burialDate'), width: 120, colKey: 'burialDate' },
  // 销售价格/销售日期（sale.realPrice / sale.createDate）：右对齐同销售查询页，
  // 未销售墓位无活动销售记录，这两列为空 20261011 新增
  { title: translate('pages.buriedQuery.realPrice'), width: 120, align: 'right', colKey: 'realPrice' },
  { title: translate('pages.buriedQuery.saleDate'), width: 120, colKey: 'saleDate' },
  { title: translate('pages.buriedQuery.contacts'), width: 110, colKey: 'contacts', ellipsis: true },
  { title: translate('pages.buriedQuery.contactsphone'), width: 170, colKey: 'contactsphone' },
  { title: translate('pages.buriedQuery.operator'), width: 100, colKey: 'operator', ellipsis: true },
  { title: translate('pages.buriedQuery.createDate'), width: 120, colKey: 'createDate' },
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
  // 记录排序方式：park=园区/排号/序号/下葬日期，date=下葬日期/园区/排号/序号（均升序，后端排序；
  // 园区层级按园区设置页的拖拽顺序，不是中文编码序）20261011 新增
  sortMode: string;
}

const searchForm: FormData = {
  region: '',
  park: '',
  // 下葬时间段默认为空：不设初值即不按时间过滤，由使用者按需选定 20261010 修改,
  dateRange: [],
  // 默认按墓位位置排序（园区→排→号→下葬日期）：单选框必须有且仅有一项选中，取需求列出的第一项 20261011 新增,
  sortMode: 'park',
};

const formData = ref<FormData>({ ...searchForm });
const tableRef = ref();
const dataRegionList = ref<Array<SelectModel>>([]);
const dataParkList = ref<Array<ListParkModel>>([]);

// 无限滚动加载状态机（分页/防抖/到底追加/查询重置滚动归零）收敛于公共 useInfiniteScrollQuery 20260914 抽取
const { data, pagination, loading, hasMore, fetchData, onSubmit, handleScroll } =
  useInfiniteScrollQuery<BuriedQueryModel>(
    (current, pageSize) => getBuriedQueryList(getQueryParams(current, pageSize)),
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

// 日期在库中为 datetime，列表统一格式化为 yyyy-mm-dd 显示，收敛于公共 formatDate 20260914 抽取

// 当前筛选条件查询参数：列表滚动分页与全量导出共用，避免两处条件拼装不一致
const getQueryParams = (current: number, pageSize: number) => {
  const [startDate, endDate] = formData.value.dateRange || [];
  return {
    region: formData.value.region,
    park: formData.value.park,
    startDate,
    endDate,
    // 排序方式一并下发后端：列表滚动分页与全量导出共用同一参数，保证导出行序与屏显一致 20261011 新增
    sortMode: formData.value.sortMode,
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
    // 表头与表格列一致：序号/区域/园区/位置/墓位类型/安葬者/身份证号/死亡日期/下葬日期/销售价格/销售日期/联系人/联系人电话/备注/经办人/创建日期 20261011 扩充
    await exportCsv<BuriedQueryModel>({
      fileName: '墓区下葬查询',
      headers: [
        translate('pages.buriedQuery.index'),
        translate('pages.buriedQuery.region'),
        translate('pages.buriedQuery.park'),
        translate('pages.buriedQuery.xyNumber'),
        translate('pages.buriedQuery.roomType'),
        translate('pages.buriedQuery.deceased'),
        translate('pages.buriedQuery.deceasedIDCard'),
        translate('pages.buriedQuery.deathDate'),
        translate('pages.buriedQuery.burialDate'),
        translate('pages.buriedQuery.realPrice'),
        translate('pages.buriedQuery.saleDate'),
        translate('pages.buriedQuery.contacts'),
        translate('pages.buriedQuery.contactsphone'),
        translate('pages.buriedQuery.remark'),
        translate('pages.buriedQuery.operator'),
        translate('pages.buriedQuery.createDate'),
      ],
      fetchPage: (current, pageSize) => getBuriedQueryList(getQueryParams(current, pageSize)),
      // 序号从 1 连续编号；日期与列表一致格式化；销售金额写原值（不千分位，便于表格求和）；墓位类型写翻译后的标签而不是 i18n key 20261011 修改
      rowToLine: (row, index) => [
        index + 1,
        row.region,
        row.park,
        row.xyNumber,
        row.roomType ? translate(row.roomType) : '',
        row.deceased,
        row.deceasedIDCard,
        formatDate(row.deathDate),
        formatDate(row.burialDate),
        row.realPrice,
        formatDate(row.saleDate),
        row.contacts,
        row.contactsphone,
        row.remark,
        row.operator,
        formatDate(row.createDate),
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

// 切换排序方式：排序纯服务端，无需改筛选条件，直接重查首页并回到顶部（与点“查询”同一动作）20261011 新增
const onSortModeChange = () => {
  onSubmit();
};

// 滚动到底部自动加载下一页逻辑收敛于公共 useInfiniteScrollQuery 20260914 抽取

// ==================== 详情：与其它业务页共用 room-detail 组件 ====================
// 详情统一由 room-detail 组件展示，数据加载收敛于 useRoomDetail；滚动位置恢复收敛于 useLayoutScrollRestore 20260914 抽取
const {
  detailRoom,
  detailReserve,
  detailSale,
  detailBuried,
  detailAdminfees,
  detailContacts,
  detailTransferOut,
  loadDetail,
  clearDetail,
} = useRoomDetail();
const { saveScrollTop, restoreScrollTop } = useLayoutScrollRestore();

// 点击行详情：拉取单条墓位数据与活动预定/销售/下葬记录后进入详情视图
const handleClickDetail = async (row: BuriedQueryModel) => {
  try {
    await loadDetail(row.idRoom);
    // 切换详情前记录外层滚动容器位置，返回列表时恢复：详情视图高度远大于列表，
    // 若返回时滚动位置被浏览器钳制到新最大值，列表会瞬间跳变
    saveScrollTop();
    isDetailShow.value = true;
  } catch (e) {
    logError(e);
  }
};

// 详情关闭：清空详情数据并回到列表
const ClickDetailClose = () => {
  clearDetail();
  isDetailShow.value = false;
  // 返回列表：恢复外层滚动位置，并立即重算表格固定列偏移/表头状态。
  // 不等 TDesign ResizeObserver 的 200ms 延迟修正，避免固定列错位回正造成的晃动
  nextTick(() => {
    restoreScrollTop();
    tableRef.value?.refreshTable?.();
  });
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

onMounted(async () => {
  // 区域初值取下拉首项：本页挂在"查询统计"下，不属于墓区业务的区域三级菜单组，拿不到路由 meta.region；
  // 又因区域不可清除，必须等下拉加载完再取首项作为初值，然后才发首个查询，
  // 否则首屏会先以空区域拉一次全量数据 20261010 新增,
  await loadRegionOptions();
  if (!formData.value.region && dataRegionList.value.length > 0) {
    // SelectModel.value 声明为 number,但区域接口实际返回 tagName(字符串),故显式转 string 对齐 formData.region 20261010 新增,
    formData.value.region = String(dataRegionList.value[0].value);
  }
  loadParkOptions();
  fetchData(true);
});
</script>
<style lang="less" scoped>
@import './index.less';
</style>
<style lang="less" scoped></style>

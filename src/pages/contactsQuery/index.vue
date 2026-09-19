<template>
  <!-- 参照墓区销售查询页骨架：单根 div + 列表(常驻挂载)/详情(v-if) 视图切换 20260913 新增 -->
  <div>
    <!-- 列表页面开始：列表始终挂载，详情显示时用 list-view-hidden 高度塌陷+不可见。
      不用 v-show(display:none)：display:none 会使表格尺寸归零，TDesign 表格内部 ResizeObserver
      在隐藏期间以 0 尺寸刷新固定列偏移与表头 sticky 状态，返回列表后 200ms 延迟修正期间列表错位晃动 -->
    <div :class="{ 'list-view-hidden': isDetailShow }">
      <t-card class="cms-query-list-card-container" :bordered="false">
        <!-- 筛选条件：单个关键词输入框模糊匹配区域/园区/墓区编号/联系人/电话/身份证号 -->
        <t-form
          class="cms-query-filter-form"
          :data="formData"
          :label-width="QUERY_FORM_LABEL_WIDTH"
          colon
          @submit="onSubmit"
        >
          <div class="cms-query-filter-row">
            <t-form-item
              :label="t('pages.contactsQuery.keyword')"
              name="keyword"
              class="cms-filter-item cms-filter-item-query cms-filter-item-keyword"
            >
              <t-input
                v-model="formData.keyword"
                class="cms-filter-control"
                clearable
                :placeholder="t('pages.contactsQuery.keywordPlaceholder')"
                @enter="onSubmit"
              />
            </t-form-item>

            <div class="cms-query-operation-container">
              <t-button theme="primary" type="submit">{{ t('operate.query') }}</t-button>
              <!-- 导出当前条件下全部数据：循环分页拉取后生成 CSV 文件下载 -->
              <t-button theme="default" :loading="exporting" @click="handleExport">{{ t('operate.export') }}</t-button>
            </div>
          </div>
        </t-form>

        <!-- 表格高度随屏幕自适应：每页 40 条远超表格高度，滚动条必然出现 20260913 修改 -->
        <t-table
          ref="tableRef"
          class="cms-query-table"
          :data="data"
          :columns="COLUMNS"
          row-key="idContacts"
          table-layout="fixed"
          max-height="calc(100vh - 378px)"
          :bordered="false"
          lazy-load
          stripe
          @scroll="handleScroll"
        >
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
          <span v-if="loading" class="cms-query-summary-status">{{ t('pages.contactsQuery.loading') }}</span>
          <span v-else-if="!hasMore" class="cms-query-summary-status">{{ t('pages.contactsQuery.noMore') }}</span>
        </div>
      </t-card>
    </div>
    <!-- 列表页面结束 -->

    <!-- 详情页面开始：与其它业务页共用 room-detail 组件 20260913 新增 -->
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
  name: 'ContactsQuery',
};
</script>
<script setup lang="ts">
import type { PrimaryTableCol, TableRowData } from 'tdesign-vue-next';
import { nextTick, onMounted, ref } from 'vue';

import type { ContactsQueryModel } from '@/api/contactsQuery';
import { getContactsQueryList } from '@/api/contactsQuery';
import RoomDetail from '@/components/room-detail/index.vue';
import { QUERY_FORM_LABEL_WIDTH } from '@/constants';
import { useInfiniteScrollQuery, useLayoutScrollRestore, useRoomDetail, useTabCacheName } from '@/hooks';
import { t, translate } from '@/locales';
import { exportCsv } from '@/utils/csv';
import { logError } from '@/utils/logger';

// ============================================================
// 墓位联系查询页：参照销售查询页骨架，关键词模糊查询 + 明细分页 + 公共详情 20260913 新增
// ============================================================

// ==================== 通用：视图切换 ====================
// 向 tab 记录登记组件真实 name：路由 name 为小写 contactsQuery，与组件名不一致，
// 不登记则 keep-alive 无法缓存本页，切换路由时 out-in 过渡会卡死导致其它页面打不开
useTabCacheName('ContactsQuery');

// 视图互斥显示：列表 / 详情。仅详情态需响应式：列表始终挂载，
// 详情显示时列表通过 list-view-hidden 高度塌陷隐藏，无需单独的列表态标记
const isDetailShow = ref(false);

// ==================== 列表：筛选与表格 ====================
// 列宽调整：每列足够展示完整内容，容器不足时横向滚动而非压缩 20260913 修改
const COLUMNS: PrimaryTableCol<TableRowData>[] = [
  // TDesign 内置序号列：当前页内从 1 自动递增，固定在左侧便于横向滚动时可见
  { title: translate('pages.contactsQuery.index'), width: 64, align: 'center', colKey: 'serial-number', fixed: 'left' },
  { title: translate('pages.contactsQuery.region'), align: 'left', width: 110, colKey: 'region', ellipsis: true },
  { title: translate('pages.contactsQuery.park'), align: 'left', width: 200, colKey: 'park', ellipsis: true },
  { title: translate('pages.contactsQuery.xyNumber'), width: 130, colKey: 'xyNumber', ellipsis: true },
  { title: translate('pages.contactsQuery.contacts'), width: 110, colKey: 'contacts', ellipsis: true },
  { title: translate('pages.contactsQuery.contactsPhone'), width: 170, colKey: 'contactsPhone' },
  { title: translate('pages.contactsQuery.contactsIDCard'), width: 220, colKey: 'contactsIDCard' },
  { title: translate('pages.contactsQuery.remark'), width: 110, colKey: 'remark', ellipsis: true },
  {
    title: translate('operate.operation'),
    align: 'left',
    fixed: 'right',
    width: 80,
    colKey: 'op',
  },
];

interface FormData {
  keyword: string;
}

const searchForm: FormData = {
  keyword: '',
};

const formData = ref<FormData>({ ...searchForm });
const tableRef = ref();

// 无限滚动加载状态机（分页/防抖/到底追加/查询重置滚动归零）收敛于公共 useInfiniteScrollQuery 20260914 抽取
const { data, pagination, loading, hasMore, fetchData, onSubmit, handleScroll } =
  useInfiniteScrollQuery<ContactsQueryModel>(
    (current, pageSize) => getContactsQueryList(getQueryParams(current, pageSize)),
    tableRef,
  );

// 当前筛选条件查询参数：列表滚动分页与全量导出共用，避免两处条件拼装不一致
const getQueryParams = (current: number, pageSize: number) => {
  return {
    keyword: formData.value.keyword,
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
    // 表头与表格列一致：序号/区域/园区/墓区编号/联系人/联系人电话/身份证号/备注
    await exportCsv<ContactsQueryModel>({
      fileName: '墓位联系查询',
      headers: [
        translate('pages.contactsQuery.index'),
        translate('pages.contactsQuery.region'),
        translate('pages.contactsQuery.park'),
        translate('pages.contactsQuery.xyNumber'),
        translate('pages.contactsQuery.contacts'),
        translate('pages.contactsQuery.contactsPhone'),
        translate('pages.contactsQuery.contactsIDCard'),
        translate('pages.contactsQuery.remark'),
      ],
      fetchPage: (current, pageSize) => getContactsQueryList(getQueryParams(current, pageSize)),
      // 序号从 1 连续编号
      rowToLine: (row, index) => [
        index + 1,
        row.region,
        row.park,
        row.xyNumber,
        row.contacts,
        row.contactsPhone,
        row.contactsIDCard,
        row.remark,
      ],
    });
  } catch (e) {
    logError(e);
  } finally {
    exporting.value = false;
  }
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
  loadDetail,
  clearDetail,
} = useRoomDetail();
const { saveScrollTop, restoreScrollTop } = useLayoutScrollRestore();

// 点击行详情：拉取单条墓位数据与活动预定/销售/下葬记录后进入详情视图
const handleClickDetail = async (row: ContactsQueryModel) => {
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

onMounted(() => {
  fetchData(true);
});
</script>
<style lang="less" scoped>
@import './index.less';
</style>
<style lang="less" scoped></style>

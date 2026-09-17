<template>
  <div>
    <!-- 列表开始 -->
    <div v-show="isListShow" class="table-tree-container">
      <div class="list-tree-content adminfee-page-content">
        <div
          class="list-common-table adminfee-list-panel"
          :class="{ 'adminfee-list-panel--full': hasQueried && adminfeeCardRows.length }"
        >
          <t-form
            class="cms-card-filter-bar"
            :data="formfindData"
            :label-width="BUSINESS_BASIC_FORM_LABEL_WIDTH"
            colon
            @submit="onSubmit"
          >
            <t-row>
              <t-col :span="10">
                <!-- 筛选条件横向排列，条件之间空隙固定 24px，不随屏幕宽度变化 20260914 修改 -->
                <div class="cms-card-filter-inline">
                  <!-- 区域由收费管理下区域三级菜单经路由下发，此处仅保留园区/排号筛选 20260909 新增 -->
                  <t-form-item :label="$t('pages.room.park')" name="park" class="cms-filter-item cms-filter-item-basic">
                    <t-select
                      v-model="formfindData.park"
                      class="demo-select-base cms-filter-control"
                      :placeholder="$t('pages.room.parkPlaceholder')"
                      @change="onSelectChange"
                    >
                      <t-option
                        v-for="(item, index) in availableParkList"
                        :key="index"
                        :value="item.value"
                        :label="item.label"
                      >
                        {{ item.label }}
                      </t-option>
                    </t-select>
                  </t-form-item>
                  <t-form-item :label="$t('pages.room.yNum')" name="yNum" class="cms-filter-item cms-filter-item-basic">
                    <t-select
                      v-model="formfindData.yNum"
                      class="demo-select-base cms-filter-control"
                      :placeholder="$t('pages.room.yNumSelectPlaceholder')"
                      clearable
                      @change="onSelectChange"
                    >
                      <t-option v-for="(item, index) in yNumList" :key="index" :value="item.value" :label="item.label">
                        {{ item.label }}
                      </t-option>
                    </t-select>
                  </t-form-item>
                </div>
              </t-col>

              <t-col :span="2" class="operation-container">
                <t-button theme="primary" type="submit">
                  {{ $t('operate.query') }}
                </t-button>
              </t-col>
            </t-row>
          </t-form>

          <!-- 查询后无数据时不展示卡片区，仅在筛选表单下方居中提示 20260909 新增 -->
          <div v-if="hasQueried && !adminfeeCardRows.length" class="adminfee-no-data">暂无数据</div>

          <div v-if="hasQueried && adminfeeCardRows.length" class="adminfee-list-body">
            <div ref="adminfeeCardViewport" class="table-container adminfee-card-layout">
              <div v-if="adminfeeCardRows.length" class="adminfee-card-rows" :style="{ zoom: adminfeeZoom }">
                <div v-for="rowGroup in adminfeeCardRows" :key="rowGroup.yNum" class="adminfee-card-row">
                  <div class="adminfee-card-grid">
                    <div
                      v-for="card in rowGroup.cards"
                      :key="`${rowGroup.yNum}-${card.xNum}`"
                      class="adminfee-card"
                      :class="{ 'adminfee-card--empty': card.placeholder }"
                    >
                      <template v-if="card.placeholder">
                        <!-- 空位卡序号与正常卡同样顶部对齐 20260909 新增 -->
                        <div class="adminfee-card__header">
                          <div class="adminfee-card__serial">{{ rowGroup.yNum }} 排 {{ card.xNum }} 号</div>
                        </div>
                        <div class="adminfee-card__body">
                          <div class="adminfee-card__empty-text">空位</div>
                        </div>
                      </template>
                      <template v-else>
                        <div class="adminfee-card__header">
                          <!-- 排号改取 xyNumber 字段，与墓区设置/销售/下葬/预定页一致 20260917 修改 -->
                          <div class="adminfee-card__serial">
                            {{ card.row.xyNumber || `${rowGroup.yNum} 排 ${card.row.xNum} 号` }}
                          </div>
                          <!-- 墓穴类型值上移至首行右侧胶囊，与其余卡片页一致 20260917 修改 -->
                          <span class="adminfee-card__type">{{ $t(card.row.roomType).trim() }}</span>
                        </div>
                        <div class="adminfee-card__body">
                          <!-- 购买人/下葬者/联系人/价格：卡片内容与下葬页完全一致 20260917 修改 -->
                          <div class="adminfee-card__meta">
                            <span class="adminfee-card__meta-label">{{ $t('pages.room.buyer') }}</span>
                            <!-- 购买人无值时默认显示“无” 20260917 新增 -->
                            <span class="adminfee-card__meta-value">{{ card.row.buyer || $t('common.none') }}</span>
                          </div>
                          <div class="adminfee-card__meta">
                            <span class="adminfee-card__meta-label">{{ $t('pages.room.buriedPerson') }}</span>
                            <!-- 下葬者超过7字截断为前7字+省略号，悬停提示完整内容 20260917 新增 -->
                            <t-tooltip v-if="isOverflow(card.row.deceased)" :content="String(card.row.deceased)">
                              <span class="adminfee-card__meta-value">{{ truncateText(card.row.deceased) }}</span>
                            </t-tooltip>
                            <!-- 下葬者无值时默认显示“无” 20260917 新增 -->
                            <span v-else class="adminfee-card__meta-value">
                              {{ card.row.deceased || $t('common.none') }}
                            </span>
                          </div>
                          <div class="adminfee-card__meta">
                            <span class="adminfee-card__meta-label">{{ $t('pages.room.contacts') }}</span>
                            <!-- 联系人超过7字截断为前7字+省略号，悬停提示完整内容 20260917 新增 -->
                            <t-tooltip v-if="isOverflow(card.row.contacts)" :content="String(card.row.contacts)">
                              <span class="adminfee-card__meta-value">{{ truncateText(card.row.contacts) }}</span>
                            </t-tooltip>
                            <!-- 联系人无值时默认显示“无” 20260917 新增 -->
                            <span v-else class="adminfee-card__meta-value">
                              {{ card.row.contacts || $t('common.none') }}
                            </span>
                          </div>
                          <!-- priceString 列已删，卡片价格改由数值 price 千分位格式化 20260910 修改 -->
                          <div class="adminfee-card__meta">
                            <span class="adminfee-card__meta-label">{{ $t('pages.room.price') }}</span>
                            <span class="adminfee-card__meta-value">{{ formatPrice(card.row.price) }}</span>
                          </div>
                          <!-- 销售/下葬状态两枚胶囊两端分布，与其余卡片页一致 20260917 修改 -->
                          <div class="adminfee-card__status">
                            <span
                              class="adminfee-card__tag"
                              :class="`adminfee-card__tag--${statusKey(card.row.saleStatus)}`"
                            >
                              {{ $t(card.row.saleStatus) }}
                            </span>
                            <span
                              class="adminfee-card__tag"
                              :class="`adminfee-card__tag--${statusKey(card.row.intoStatus)}`"
                            >
                              {{ $t(card.row.intoStatus) }}
                            </span>
                          </div>
                        </div>
                        <div class="adminfee-card__actions">
                          <t-link theme="primary" @click="handleClickDetail(card.row)">{{
                            $t('operate.detail')
                          }}</t-link>
                          <!-- 管理费开始日期锚定首次下葬，故仅“已下葬”墓位显示新建，并按新建权限门控；支持一穴多次收款 20260909 新增 -->
                          <t-link
                            v-if="card.row.intoStatus !== INTO_INCOMPLET && userInfo.useCreate === 1"
                            theme="danger"
                            @click="handleClickCreate(card.row)"
                          >
                            {{ $t('operate.create') }}
                          </t-link>
                          <!-- 已下葬（存在收款锚点）按修改权限显示“修改”，点击进入修改页选择要修改的记录 20260909 新增 -->
                          <t-link
                            v-if="card.row.intoStatus !== INTO_INCOMPLET && userInfo.useModify === 1"
                            theme="primary"
                            @click="handleClickModify(card.row)"
                          >
                            {{ $t('operate.modify') }}
                          </t-link>
                          <!-- 已下葬按删除权限显示“删除”，点击进入删除页逐行删除收款记录 20260909 新增 -->
                          <t-link
                            v-if="card.row.intoStatus !== INTO_INCOMPLET && userInfo.useDelete === 1"
                            theme="danger"
                            @click="handleClickDelete(card.row)"
                          >
                            {{ $t('operate.delete') }}
                          </t-link>
                        </div>
                      </template>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 列表底部工具行：左侧记录数，右侧放大/缩小卡片列表 20260909 新增 -->
          <div v-if="hasQueried && adminfeeCardRows.length" class="adminfee-list-toolbar">
            <span>{{ listTotalText }}</span>
            <span class="adminfee-list-toolbar__zoom">
              <zoom-in-icon class="adminfee-list-toolbar__zoom-icon" @click="handleZoomIn" />
              <zoom-out-icon class="adminfee-list-toolbar__zoom-icon" @click="handleZoomOut" />
            </span>
          </div>
        </div>
      </div>
    </div>
    <!-- 列表结束 -->
    <!-- 详情开始 -->
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
    <!-- 详情结束 -->
    <!-- 管理费收款登记（新建/修改/删除）开始 -->
    <div v-if="isCreateShow">
      <t-form class="base-form" :data="formFeeData" label-align="top" :label-width="100">
        <div class="form-basic-container">
          <div class="form-basic-item">
            <div class="form-basic-container-title">
              {{ formTitle }}
              <t-button style="float: right" theme="default" shape="square" variant="text" @click="ClickCreateClose()">
                <rollback-icon size="16px" />
              </t-button>
            </div>

            <!-- 表单内容 -->

            <t-row class="info-block des" :gutter="[62, 5]">
              <t-col :span="6">
                <span>{{ $t('pages.room.park') }} : {{ formRoomData.park }}</span>
              </t-col>
              <t-col :span="6">
                <span>{{ $t('pages.room.xyNumber') }} : {{ formRoomData.xyNumber }}</span>
              </t-col>
              <t-col :span="6">
                <span>{{ $t('pages.room.roomType') }} : {{ t(formRoomData.roomType) }}</span>
              </t-col>
              <t-col :span="6">
                <span>{{ $t('pages.room.specs') }} : {{ formRoomData.specs }}</span>
              </t-col>
              <t-col :span="6">
                <span>{{ $t('pages.room.price') }} : {{ formRoomData.price }}</span>
              </t-col>
              <t-col :span="6">
                <span>{{ $t('pages.room.saleStatus') }} : {{ t(formRoomData.saleStatus) }}</span>
              </t-col>
              <t-col :span="6">
                <span>{{ $t('pages.room.intoStatus') }} : {{ t(formRoomData.intoStatus) }}</span>
              </t-col>
              <!-- 管理费起止日期：room 库列（后端在下葬/收款事务中维护），仅展示不录入；
                   末项结束日期独占整行凑偶数布局 20260910 新增 -->
              <t-col :span="6">
                <span>{{ $t('pages.adminfee.startDate') }} : {{ formatDate(formRoomData.startDate) }}</span>
              </t-col>
              <t-col :span="12">
                <span>{{ $t('pages.adminfee.endDate') }} : {{ formatDate(formRoomData.endDate) }}</span>
              </t-col>

              <!-- 修改/删除模式：墓穴信息下方以列表展示全部收款记录；修改用单选列回填表单，删除用操作列逐行删除 20260909 新增 -->
              <t-col v-if="isModifyMode || isDeleteMode" :span="12">
                <t-form-item name="idAdminfee">
                  <t-table
                    v-model:selected-row-keys="selectedFeeKeys"
                    class="adminfee-record-table"
                    :data="adminfeeRecords"
                    :columns="isDeleteMode ? deleteColumns : modifyColumns"
                    row-key="idAdminfee"
                    :bordered="true"
                    size="small"
                    :max-height="240"
                    @select-change="onSelectFeeRecord"
                  >
                    <!-- 开始/结束日期库中为 datetime，列表统一格式化为 yyyy-mm-dd 20260909 新增 -->
                    <template #startDate="{ row }">
                      {{ formatDate(row.startDate) }}
                    </template>
                    <template #endDate="{ row }">
                      {{ formatDate(row.endDate) }}
                    </template>
                    <!-- 删除模式操作列：逐行“删除”按钮，点击弹出二次确认 20260909 新增 -->
                    <template #op="{ row }">
                      <t-link theme="danger" @click="onSelectRecord(row)">
                        {{ $t('operate.delete') }}
                      </t-link>
                    </template>
                  </t-table>
                </t-form-item>
              </t-col>

              <t-col v-if="!isDeleteMode" :span="6">
                <t-form-item :required="true" :label="$t('pages.adminfee.payer')" name="payer">
                  <t-input
                    v-model="formFeeData.payer"
                    :maxcharacter="20"
                    show-limit-number
                    :style="{ width: '322px' }"
                    :placeholder="$t('pages.adminfee.payerPlaceholder')"
                  />
                </t-form-item>
              </t-col>
              <!-- 付款人电话：库列名原始拼写 payePrhone，非必填 20260909 新增 -->
              <t-col v-if="!isDeleteMode" :span="6">
                <t-form-item :label="$t('pages.adminfee.payePrhone')" name="payePrhone">
                  <t-input
                    v-model="formFeeData.payePrhone"
                    :maxcharacter="11"
                    show-limit-number
                    :style="{ width: '322px' }"
                    :placeholder="$t('pages.adminfee.payePrhonePlaceholder')"
                  />
                </t-form-item>
              </t-col>
              <t-col v-if="!isDeleteMode" :span="6">
                <t-form-item :required="true" :label="$t('pages.adminfee.payAmount')" name="payAmount">
                  <t-input-number
                    v-model="formFeeData.payAmount"
                    theme="normal"
                    :min="0"
                    :decimal-places="0"
                    :style="{ width: '322px' }"
                    :placeholder="$t('pages.adminfee.payAmountPlaceholder')"
                  />
                </t-form-item>
              </t-col>
              <!-- 开始日期只读：自动取该墓位首次下葬时间，新建时后端锚定，修改时取记录原值 20260909 新增 -->
              <t-col v-if="!isDeleteMode" :span="6">
                <t-form-item :label="$t('pages.adminfee.startDate')" name="startDate">
                  <t-input
                    v-model="formFeeData.startDate"
                    readonly
                    :style="{ width: '322px' }"
                    :placeholder="$t('pages.adminfee.startDatePlaceholder')"
                  />
                </t-form-item>
              </t-col>
              <t-col v-if="!isDeleteMode" :span="6">
                <t-form-item :required="true" :label="$t('pages.adminfee.termYears')" name="termYears">
                  <t-input-number
                    v-model="formFeeData.termYears"
                    theme="normal"
                    :min="0"
                    :decimal-places="0"
                    :style="{ width: '322px' }"
                    :placeholder="$t('pages.adminfee.termYearsPlaceholder')"
                  />
                </t-form-item>
              </t-col>
              <!-- 结束日期只读：自动 = 开始日期顺延缴费年限年 20260909 新增 -->
              <t-col v-if="!isDeleteMode" :span="6">
                <t-form-item :label="$t('pages.adminfee.endDate')" name="endDate">
                  <t-input
                    v-model="formFeeData.endDate"
                    readonly
                    :style="{ width: '322px' }"
                    :placeholder="$t('pages.adminfee.endDatePlaceholder')"
                  />
                </t-form-item>
              </t-col>
              <t-col v-if="!isDeleteMode" :span="12">
                <t-form-item :label="$t('pages.adminfee.remark')" name="remark">
                  <t-input
                    v-model="formFeeData.remark"
                    :maxcharacter="50"
                    :height="124"
                    :placeholder="$t('pages.adminfee.remarkPlaceholder')"
                  />
                </t-form-item>
              </t-col>
            </t-row>
          </div>
        </div>

        <div v-if="!isDeleteMode" class="form-submit-container">
          <div class="form-submit-sub">
            <div class="form-submit-left">
              <t-button theme="primary" class="form-submit-confirm" @click="ClickSubmit()">
                {{ $t('operate.confirm') }}
              </t-button>

              <t-button class="form-submit-cancel" theme="default" @click="onReset()">
                {{ $t('operate.cancel') }}
              </t-button>
            </div>
          </div>
        </div>
      </t-form>
    </div>
    <!-- 管理费收款登记结束 -->
    <!-- 删除收款记录二次确认弹窗，参照墓区下葬页 20260909 新增 -->
    <t-dialog
      v-model:visible="confirmVisible"
      :header="dialogHeader"
      :body="confirmBody"
      :on-cancel="onCancel"
      @confirm="onConfirmDelete"
    />
  </div>
</template>
<script lang="ts">
export default {
  name: 'Adminfee',
};
</script>
<script setup lang="ts">
import dayjs from 'dayjs';
import { RollbackIcon, ZoomInIcon, ZoomOutIcon } from 'tdesign-icons-vue-next';
import type { PrimaryTableCol } from 'tdesign-vue-next';
import { MessagePlugin } from 'tdesign-vue-next';
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';

import { deleteAdminfee, getAdminfeeList, getRoomList, insertAdminfee, updateAdminfee } from '@/api/adminfee';
// 管理费开始日期锚定该墓位首次下葬时间，复用下葬接口取最早 burialDate 20260909 新增
import { getBuriedList } from '@/api/buried';
import type { AdminfeeModel } from '@/api/model/adminfeeModel';
import type { BuriedModel } from '@/api/model/buriedModel';
import type { RoomModel } from '@/api/model/roomModel';
import { getIdList } from '@/api/room';
import RoomDetail from '@/components/room-detail/index.vue';
import { BUSINESS_BASIC_FORM_LABEL_WIDTH } from '@/constants';
import type { CardRowArg } from '@/hooks';
import { useCardGrid, usePageSwitch, useParkRoomFilter, usePermission, useRoomDetail, useTabCacheName } from '@/hooks';
import { t, translate } from '@/locales';
import { formatDate } from '@/utils/date';
import { formatPrice } from '@/utils/format';
import { logError } from '@/utils/logger';

import { FIND_DATA, INITIAL_FEE_DATA, INITIAL_ROOM_DATA } from './constants';

// ============================================================
// 管理费收款页，参照墓区下葬页卡片网格：通用定义 → 列表（筛选/查询/卡片）→ 详情 → 收款登记（新建/修改/删除）20260909 新增,
// ============================================================

// ==================== 通用：权限与视图切换 ====================
// 向tab记录登记组件真实name，修复后端路由name与组件name不一致导致切tab不保活的问题 20260909 新增,
useTabCacheName('Adminfee');

// 管理费收款权限对象按 idMenu(104101) 精确匹配，权限不足时兼容空对象避免运行时报错 20260909 新增
const userInfo = usePermission('104101');

// 下葬状态：未下葬用于区分卡片是否显示“新建/修改/删除”（管理费锚定首次下葬，未下葬无锚点）20260909 新增
const INTO_INCOMPLET = 'statusType.intoStatusEnum.incomplet';
// 卡片状态标签配色：取状态枚举 key 末段(如 sold/buried)拼接胶囊标签修饰类 20260917 新增
const statusKey = (status?: string) => (status ? String(status).split('.').pop() || '' : '');
// 卡片长文本截断：下葬者/联系人超过7字显示前7字+省略号，悬停 tooltip 展示完整内容（与下葬页一致） 20260917 新增
const truncateText = (value?: string | null) => {
  const text = String(value || '');
  return text.length > 7 ? `${text.slice(0, 7)}…` : text;
};
// 是否超过7字需要截断并显示悬停提示 20260917 新增
const isOverflow = (value?: string | null) => String(value || '').length > 7;

type FilterFormData = typeof FIND_DATA;
type RoomFormData = typeof INITIAL_ROOM_DATA;
type FeeFormData = typeof INITIAL_FEE_DATA;

// 视图互斥显示：列表 / 详情 / 收款登记（新建、修改、删除复用同一表单）20260909 新增,
const isListShow = ref(false);
const isDetailShow = ref(false);
const isCreateShow = ref(false);

const formRoomData = ref<RoomFormData>({ ...INITIAL_ROOM_DATA });
const formFeeData = ref<FeeFormData>({ ...INITIAL_FEE_DATA });

// 视图互斥切换收敛于公共 usePageSwitch，模板引用名保持不变 20260914 抽取
const { controlPageShow } = usePageSwitch({
  list: isListShow,
  detail: isDetailShow,
  create: isCreateShow,
});

// ==================== 列表：状态与筛选下拉数据 ====================
// 区域由收费管理下区域三级菜单经路由meta下发，挂载时读取一次；
// keep-alive按fullPath区分实例，各区域tab互不影响，无需响应式监听 20260909 新增,
const menuRegion = (useRoute().meta.region as string) || '';
const formfindData = ref<FilterFormData>({ ...FIND_DATA, region: menuRegion });
const adminfeeCardViewport = ref<HTMLElement | null>(null);

// 区域/园区下拉、园区联动、排号去重、查询二次过滤收敛于公共 useParkRoomFilter 20260914 抽取
const {
  searchRoomList,
  hasQueried,
  availableParkList,
  yNumList,
  getRegionData,
  getParkData,
  onSelectChange,
  getRoomData,
  onSubmit,
} = useParkRoomFilter<RoomModel>(formfindData, (park, region) => getRoomList(park, region));

// ==================== 列表：卡片行分组与缩放 ====================
// 卡片网格（缩放/分组补位/记录数）收敛于公共 useCardGrid，模板引用名保持不变 20260914 抽取
const {
  zoom: adminfeeZoom,
  handleZoomIn,
  handleZoomOut,
  cardRows: adminfeeCardRows,
  totalText: listTotalText,
} = useCardGrid(searchRoomList);

// ==================== 列表：查询与筛选事件 ====================
// 按园区+区域请求墓位，加载完成后才置 hasQueried，避免先闪现“暂无数据”再切换为卡片 20260909 新增,

onMounted(() => {
  getRegionData();
  getParkData();
  // 列表不默认查询展示，需用户选择园区后手动查询 20260909 新增,
  setTimeout(() => {
    controlPageShow('list');
  }, 380);
});

// ==================== 详情 ====================
// 详情统一由 room-detail 组件展示，数据加载收敛于 useRoomDetail 20260914 抽取
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

// 点击卡片详情：拉取单条墓位数据与活动预定/销售记录、管理费收款记录列表后进入详情视图 20260909 新增,
const handleClickDetail = async (row: CardRowArg<RoomModel>) => {
  try {
    const currentRow = row.row ?? row;
    await loadDetail(currentRow.idRoom);
    controlPageShow('detail');
  } catch (e) {
    logError(e);
  }
};

// 详情关闭：清空详情数据并回到列表 20260909 新增,
const ClickDetailClose = () => {
  clearDetail();
  controlPageShow('list');
};

// ==================== 收款登记：新建 / 修改 / 删除 ====================
// 删除模式：复用收款登记视图，仅展示墓穴信息+记录列表(操作列删除)，隐藏可编辑表单与提交区 20260909 新增
const isDeleteMode = ref(false);
// 表单标题随模式切换：删除 > 修改 > 新建 20260909 新增
const formTitle = computed(() => {
  if (isDeleteMode.value) {
    return translate('pages.adminfee.deleteTitle');
  }
  return formFeeData.value.idAdminfee !== 0
    ? translate('pages.adminfee.modifyTitle')
    : translate('pages.adminfee.creatTitle');
});

// 修改模式下在墓穴信息下方以列表展示“选择收款记录”；adminfeeRecords 为该墓位全部活动收款记录（后端按 idAdminfee DESC，[0] 为最新）20260909 新增
const isModifyMode = ref(false);
const adminfeeRecords = ref<AdminfeeModel[]>([]);
// 列表单选选中的收款记录 idAdminfee（默认最新一条），及展示完整信息的列定义 20260909 新增
const selectedFeeKeys = ref<Array<string | number>>([]);
const modifyColumns: PrimaryTableCol[] = [
  { title: translate('pages.adminfee.payer'), colKey: 'payer' },
  { title: translate('pages.adminfee.payAmount'), colKey: 'payAmount', width: 100 },
  { title: translate('pages.adminfee.startDate'), colKey: 'startDate', width: 120 },
  { title: translate('pages.adminfee.endDate'), colKey: 'endDate', width: 120 },
  { title: translate('pages.adminfee.termYears'), colKey: 'termYears', width: 90 },
  { title: translate('pages.adminfee.remark'), colKey: 'remark', ellipsis: true },
  // 选择列（单选 radio）置于最后一列 20260909 新增
  { title: translate('pages.adminfee.select'), colKey: 'row-select', type: 'single', width: 50 },
];

// 删除页记录列表列：与修改页一致，但末列由“选择”单选列改为“操作”列（逐行删除按钮）20260909 新增
const deleteColumns: PrimaryTableCol[] = [
  { title: translate('pages.adminfee.payer'), colKey: 'payer' },
  { title: translate('pages.adminfee.payAmount'), colKey: 'payAmount', width: 100 },
  { title: translate('pages.adminfee.startDate'), colKey: 'startDate', width: 120 },
  { title: translate('pages.adminfee.endDate'), colKey: 'endDate', width: 120 },
  { title: translate('pages.adminfee.termYears'), colKey: 'termYears', width: 90 },
  { title: translate('pages.adminfee.remark'), colKey: 'remark', ellipsis: true },
  { title: translate('operate.operation'), colKey: 'op', width: 90 },
];

// 开始/结束日期在库中为 datetime，列表统一格式化为 yyyy-mm-dd 显示，收敛于公共 formatDate 20260914 抽取

const resetFeeForm = (idRoom = 0) => {
  formFeeData.value = {
    ...INITIAL_FEE_DATA,
    idRoom,
  };
};

// 用选中的收款记录回填表单（供修改），字段与 INITIAL_FEE_DATA 结构一致 20260909 新增
const fillFeeForm = (record: AdminfeeModel) => {
  formFeeData.value = {
    idAdminfee: record.idAdminfee,
    idRoom: record.idRoom,
    payer: record.payer ?? '',
    payePrhone: record.payePrhone ?? '',
    payAmount: record.payAmount ?? 0,
    startDate: formatDate(record.startDate),
    endDate: formatDate(record.endDate),
    termYears: record.termYears ?? 0,
    remark: record.remark ?? '',
  };
};

// 结束日期 = 开始日期顺延缴费年限年；开始日期或年限变化时自动重算 20260909 新增
const recomputeEndDate = () => {
  const start = formFeeData.value.startDate;
  const years = Number(formFeeData.value.termYears) || 0;
  formFeeData.value.endDate = start ? dayjs(start).add(years, 'year').format('YYYY-MM-DD') : '';
};
watch(() => [formFeeData.value.startDate, formFeeData.value.termYears], recomputeEndDate);

// 求该墓位最早的下葬日期（首次下葬），格式化为 YYYY-MM-DD；无下葬记录返回空串 20260909 新增
const getFirstBurialDate = (list?: BuriedModel[]): string => {
  if (!list || list.length === 0) {
    return '';
  }
  let earliest = '';
  list.forEach((item) => {
    const value = item.burialDate;
    if (!value) {
      return;
    }
    if (!earliest || dayjs(value).isBefore(dayjs(earliest))) {
      earliest = value;
    }
  });
  return earliest ? dayjs(earliest).format('YYYY-MM-DD') : '';
};

const getRoomID = async (id: number) => {
  try {
    const { list } = await getIdList(id);
    const dataQuery = list[0];
    formRoomData.value = dataQuery;
  } catch (e) {
    logError(e);
  }
};

// 点击卡片“新建”：先取首次下葬日期作为开始日期锚点，无下葬记录则提示后中止 20260909 新增,
const handleClickCreate = async (row: CardRowArg<RoomModel>) => {
  const currentRow = row.row ?? row;
  try {
    const { list: buriedList } = await getBuriedList(currentRow.idRoom);
    const firstBurialDate = getFirstBurialDate(buriedList);
    if (!firstBurialDate) {
      MessagePlugin.warning(translate('pages.adminfee.noBurialPrompt'));
      return;
    }
    isModifyMode.value = false;
    isDeleteMode.value = false;
    adminfeeRecords.value = [];
    selectedFeeKeys.value = [];
    resetFeeForm(currentRow.idRoom);
    await getRoomID(currentRow.idRoom);
    formFeeData.value.startDate = firstBurialDate;
    recomputeEndDate();
    controlPageShow('create');
  } catch (e) {
    logError(e);
  }
};

// 取消：重置收款表单，保持当前墓位 20260909 新增,
const onReset = () => {
  resetFeeForm(formRoomData.value.idRoom);
};

// 收款登记关闭：清空数据并回到列表 20260909 新增,
const ClickCreateClose = () => {
  formRoomData.value = { ...INITIAL_ROOM_DATA };
  resetFeeForm();
  isModifyMode.value = false;
  isDeleteMode.value = false;
  adminfeeRecords.value = [];
  selectedFeeKeys.value = [];
  controlPageShow('list');
};

// ==================== 卡片：修改 / 删除（多条收款记录选择）====================
// 删除二次确认弹窗，提示文案参照墓区下葬页：删除后，园区+排+序号 + 收款信息将被清空 20260909 新增
const confirmVisible = ref(false);
const deleteTarget = ref<{ idAdminfee: number; idRoom: number; payer: string } | null>(null);
const dialogHeader = translate('operate.deleteDataCPrompt');
const confirmBody = computed(() => {
  if (!deleteTarget.value) {
    return '';
  }
  const { park, yNum, xNum } = formRoomData.value;
  return `${translate('operate.deleteDataAPrompt')}${park}${yNum}${translate('operate.row')}${xNum}${translate(
    'pages.adminfee.deleteInfoPrompt',
  )}`;
});
const onCancel = () => {
  deleteTarget.value = null;
};

// 列表单选收款记录：选中行变化时用该记录回填下方修改表单 20260909 新增
const onSelectFeeRecord = (keys: Array<string | number>) => {
  const id = Number(keys[0]);
  const record = adminfeeRecords.value.find((item) => item.idAdminfee === id);
  if (record) {
    fillFeeForm(record);
  }
};

// 点击卡片“修改”：进入修改页，墓穴信息下方列出全部收款记录，默认选中最后一条（最新）20260909 新增,
const handleClickModify = async (row: CardRowArg<RoomModel>) => {
  const currentRow = row.row ?? row;
  try {
    const { list } = await getAdminfeeList(currentRow.idRoom);
    if (!list || list.length === 0) {
      MessagePlugin.warning(translate('pages.adminfee.noRecord'));
      return;
    }
    // 后端已按 idAdminfee DESC 排序，list[0] 即最后一条（最新）收款记录，默认单选它
    adminfeeRecords.value = list;
    isModifyMode.value = true;
    isDeleteMode.value = false;
    resetFeeForm(currentRow.idRoom);
    await getRoomID(currentRow.idRoom);
    fillFeeForm(list[0]);
    selectedFeeKeys.value = [list[0].idAdminfee];
    controlPageShow('create');
  } catch (e) {
    logError(e);
  }
};

// 点击卡片“删除”：进入删除页（复用收款登记视图 isDeleteMode），墓穴信息下方列出全部收款记录，操作列逐行删除 20260909 新增
const handleClickDelete = async (row: CardRowArg<RoomModel>) => {
  const currentRow = row.row ?? row;
  try {
    const { list } = await getAdminfeeList(currentRow.idRoom);
    if (!list || list.length === 0) {
      MessagePlugin.warning(translate('pages.adminfee.noRecord'));
      return;
    }
    adminfeeRecords.value = list;
    isModifyMode.value = false;
    isDeleteMode.value = true;
    selectedFeeKeys.value = [];
    resetFeeForm(currentRow.idRoom);
    await getRoomID(currentRow.idRoom);
    controlPageShow('create');
  } catch (e) {
    logError(e);
  }
};

// 删除页操作列“删除”：记录待删除目标并打开二次确认 20260909 新增,
const onSelectRecord = (record: AdminfeeModel) => {
  deleteTarget.value = { idAdminfee: record.idAdminfee, idRoom: record.idRoom, payer: record.payer };
  confirmVisible.value = true;
};

// 确认删除：软删除选中的收款记录（管理费删除不回置墓位状态）；成功后刷新列表并关闭删除页 20260909 新增
const onConfirmDelete = async () => {
  if (!deleteTarget.value) {
    return;
  }
  const { idAdminfee, idRoom } = deleteTarget.value;
  deleteTarget.value = null;
  confirmVisible.value = false;
  try {
    await deleteAdminfee(idAdminfee, idRoom);
    MessagePlugin.success(translate('operate.deleteSuccessPrompt'));
    await getRoomData();
    ClickCreateClose();
  } catch (e) {
    logError(e);
  }
};

// 提交收款登记：idAdminfee 为0走新增，否则走修改；成功后刷新列表 20260909 新增,

const ClickSubmit = async () => {
  if (formFeeData.value.payer === '') {
    return MessagePlugin.warning(translate('pages.adminfee.payerPlaceholder'));
  }
  if (!formFeeData.value.payAmount || Number(formFeeData.value.payAmount) <= 0) {
    return MessagePlugin.warning(translate('pages.adminfee.payAmountPlaceholder'));
  }
  if (!formFeeData.value.termYears || Number(formFeeData.value.termYears) <= 0) {
    return MessagePlugin.warning(translate('pages.adminfee.termYearsPlaceholder'));
  }
  if (!formFeeData.value.startDate) {
    return MessagePlugin.warning(translate('pages.adminfee.noBurialPrompt'));
  }

  if (formFeeData.value.idAdminfee === 0) {
    try {
      await insertAdminfee(formFeeData.value);
      MessagePlugin.success(translate('operate.createdSuccessPrompt'));
      await getRoomData();
      ClickCreateClose();
    } catch (e) {
      logError(e);
      MessagePlugin.error(translate('operate.createdFailedPrompt'));
    }
  } else {
    try {
      await updateAdminfee(formFeeData.value);
      MessagePlugin.success(translate('operate.modifySuccessPrompt'));
      await getRoomData();
      ClickCreateClose();
    } catch (e) {
      logError(e);
      MessagePlugin.error(translate('operate.modifyFailedPrompt'));
    }
  }
};
</script>
<style lang="less" scoped>
@import './index.less';
</style>

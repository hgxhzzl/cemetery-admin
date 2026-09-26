<template>
  <div>
    <!-- 列表开始 -->
    <div v-show="isListShow" class="table-tree-container">
      <div class="list-tree-content transferOut-page-content">
        <div
          class="list-common-table transferOut-list-panel"
          :class="{ 'transferOut-list-panel--full': hasQueried && transferOutCardRows.length }"
        >
          <!-- 标题为两字短词，label 宽度收窄以减小与下拉框的空隙 -->
          <t-form
            class="cms-card-filter-bar"
            :data="formfindData"
            :label-width="BUSINESS_BASIC_FORM_LABEL_WIDTH"
            colon
            @submit="onSubmit"
          >
            <t-row>
              <t-col :span="10">
                <!-- 筛选条件横向排列，间距由 flex gap 固定，消除栅格列内空白 -->
                <div class="cms-card-filter-inline">
                  <!-- 区域由墓位迁出下区域三级菜单经路由下发：下拉框仅展示当前区域且不可用（不可切换，同墓位业务页）20260925 新增；
                       本页筛选行 4 项，区域/排号下拉框收窄至 120px（页面专属类），避免排序项窜行 -->
                  <t-form-item
                    :label="$t('pages.room.region')"
                    name="region"
                    class="cms-filter-item transferOut-filter-item-narrow"
                  >
                    <t-select
                      v-model="formfindData.region"
                      class="demo-select-base cms-filter-control transferOut-filter-control-narrow"
                      disabled
                      :placeholder="$t('pages.room.regionPlaceholder')"
                    >
                      <t-option :value="menuRegion" :label="menuRegion">{{ menuRegion }}</t-option>
                    </t-select>
                  </t-form-item>
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
                  <t-form-item
                    :label="$t('pages.room.yNum')"
                    name="yNum"
                    class="cms-filter-item transferOut-filter-item-narrow"
                  >
                    <t-select
                      v-model="formfindData.yNum"
                      class="demo-select-base cms-filter-control transferOut-filter-control-narrow"
                      :placeholder="$t('pages.room.yNumSelectPlaceholder')"
                      clearable
                      @change="onSelectChange"
                    >
                      <t-option v-for="(item, index) in yNumList" :key="index" :value="item.value" :label="item.label">
                        {{ item.label }}
                      </t-option>
                    </t-select>
                  </t-form-item>
                  <!-- 排序选项：对排号升/降序展示卡片行组，默认降序；分段控件样式同墓位业务页 20260925 新增 -->
                  <t-form-item
                    :label="$t('pages.gravePlotBusiness.sortOrder')"
                    name="sortOrder"
                    class="cms-filter-item transferOut-filter-item-sort"
                  >
                    <t-radio-group v-model="formfindData.sortOrder" variant="default-filled" size="small">
                      <t-radio-button value="asc">{{ $t('pages.gravePlotBusiness.sortAsc') }}</t-radio-button>
                      <t-radio-button value="desc">{{ $t('pages.gravePlotBusiness.sortDesc') }}</t-radio-button>
                    </t-radio-group>
                  </t-form-item>
                </div>
              </t-col>

              <!-- 重置按钮移除，保留查询按钮即可 -->
              <t-col :span="2" class="operation-container">
                <t-button theme="primary" type="submit">
                  {{ $t('operate.query') }}
                </t-button>
              </t-col>
            </t-row>
          </t-form>

          <!-- 查询后无数据时不展示卡片区，仅在筛选表单下方居中提示 -->
          <div v-if="hasQueried && !transferOutCardRows.length" class="transferOut-no-data">
            {{ $t('pages.transferOut.noData') }}
          </div>

          <div v-if="hasQueried && transferOutCardRows.length" class="transferOut-list-body">
            <!-- 卡片区滚动位置实时记录，tab 切回时 onActivated 恢复，同墓位业务页 20260926 新增 -->
            <div
              ref="transferOutCardViewport"
              class="table-container transferOut-card-layout"
              @scroll.passive="onCardViewportScroll"
            >
              <div v-if="transferOutCardRows.length" class="transferOut-card-rows" :style="{ zoom: transferOutZoom }">
                <div v-for="rowGroup in transferOutCardRows" :key="rowGroup.yNum" class="transferOut-card-row">
                  <div class="transferOut-card-grid">
                    <div
                      v-for="card in rowGroup.cards"
                      :key="`${rowGroup.yNum}-${card.xNum}`"
                      class="transferOut-card"
                      :class="{
                        'transferOut-card--empty': card.placeholder,
                        [getCardStatusClass('transferOut', card.row)]: !card.placeholder,
                      }"
                    >
                      <template v-if="card.placeholder">
                        <!-- 空位卡序号与正常卡同样顶部对齐 -->
                        <div class="transferOut-card__header">
                          <div class="transferOut-card__serial">{{ rowGroup.yNum }} 排 {{ card.xNum }} 号</div>
                        </div>
                        <div class="transferOut-card__body">
                          <div class="transferOut-card__empty-text">{{ $t('pages.transferOut.emptySeat') }}</div>
                        </div>
                      </template>
                      <template v-else>
                        <div class="transferOut-card__header">
                          <!-- 排号改取 xyNumber 字段(自定义坐标名)，缺失时回退 yNum/xNum 拼接 -->
                          <div class="transferOut-card__serial">
                            {{ card.row.xyNumber || `${rowGroup.yNum} 排 ${card.row.xNum} 号` }}
                          </div>
                          <!-- 墓穴类型标题去掉，值改为胶囊标签上移至卡片第一行右侧 -->
                          <span class="transferOut-card__type">{{ $t(card.row.roomType).trim() }}</span>
                        </div>
                        <div class="transferOut-card__body">
                          <!-- 购墓人/下葬者/联系人/价格：标签在左灰色、值在右深色两端对齐 -->
                          <div class="transferOut-card__meta">
                            <span class="transferOut-card__meta-label">{{ $t('pages.room.buyer') }}</span>
                            <span class="transferOut-card__meta-value">{{ card.row.buyer || '--' }}</span>
                          </div>
                          <div class="transferOut-card__meta">
                            <span class="transferOut-card__meta-label">{{ $t('pages.room.buriedPerson') }}</span>
                            <!-- 下葬者超过7字截断为前7字+省略号，悬停提示完整内容 -->
                            <t-tooltip v-if="isOverflow(card.row.deceased)" :content="String(card.row.deceased)">
                              <span class="transferOut-card__meta-value">{{ truncateText(card.row.deceased) }}</span>
                            </t-tooltip>
                            <!-- 下葬者无值时不显示占位符，留空 -->
                            <span v-else class="transferOut-card__meta-value">{{ card.row.deceased }}</span>
                          </div>
                          <!-- 联系人：room 表字段，存所有联系人 -->
                          <div class="transferOut-card__meta">
                            <span class="transferOut-card__meta-label">{{ $t('pages.room.contacts') }}</span>
                            <!-- 联系人超过7字截断为前7字+省略号，悬停提示完整内容 -->
                            <t-tooltip v-if="isOverflow(card.row.contacts)" :content="String(card.row.contacts)">
                              <span class="transferOut-card__meta-value">{{ truncateText(card.row.contacts) }}</span>
                            </t-tooltip>
                            <span v-else class="transferOut-card__meta-value">{{ card.row.contacts || '--' }}</span>
                          </div>
                          <div class="transferOut-card__meta">
                            <span class="transferOut-card__meta-label">{{ $t('pages.room.price') }}</span>
                            <span class="transferOut-card__meta-value">{{ formatPrice(card.row.price) }}</span>
                          </div>
                          <!-- 销售/迁出状态改为两枚彩色胶囊标签两端分布；存量墓位迁出状态为 NULL 时兑底展示“未迁出” 20260916 新增 -->
                          <div class="transferOut-card__status">
                            <span
                              class="transferOut-card__tag"
                              :class="`transferOut-card__tag--${statusKey(card.row.saleStatus)}`"
                            >
                              {{ $t(card.row.saleStatus) }}
                            </span>
                            <span
                              class="transferOut-card__tag"
                              :class="`transferOut-card__tag--${statusKey(card.row.transferOutStatus || NOT_OUT)}`"
                            >
                              {{ $t(card.row.transferOutStatus || NOT_OUT) }}
                            </span>
                          </div>
                        </div>
                        <div class="transferOut-card__actions">
                          <t-link theme="primary" @click="handleClickDetail(card.row)">{{
                            $t('operate.detail')
                          }}</t-link>
                          <!-- 仅“已下葬且未迁出”墓位显示新建迁出（未下葬/已迁出不显示），并按新建权限门控 20260916 新增 -->
                          <t-link
                            v-if="
                              card.row.intoStatus !== INTO_INCOMPLET &&
                              card.row.transferOutStatus !== TRANSFER_OUT_OUT &&
                              userInfo.useCreate === 1
                            "
                            theme="danger"
                            @click="handleClickCreate(card.row)"
                          >
                            {{ $t('operate.create') }}
                          </t-link>
                          <!-- 已迁出（存在迁出记录）按修改权限显示“修改”，点击弹窗选择要修改的记录 20260916 新增 -->
                          <t-link
                            v-if="card.row.transferOutStatus === TRANSFER_OUT_OUT && userInfo.useModify === 1"
                            theme="primary"
                            @click="handleClickModify(card.row)"
                          >
                            {{ $t('operate.modify') }}
                          </t-link>
                          <!-- 已迁出按删除权限显示“删除”，点击弹窗选择要删除的记录 20260916 新增 -->
                          <t-link
                            v-if="card.row.transferOutStatus === TRANSFER_OUT_OUT && userInfo.useDelete === 1"
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

          <!-- 列表底部工具行：左侧记录数，右侧外框颜色图例（同墓位业务页图例样式）+ 放大/缩小卡片列表 20260926 修改 -->
          <div v-if="hasQueried && transferOutCardRows.length" class="transferOut-list-toolbar">
            <span>{{ listTotalText }}</span>
            <div class="transferOut-list-toolbar__right">
              <!-- 卡片外框颜色说明：绿已销售/蓝已下葬/浅红管理到期 20260926 新增 -->
              <div class="transferOut-list-toolbar__legend">
                <span class="transferOut-legend-item">
                  <i class="transferOut-legend-item__swatch transferOut-legend-item__swatch--sold" />
                  {{ $t('statusType.saleStatusEnum.sold') }}
                </span>
                <span class="transferOut-legend-item">
                  <i class="transferOut-legend-item__swatch transferOut-legend-item__swatch--buried" />
                  {{ $t('statusType.intoStatusEnum.buried') }}
                </span>
                <span class="transferOut-legend-item">
                  <i class="transferOut-legend-item__swatch transferOut-legend-item__swatch--expired" />
                  {{ $t('pages.gravePlotBusiness.legendExpired') }}
                </span>
              </div>
              <span class="transferOut-list-toolbar__zoom">
                <zoom-in-icon class="transferOut-list-toolbar__zoom-icon" @click="handleZoomIn" />
                <zoom-out-icon class="transferOut-list-toolbar__zoom-icon" @click="handleZoomOut" />
              </span>
            </div>
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
    <!-- 迁出登记（新建/修改/删除）开始 -->
    <div v-if="isCreateShow">
      <t-form class="base-form" :data="formTransferOutData" label-align="top" :label-width="100">
        <div class="form-basic-container">
          <div class="form-basic-item">
            <div class="form-basic-container-title">
              {{ formTitle }}
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

            <!-- 表单内容 -->

            <t-row class="info-block des" :gutter="[62, 5]">
              <t-col :span="6">
                <span>{{ $t('pages.room.park') }} : {{ formRoomData.park }}</span>
              </t-col>
              <!-- 去掉排号/序号，原排号位置改为显示编号xyNumber -->
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
                <span>{{ $t('pages.room.price') }} : {{ formatPrice(formRoomData.price) }}</span>
              </t-col>
              <t-col :span="6">
                <span>{{ $t('pages.room.saleStatus') }} : {{ t(formRoomData.saleStatus) }}</span>
              </t-col>
              <!-- 迁出状态：存量墓位该字段为 NULL，展示时兑底为“未迁出” 20260916 新增 -->
              <t-col :span="6">
                <span
                  >{{ $t('pages.room.transferOutStatus') }} : {{ t(formRoomData.transferOutStatus || NOT_OUT) }}</span
                >
              </t-col>
              <!-- 下葬状态独占整行：强制新建页表单首项（迁出日期）另起一行排在其正下方 -->
              <t-col :span="12">
                <span>{{ $t('pages.room.intoStatus') }} : {{ t(formRoomData.intoStatus) }}</span>
              </t-col>

              <!-- 修改/删除模式：墓穴信息下方以列表展示全部迁出记录；修改用单选列回填表单，删除用操作列逐行删除 20260916 新增 -->
              <t-col v-if="isModifyMode || isDeleteMode" :span="12">
                <t-form-item name="idTransfer">
                  <t-table
                    v-model:selected-row-keys="selectedTransferOutKeys"
                    class="transferOut-record-table"
                    :data="transferOutRecords"
                    :columns="isDeleteMode ? deleteColumns : modifyColumns"
                    row-key="idTransfer"
                    :bordered="true"
                    size="small"
                    :max-height="240"
                    @select-change="onSelectTransferOutRecord"
                  >
                    <!-- 迁出日期库中为 datetime，列表统一格式化为 yyyy-mm-dd -->
                    <template #transferOutDate="{ row }">
                      {{ formatDate(row.transferOutDate) }}
                    </template>
                    <!-- 删除模式操作列：逐行“删除”按钮，点击弹出二次确认 20260916 新增 -->
                    <template #op="{ row }">
                      <t-link theme="danger" @click="onSelectRecord(row)">
                        {{ $t('operate.delete') }}
                      </t-link>
                    </template>
                  </t-table>
                </t-form-item>
              </t-col>

              <t-col v-if="!isDeleteMode" :span="6">
                <t-form-item :required="true" :label="$t('pages.transferOut.transferOutDate')" name="transferOutDate">
                  <t-date-picker
                    v-model="formTransferOutData.transferOutDate"
                    :style="{ width: '322px' }"
                    theme="primary"
                    mode="date"
                    separator="/"
                    :placeholder="$t('pages.transferOut.transferOutDatePlaceholder')"
                  />
                </t-form-item>
              </t-col>
              <t-col v-if="!isDeleteMode" :span="6">
                <t-form-item :required="true" :label="$t('pages.transferOut.destination')" name="destination">
                  <t-input
                    v-model="formTransferOutData.destination"
                    :maxcharacter="100"
                    show-limit-number
                    :style="{ width: '322px' }"
                    :placeholder="$t('pages.transferOut.destinationPlaceholder')"
                  />
                </t-form-item>
              </t-col>
              <t-col v-if="!isDeleteMode" :span="6">
                <t-form-item :label="$t('pages.transferOut.reason')" name="reason">
                  <t-input
                    v-model="formTransferOutData.reason"
                    :maxcharacter="100"
                    show-limit-number
                    :style="{ width: '322px' }"
                    :placeholder="$t('pages.transferOut.reasonPlaceholder')"
                  />
                </t-form-item>
              </t-col>
              <t-col v-if="!isDeleteMode" :span="6">
                <t-form-item :label="$t('pages.transferOut.contacts')" name="contacts">
                  <t-input
                    v-model="formTransferOutData.contacts"
                    :maxcharacter="20"
                    show-limit-number
                    :style="{ width: '322px' }"
                    :placeholder="$t('pages.transferOut.contactsPlaceholder')"
                  />
                </t-form-item>
              </t-col>
              <t-col v-if="!isDeleteMode" :span="6">
                <t-form-item :label="$t('pages.transferOut.contactsphone')" name="contactsphone">
                  <t-input
                    v-model="formTransferOutData.contactsphone"
                    :maxcharacter="11"
                    show-limit-number
                    :style="{ width: '322px' }"
                    :placeholder="$t('pages.transferOut.contactsphonePlaceholder')"
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
    <!-- 迁出登记结束 -->
    <!-- 删除迁出二次确认弹窗，参照下葬页 20260916 新增 -->
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
  name: 'TransferOut',
};
</script>
<script setup lang="ts">
import dayjs from 'dayjs';
import { RollbackIcon, ZoomInIcon, ZoomOutIcon } from 'tdesign-icons-vue-next';
import type { PrimaryTableCol } from 'tdesign-vue-next';
import { MessagePlugin } from 'tdesign-vue-next';
import { computed, nextTick, onActivated, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';

import type { RoomModel } from '@/api/model/roomModel';
import { getIdList } from '@/api/room';
import type { TransferOutModel } from '@/api/transferOut';
import {
  deleteTransferOut,
  getTransferOutListByIdRoom,
  getTransferOutRoomList,
  insertTransferOut,
  updateTransferOut,
} from '@/api/transferOut';
import RoomDetail from '@/components/room-detail/index.vue';
import { BUSINESS_BASIC_FORM_LABEL_WIDTH } from '@/constants';
import type { CardRowArg } from '@/hooks';
import { useCardGrid, usePageSwitch, useParkRoomFilter, usePermission, useRoomDetail, useTabCacheName } from '@/hooks';
import { t, translate } from '@/locales';
import { getCardStatusClass } from '@/utils/cardStatus';
import { formatDate } from '@/utils/date';
import { formatPrice } from '@/utils/format';
import { logError } from '@/utils/logger';

import { FIND_DATA, INITIAL_FORM_DATA, INITIAL_ROOM_DATA } from './constants';

// ============================================================
// 墓位迁出基础页，参照下葬页卡片网格：通用定义 → 列表（筛选/查询/卡片）→ 详情 → 迁出登记（新建/修改）20260916 重构
// ============================================================

// ==================== 通用：权限与视图切换 ====================
// 向tab记录登记组件真实name，修复后端路由name与组件name不一致导致切tab不保活的问题
useTabCacheName('TransferOut');

// 迁出模块权限对象按 idMenu(103106) 精确匹配，权限不足时兼容空对象避免运行时报错
const userInfo = usePermission('103106');

// 下葬状态：未下葬用于区分卡片是否显示“新建迁出”（未下葬墓位无迁出业务，不显示新建）20260916 新增
const INTO_INCOMPLET = 'statusType.intoStatusEnum.incomplet';
// 迁出状态：已迁出。已迁出的墓位显示“修改/删除”，未迁出且已下葬的显示“新建” 20260916 新增
const TRANSFER_OUT_OUT = 'statusType.transferOutStatusEnum.out';
// 未迁出枚举 key：存量墓位 transferOutStatus 字段为 NULL，卡片/表单展示时以此兑底 20260916 新增
const NOT_OUT = 'statusType.transferOutStatusEnum.notOut';
// 卡片状态标签配色：取状态枚举 key 末段(如 sold/out)拼接胶囊标签修饰类
const statusKey = (status?: string) => (status ? String(status).split('.').pop() || '' : '');
// 卡片长文本截断：下葬者/联系人超过7字显示前7字+省略号，悬停 tooltip 展示完整内容
const truncateText = (value?: string | null) => {
  const text = String(value || '');
  return text.length > 7 ? `${text.slice(0, 7)}…` : text;
};
// 是否超过7字需要截断并显示悬停提示
const isOverflow = (value?: string | null) => String(value || '').length > 7;

type TransferOutRoomRow = RoomModel & {
  reserve?: number;
  examine?: number;
  finish?: number;
};
type FilterFormData = typeof FIND_DATA;
type RoomFormData = typeof INITIAL_ROOM_DATA;
type TransferOutFormData = typeof INITIAL_FORM_DATA;

// 视图互斥显示：列表 / 详情 / 迁出登记（新建与修改复用同一表单）20260916 新增
const isListShow = ref(false);
const isDetailShow = ref(false);
const isCreateShow = ref(false);

const formRoomData = ref<RoomFormData>({ ...INITIAL_ROOM_DATA });
const formTransferOutData = ref<TransferOutFormData>({ ...INITIAL_FORM_DATA });

// 视图互斥切换收敛于公共 usePageSwitch，模板引用名保持不变
const { controlPageShow } = usePageSwitch({
  list: isListShow,
  detail: isDetailShow,
  create: isCreateShow,
});

// ==================== 列表：状态与筛选下拉数据 ====================
// 区域由墓位迁出下区域三级菜单经路由meta下发，挂载时读取一次；
// keep-alive按fullPath区分实例，各区域tab互不影响，无需响应式监听 20260916 新增,
const menuRegion = (useRoute().meta.region as string) || '';
const formfindData = ref<FilterFormData>({ ...FIND_DATA, region: menuRegion });
const transferOutCardViewport = ref<HTMLElement | null>(null);

// ==================== 卡片区滚动位置保持（tab 切换往返） ====================
// 页面 keep-alive 保活仅保留数据：失活时组件 DOM 从文档移除，内部滚动容器 scrollTop 随之归零，
// 切回 tab 会回到顶部；改为滚动时实时记录位置，onActivated（tab 切回）时恢复到原滚动行，同墓位业务页 20260926 新增
const transferOutCardScrollTop = ref(0);
const onCardViewportScroll = (e: Event) => {
  transferOutCardScrollTop.value = (e.target as HTMLElement).scrollTop;
};

onActivated(() => {
  // 列表视图且有卡片数据时才恢复；详情/登记视图无卡片区不处理
  if (!isListShow.value || !transferOutCardRows.value.length) {
    return;
  }
  nextTick(() => {
    if (transferOutCardViewport.value) {
      transferOutCardViewport.value.scrollTop = transferOutCardScrollTop.value;
    }
  });
});

// 区域/园区下拉、园区联动、排号去重、查询二次过滤收敛于公共 useParkRoomFilter
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
} = useParkRoomFilter<TransferOutRoomRow>(formfindData, (park, region) => getTransferOutRoomList(park, region));

// ==================== 列表：卡片行分组与缩放 ====================
// 已迁出的墓位不展示（迁出为终态），列表仅保留未迁出墓位供“新建迁出”，
// 迁出记录的修改/删除入口随之不可达 20260921 新增
const visibleTransferOutRoomList = computed(() =>
  searchRoomList.value.filter((item) => item.transferOutStatus !== TRANSFER_OUT_OUT),
);
// 卡片网格（缩放/分组补位/记录数）收敛于公共 useCardGrid，模板引用名保持不变
const {
  zoom: transferOutZoom,
  handleZoomIn,
  handleZoomOut,
  cardRows: rawTransferOutCardRows,
  totalText: listTotalText,
} = useCardGrid(visibleTransferOutRoomList);

// 排序选项：对排号 yNum 升/降序，默认降序；useCardGrid 内行组固定按排号升序分组，
// 降序时反转行组（组内序号顺序不变），升序保持原序，同墓位业务页 20260925 新增
const transferOutCardRows = computed(() =>
  formfindData.value.sortOrder === 'asc'
    ? rawTransferOutCardRows.value
    : rawTransferOutCardRows.value.slice().reverse(),
);

// ==================== 列表：查询与筛选事件 ====================
// 按园区+区域请求墓位列表，加载完成后才置 hasQueried，避免先闪现“暂无数据”再切换为卡片

onMounted(() => {
  getRegionData();
  getParkData();
  // 列表不再默认查询展示，需用户选择园区后手动查询
  setTimeout(() => {
    controlPageShow('list');
  }, 380);
});

// ==================== 详情 ====================
// 详情统一由 room-detail 组件展示：销售页/预定页/下葬页共用同一详情视图，数据加载收敛于 useRoomDetail
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

// 点击卡片详情：拉取单条墓位数据与活动预定/销售/下葬记录后进入详情视图
const handleClickDetail = async (row: CardRowArg<TransferOutRoomRow>) => {
  try {
    const currentRow = row.row ?? row;
    await loadDetail(currentRow.idRoom);
    controlPageShow('detail');
  } catch (e) {
    logError(e);
  }
};

// 详情关闭：清空详情数据并回到列表
const ClickDetailClose = () => {
  clearDetail();
  controlPageShow('list');
};

// ==================== 迁出登记：新建 / 修改 / 删除 ====================
// 删除模式：复用迁出登记视图，仅展示墓穴信息+记录列表(操作列删除)，隐藏可编辑表单与提交区 20260916 新增
const isDeleteMode = ref(false);
// 表单标题随模式切换：删除 > 修改 > 新建 20260916 新增
const formTitle = computed(() => {
  if (isDeleteMode.value) {
    return translate('pages.transferOut.deleteTitle');
  }
  return formTransferOutData.value.idTransfer !== 0
    ? translate('pages.transferOut.modifyTitle')
    : translate('pages.transferOut.creatTitle');
});

// 修改模式下在墓穴信息下方以列表展示“选择迁出记录”；transferOutRecords 为该墓位全部活动迁出记录（后端按 idTransfer DESC，[0] 为最新）20260916 新增
const isModifyMode = ref(false);
const transferOutRecords = ref<TransferOutModel[]>([]);
// 列表单选选中的迁出记录 idTransfer（默认最新一条），及展示完整信息的列定义 20260916 新增
const selectedTransferOutKeys = ref<Array<string | number>>([]);
const modifyColumns: PrimaryTableCol[] = [
  { title: translate('pages.transferOut.transferOutDate'), colKey: 'transferOutDate' },
  { title: translate('pages.transferOut.destination'), colKey: 'destination', ellipsis: true },
  { title: translate('pages.transferOut.reason'), colKey: 'reason', ellipsis: true },
  // 选择列（单选 radio）调整至最后一列 20260916 新增
  { title: translate('pages.transferOut.select'), colKey: 'row-select', type: 'single', width: 50 },
];

// 删除页记录列表列：与修改页一致，但末列由“选择”单选列改为“操作”列（逐行删除按钮）20260916 新增
const deleteColumns: PrimaryTableCol[] = [
  { title: translate('pages.transferOut.transferOutDate'), colKey: 'transferOutDate' },
  { title: translate('pages.transferOut.destination'), colKey: 'destination', ellipsis: true },
  { title: translate('pages.transferOut.reason'), colKey: 'reason', ellipsis: true },
  { title: translate('operate.operation'), colKey: 'op', width: 90 },
];

const resetFormData = (idRoom = 0) => {
  formTransferOutData.value = {
    ...INITIAL_FORM_DATA,
    idRoom,
    // 迁出日期默认当天：不依赖常量模块加载时的静态值，避免页面跨天驻留后日期过期；
    // 用 dayjs 取本地时区日期，不可用 toISOString(UTC) 否则东八区凌晨会差一天 20260916 新增
    transferOutDate: dayjs().format('YYYY-MM-DD'),
  };
};

// 用选中的迁出记录回填表单（供修改），字段与 INITIAL_FORM_DATA 结构一致 20260916 新增
const fillFormData = (record: TransferOutModel) => {
  formTransferOutData.value = {
    idTransfer: record.idTransfer,
    idRoom: record.idRoom,
    transferOutDate: formatDate(record.transferOutDate),
    destination: record.destination ?? '',
    reason: record.reason ?? '',
    contacts: record.contacts ?? '',
    contactsphone: record.contactsphone ?? '',
  };
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

// 点击卡片“新建”：加载墓位信息并重置为新增迁出记录 20260916 新增,
const handleClickCreate = async (row: CardRowArg<TransferOutRoomRow>) => {
  const currentRow = row.row ?? row;
  isModifyMode.value = false;
  isDeleteMode.value = false;
  transferOutRecords.value = [];
  selectedTransferOutKeys.value = [];
  resetFormData(currentRow.idRoom);
  await getRoomID(currentRow.idRoom);
  controlPageShow('create');
};

// 取消：重置迁出表单，保持当前墓位
const onReset = () => {
  resetFormData(formRoomData.value.idRoom);
};

// 迁出登记关闭：清空数据并回到列表
const ClickCreateClose = () => {
  formRoomData.value = { ...INITIAL_ROOM_DATA };
  resetFormData();
  isModifyMode.value = false;
  isDeleteMode.value = false;
  transferOutRecords.value = [];
  selectedTransferOutKeys.value = [];
  controlPageShow('list');
};

// ==================== 卡片：修改 / 删除（多条迁出记录选择）====================
// 删除二次确认弹窗，提示文案参照墓区下葬页：删除后，园区+编号 + 迁出信息将被清空 20260916 新增
const confirmVisible = ref(false);
const deleteTarget = ref<{ idTransfer: number; idRoom: number } | null>(null);
const dialogHeader = translate('operate.deleteDataCPrompt');
const confirmBody = computed(() => {
  if (!deleteTarget.value) {
    return '';
  }
  const { park, xyNumber } = formRoomData.value;
  return `${translate('operate.deleteDataAPrompt')}${park} ${xyNumber}${translate('pages.transferOut.deleteInfoPrompt')}`;
});
const onCancel = () => {
  deleteTarget.value = null;
};

// 列表单选迁出记录：选中行变化时用该记录回填下方修改表单 20260916 新增
const onSelectTransferOutRecord = (keys: Array<string | number>) => {
  const id = Number(keys[0]);
  const record = transferOutRecords.value.find((item) => item.idTransfer === id);
  if (record) {
    fillFormData(record);
  }
};

// 点击卡片“修改”：进入修改页，墓穴信息下方列出全部迁出记录，默认选中最后一条（最新）20260916 新增,
const handleClickModify = async (row: CardRowArg<TransferOutRoomRow>) => {
  const currentRow = row.row ?? row;
  try {
    const { list } = await getTransferOutListByIdRoom(currentRow.idRoom);
    if (!list || list.length === 0) {
      MessagePlugin.warning(translate('pages.transferOut.noRecord'));
      return;
    }
    // 后端已按 idTransfer DESC 排序，list[0] 即最后一条（最新）迁出记录，默认单选它
    transferOutRecords.value = list;
    isModifyMode.value = true;
    isDeleteMode.value = false;
    resetFormData(currentRow.idRoom);
    await getRoomID(currentRow.idRoom);
    fillFormData(list[0]);
    selectedTransferOutKeys.value = [list[0].idTransfer];
    controlPageShow('create');
  } catch (e) {
    logError(e);
  }
};

// 点击卡片“删除”：进入删除页（复用迁出登记视图 isDeleteMode），墓穴信息下方列出全部迁出记录，操作列逐行删除 20260916 新增
const handleClickDelete = async (row: CardRowArg<TransferOutRoomRow>) => {
  const currentRow = row.row ?? row;
  try {
    const { list } = await getTransferOutListByIdRoom(currentRow.idRoom);
    if (!list || list.length === 0) {
      MessagePlugin.warning(translate('pages.transferOut.noRecord'));
      return;
    }
    transferOutRecords.value = list;
    isModifyMode.value = false;
    isDeleteMode.value = true;
    selectedTransferOutKeys.value = [];
    resetFormData(currentRow.idRoom);
    await getRoomID(currentRow.idRoom);
    controlPageShow('create');
  } catch (e) {
    logError(e);
  }
};

// 删除页操作列“删除”：记录待删除目标并打开二次确认 20260916 新增,
const onSelectRecord = (record: TransferOutModel) => {
  deleteTarget.value = { idTransfer: record.idTransfer, idRoom: record.idRoom };
  confirmVisible.value = true;
};

// 确认删除：软删除选中的迁出记录，无剩余记录时后端回置墓位迁出状态为未迁出；成功后刷新列表并关闭删除页 20260916 新增
const onConfirmDelete = async () => {
  if (!deleteTarget.value) {
    return;
  }
  const { idTransfer, idRoom } = deleteTarget.value;
  deleteTarget.value = null;
  confirmVisible.value = false;
  try {
    await deleteTransferOut(idTransfer, idRoom);
    MessagePlugin.success(translate('operate.deleteSuccessPrompt'));
    await getRoomData();
    ClickCreateClose();
  } catch (e) {
    logError(e);
  }
};

// 提交迁出登记：idTransfer 为0走新增，否则走修改；成功后刷新列表 20260916 新增,

const ClickSubmit = async () => {
  if (formTransferOutData.value.transferOutDate === '' || formTransferOutData.value.transferOutDate === null) {
    return MessagePlugin.warning(translate('pages.transferOut.transferOutDatePlaceholder'));
  }
  if (formTransferOutData.value.destination === '') {
    return MessagePlugin.warning(translate('pages.transferOut.destinationPlaceholder'));
  }

  if (formTransferOutData.value.idTransfer === 0) {
    try {
      await insertTransferOut(formTransferOutData.value);
      MessagePlugin.success(translate('operate.createdSuccessPrompt'));
      await getRoomData();
      ClickCreateClose();
    } catch (e) {
      logError(e);
      MessagePlugin.error(translate('operate.createdFailedPrompt'));
    }
  } else {
    try {
      await updateTransferOut(formTransferOutData.value);
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

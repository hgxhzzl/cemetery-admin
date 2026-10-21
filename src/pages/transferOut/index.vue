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

          <!-- 卡片区 + 底部工具行统一交给通用 RoomCardList 组件（S1a 并入，与 buried/reserve/contacts 同构）：
               信息行由 cardMetaFields 配置承接（购墓人/下葬者(截断)/联系人(截断)/管理期(date)/备注(截断)），截断口径 dots（前6字+....）
               同本页原实现；每卡状态外框经 cardClass 下发（前缀 roomcard）；无状态胶囊（本页胶囊行已改备注行）；
               工具行右侧颜色图例经 toolbar-legend 插槽注入（缩放控件由组件统一持有），滚动位置经 @scroll/restoreScroll 保持 20261020 P2 S1a -->
          <room-card-list
            v-if="hasQueried && transferOutCardRows.length"
            ref="transferOutRoomCardRef"
            :rows="transferOutCardRows"
            :zoom="transferOutZoom"
            :total-text="listTotalText"
            :meta-fields="cardMetaFields"
            :actions="cardActions"
            :card-class="cardStatusClass"
            truncate-mode="dots"
            @zoom-in="handleZoomIn"
            @zoom-out="handleZoomOut"
            @action="onCardAction"
            @scroll="transferOutCardScrollTop = $event"
          >
            <!-- 工具行右侧：仅需注入外框颜色图例（未销售橙/已预定黄/已销售绿/已下葬蓝/管理到期浅红，同墓位业务页）；
                 放大/缩小卡片控件已交 RoomCardList 组件统一持有 20261020 P2 S1a -->
            <template #toolbar-legend>
              <div class="transferOut-list-toolbar__legend">
                <span v-if="isCardStateEnabled('unsold')" class="transferOut-legend-item">
                  <i class="transferOut-legend-item__swatch transferOut-legend-item__swatch--unsold" />
                  {{ $t('statusType.saleStatusEnum.unsold') }}
                </span>
                <span v-if="isCardStateEnabled('reserved')" class="transferOut-legend-item">
                  <i class="transferOut-legend-item__swatch transferOut-legend-item__swatch--reserved" />
                  {{ $t('statusType.reserveStatusEnum.reserved') }}
                </span>
                <span v-if="isCardStateEnabled('sold')" class="transferOut-legend-item">
                  <i class="transferOut-legend-item__swatch transferOut-legend-item__swatch--sold" />
                  {{ $t('statusType.saleStatusEnum.sold') }}
                </span>
                <span v-if="isCardStateEnabled('buried')" class="transferOut-legend-item">
                  <i class="transferOut-legend-item__swatch transferOut-legend-item__swatch--buried" />
                  {{ $t('statusType.intoStatusEnum.buried') }}
                </span>
                <span v-if="isCardStateEnabled('expired')" class="transferOut-legend-item">
                  <i class="transferOut-legend-item__swatch transferOut-legend-item__swatch--expired" />
                  {{ $t('pages.gravePlotBusiness.legendExpired') }}
                </span>
              </div>
            </template>
          </room-card-list>
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
      :transfer-out="detailTransferOut"
      @close="ClickDetailClose"
    />
    <!-- 详情结束 -->
    <!-- 迁出登记（新建/修改/删除）开始 -->
    <div v-if="isCreateShow">
      <t-form
        class="base-form"
        :data="formTransferOutData"
        label-align="top"
        :label-width="100"
        required-mark-position="right"
      >
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
              <!-- 只读墓位信息行已拆至子组件 TransferOutRoomInfoBlock（20261020 P2 S2 巨石拆分批二）：纯展示，数据经 props 传入 formRoomData；
                   price 经 formatPrice、迁出状态 NULL 兑底 NOT_OUT、文字色 .des span 就近由子组件 scoped 保证 -->
              <transfer-out-room-info-block :room-data="formRoomData" />

              <!-- 修改/删除模式：墓位信息下方以列表展示全部迁出记录；修改用单选列回填表单，删除用操作列逐行删除 20260916 新增 -->
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

              <!-- 可编辑字段块（迁出日期/迁往何处/原因/联系人/电话/身份证号）已拆至子组件 TransferOutFormView（20261020 P2 S2 巨石拆分批一）：
                   字段列经 inject 共享本页 formTransferOutData（provide/inject），原各列统一 v-if="!isDeleteMode" 上提至挂载标签；联系人「选择」经事件回本页 handleOpenContactsSelect -->
              <transfer-out-form-view v-if="!isDeleteMode" @open-contacts="handleOpenContactsSelect" />
            </t-row>
          </div>
        </div>

        <div v-if="!isDeleteMode" class="form-submit-container">
          <div class="form-submit-sub">
            <div class="form-submit-left">
              <t-button theme="primary" class="form-submit-confirm" :disabled="submitting" @click="ClickSubmit()">
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
    <!-- 联系人选择页：联系人字段“选择”按钮进入，样式/交互同墓位业务页下葬，墓位信息 + 活动联系人表格，
         操作列逐行“选择”回填联系人/电话/身份证号并返回迁出登记表单 20261005 新增 -->
    <transfer-out-contacts-select-view
      v-if="isContactsSelectShow"
      :room="formRoomData"
      :records="contactsRecords"
      :columns="contactsColumns"
      :form-data="formTransferOutData"
      @select="onSelectContact"
      @back="handleCloseContactsSelect"
    />
    <!-- 联系人选择页结束 20261005 新增 -->
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
import { RollbackIcon } from 'tdesign-icons-vue-next';
import type { PrimaryTableCol } from 'tdesign-vue-next';
import { MessagePlugin } from 'tdesign-vue-next';
import { computed, nextTick, onActivated, onMounted, provide, ref } from 'vue';
import { useRoute } from 'vue-router';

import { getContactsList } from '@/api/contacts';
import type { ContactsModel } from '@/api/model/contactsModel';
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
import RoomCardList from '@/components/room-card-list/index.vue';
import type { RoomCardAction, RoomCardMetaField } from '@/components/room-card-list/types';
import RoomDetail from '@/components/room-detail/index.vue';
import { BUSINESS_BASIC_FORM_LABEL_WIDTH } from '@/constants';
import type { CardRowArg } from '@/hooks';
import {
  useCardGrid,
  usePageSwitch,
  useParkRoomFilter,
  usePermission,
  useRoomDetail,
  useSubmitGuard,
  useTabCacheName,
} from '@/hooks';
import { translate } from '@/locales';
import { extractServerError } from '@/utils/apiError';
import { getCardStatusClass } from '@/utils/cardStatus';
import { isCardStateEnabled } from '@/utils/cardTheme';
import { formatDate } from '@/utils/date';
import { logError } from '@/utils/logger';

import TransferOutContactsSelectView from './components/TransferOutContactsSelectView.vue';
import TransferOutFormView from './components/TransferOutFormView.vue';
import TransferOutRoomInfoBlock from './components/TransferOutRoomInfoBlock.vue';
import { FIND_DATA, INITIAL_FORM_DATA, INITIAL_ROOM_DATA, transferOutFormDataKey } from './constants';

// ============================================================
// 墓位迁出基础页，参照下葬页卡片网格：通用定义 → 列表（筛选/查询/卡片）→ 详情 → 迁出登记（新建/修改）20260916 重构
// ============================================================

// ==================== 通用：权限与视图切换 ====================
// 向tab记录登记组件真实name，修复后端路由name与组件name不一致导致切tab不保活的问题
useTabCacheName('TransferOut');

// 迁出模块权限对象按稳定菜单 name('transferOut') 匹配（菜单排序调整致 id 变化时不需改代码），权限不足时兼容空对象避免运行时报错 20261020 P2 C1 改按 name
const userInfo = usePermission('transferOut');

// 下葬状态：未下葬用于区分卡片是否显示“新建迁出”（未下葬墓位无迁出业务，不显示新建）20260916 新增
const INTO_INCOMPLET = 'statusType.intoStatusEnum.incomplet';
// 迁出状态：已迁出。已迁出的墓位显示“修改/删除”，未迁出且已下葬的显示“新建” 20260916 新增
const TRANSFER_OUT_OUT = 'statusType.transferOutStatusEnum.out';
// 未迁出兑底枚举 NOT_OUT 已下沉至 ./constants（供拆出的信息行子组件共享），本页不再本地声明 20261020 P2 S2 拆分
// 卡片状态胶囊行已改为备注行，配色函数 statusKey 随之移除（销售/迁出状态仍随行数据返回，仅不再展示）20261004 调整
// 卡片长文本截断（超过7字前6字+....+tooltip）与溢出判定已随卡片区迁入通用 RoomCardList（truncate-mode="dots"），本页不再本地实现 20261020 P2 S1a

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
// 联系人选择页显隐：从迁出登记表单联系人字段的“选择”按钮进入，与列表/详情/登记页互斥 20261005 新增
const isContactsSelectShow = ref(false);

const formRoomData = ref<RoomFormData>({ ...INITIAL_ROOM_DATA });
const formTransferOutData = ref<TransferOutFormData>({ ...INITIAL_FORM_DATA });
// 向拆出的 TransferOutFormView 子视图提供表单数据 Ref（提交/回填仍读本页同一份），v-model 编辑即写回 20261020 P2 S2 拆分
provide(transferOutFormDataKey, formTransferOutData);

// 视图互斥切换收敛于公共 usePageSwitch，模板引用名保持不变
const { controlPageShow, scheduleControlPageShow } = usePageSwitch({
  list: isListShow,
  detail: isDetailShow,
  create: isCreateShow,
  contactsSelect: isContactsSelectShow,
});

// ==================== 列表：状态与筛选下拉数据 ====================
// 区域由墓位迁出下区域三级菜单经路由meta下发，挂载时读取一次；
// keep-alive按fullPath区分实例，各区域tab互不影响，无需响应式监听 20260916 新增,
const menuRegion = (useRoute().meta.region as string) || '';
const formfindData = ref<FilterFormData>({ ...FIND_DATA, region: menuRegion });
// 卡片区已迁入通用 RoomCardList，滚动容器在子组件内部，经组件 expose 的 restoreScroll 恢复（tab 往返保持滚动行）20261020 P2 S1a
const transferOutRoomCardRef = ref<{ restoreScroll: (top: number) => void } | null>(null);

// ==================== 卡片区滚动位置保持（tab 切换往返） ====================
// 页面 keep-alive 保活仅保留数据：失活时组件 DOM 从文档移除，内部滚动容器 scrollTop 随之归零，
// 切回 tab 会回到顶部；卡片区滚动位置经子组件 @scroll 实时上抛记录，onActivated（tab 切回）时经 restoreScroll 恢复 20260926 新增 20261020 S1a 迁子组件
const transferOutCardScrollTop = ref(0);

onActivated(() => {
  // 列表视图且有卡片数据时才恢复；详情/登记视图无卡片区不处理
  if (!isListShow.value || !transferOutCardRows.value.length) {
    return;
  }
  nextTick(() => {
    transferOutRoomCardRef.value?.restoreScroll(transferOutCardScrollTop.value);
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
  scheduleControlPageShow('list');
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
  detailTransferOut,
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
// 删除模式：复用迁出登记视图，仅展示墓位信息+记录列表(操作列删除)，隐藏可编辑表单与提交区 20260916 新增
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

// 修改模式下在墓位信息下方以列表展示“选择迁出记录”；transferOutRecords 为该墓位全部活动迁出记录（后端按 idTransfer DESC，[0] 为最新）20260916 新增
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
    // 联系人身份证号回填：库列 contactsIDCard 20261005 新增
    contactsIDCard: record.contactsIDCard ?? '',
  };
};

// ==================== 联系人选择页（联系人字段“选择”按钮进入，功能/样式同墓位业务页下葬）====================
// 该墓位活动联系人记录与展示列（联系人/电话/身份证号 + 操作列“选择”），数据源 getContactsList 20261005 新增
const contactsRecords = ref<ContactsModel[]>([]);
const contactsColumns: PrimaryTableCol[] = [
  { title: translate('pages.contacts.contacts'), colKey: 'contacts' },
  { title: translate('pages.contacts.contactsPhone'), colKey: 'contactsPhone', width: 140 },
  { title: translate('pages.contacts.contactsIDCard'), colKey: 'contactsIDCard', width: 180 },
  { title: translate('operate.operation'), colKey: 'op', width: 90 },
];

// 打开联系人选择页：查该墓位活动联系人，无记录提示且不跳转（同墓位业务页下葬）20261005 新增
const handleOpenContactsSelect = async () => {
  const { idRoom } = formTransferOutData.value;
  try {
    const { list } = await getContactsList(idRoom);
    if (!list || list.length === 0) {
      return MessagePlugin.warning(translate('pages.transferOut.noContact'));
    }
    contactsRecords.value = list;
    controlPageShow('contactsSelect');
  } catch (e) {
    logError(e);
    // 失败必须让用户看见:此前只写控制台,界面表现为“点了没反应”(审查修复 20261021 P2),
    MessagePlugin.error(extractServerError(e) || translate('operate.listLoadFailedPrompt'));
  }
};

// 选择联系人：回填联系人/电话/身份证号（contacts 表列 contactsPhone 映射表单 contactsphone），返回迁出登记表单 20261005 新增
const onSelectContact = (row: ContactsModel) => {
  formTransferOutData.value.contacts = row.contacts ?? '';
  formTransferOutData.value.contactsphone = row.contactsPhone ?? '';
  formTransferOutData.value.contactsIDCard = row.contactsIDCard ?? '';
  contactsRecords.value = [];
  controlPageShow('create');
};

// 关闭联系人选择页：返回迁出登记表单，不改动已填内容 20261005 新增
const handleCloseContactsSelect = () => {
  contactsRecords.value = [];
  controlPageShow('create');
};

const getRoomID = async (id: number) => {
  try {
    const { list } = await getIdList(id);
    // 空数组守卫：墓位记录被他人删除后 list[0] 为 undefined，回填表单会在渲染期解构报错（审查修复 20261020）
    if (!list || list.length === 0) {
      return;
    }
    const dataQuery = list[0];
    formRoomData.value = dataQuery;
  } catch (e) {
    logError(e);
    // 失败必须让用户看见:此前只写控制台,界面表现为“点了没反应”(审查修复 20261021 P2),
    MessagePlugin.error(extractServerError(e) || translate('operate.listLoadFailedPrompt'));
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

// 点击卡片“修改”：进入修改页，墓位信息下方列出全部迁出记录，默认选中最后一条（最新）20260916 新增,
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

// 点击卡片“删除”：进入删除页（复用迁出登记视图 isDeleteMode），墓位信息下方列出全部迁出记录，操作列逐行删除 20260916 新增
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

// ==================== 卡片列表（RoomCardList 子组件）差异配置 ====================
// S1a 并入通用 RoomCardList：本页给出信息行/操作/状态外框配置（无状态胶囊），
// 点击详情/新建/修改/删除的处理逻辑一字未改，经 onCardAction 回本页分发 20261020 P2 S1a
// 信息行 购墓人/下葬者(截断)/联系人(截断)/管理期(date)/备注(截断)，截断口径 dots 同原实现
const cardMetaFields: RoomCardMetaField[] = [
  { labelKey: 'pages.room.buyer', field: 'buyer', format: 'text' },
  { labelKey: 'pages.room.buriedPerson', field: 'deceased', format: 'truncate' },
  { labelKey: 'pages.room.contacts', field: 'contacts', format: 'truncate' },
  { labelKey: 'pages.adminfee.period', field: 'endDate', format: 'date' },
  { labelKey: 'pages.room.remark', field: 'remark', format: 'truncate' },
];
// 每卡状态外框：前缀改中性 roomcard 以匹配 RoomCardList scoped 内实体化的外框类（色值仍走全局 card-color 变量，视觉不变）
const cardStatusClass = (row: RoomModel) => getCardStatusClass('roomcard', row, { withUnsold: true });
// 操作 详情/新建(迁出)/修改/删除：新建按“已下葬且未迁出+新建权限”，修改/删除按“已迁出+对应权限”门控（口径同原内联卡片）
const cardActions: RoomCardAction[] = [
  { name: 'detail', labelKey: 'operate.detail', theme: 'primary' },
  {
    name: 'create',
    labelKey: 'operate.create',
    theme: 'danger',
    visible: (row) =>
      row.intoStatus !== INTO_INCOMPLET && row.transferOutStatus !== TRANSFER_OUT_OUT && userInfo.useCreate === 1,
  },
  {
    name: 'modify',
    labelKey: 'operate.modify',
    theme: 'primary',
    visible: (row) => row.transferOutStatus === TRANSFER_OUT_OUT && userInfo.useModify === 1,
  },
  {
    name: 'delete',
    labelKey: 'operate.delete',
    theme: 'danger',
    visible: (row) => row.transferOutStatus === TRANSFER_OUT_OUT && userInfo.useDelete === 1,
  },
];
// RoomCardList 上抛的操作名回本页分发到既有处理函数（处理逻辑一字未改）20261020 P2 S1a
const onCardAction = (name: string, row: RoomModel) => {
  switch (name) {
    case 'detail':
      handleClickDetail(row);
      break;
    case 'create':
      handleClickCreate(row);
      break;
    case 'modify':
      handleClickModify(row);
      break;
    case 'delete':
      handleClickDelete(row);
      break;
    default:
      break;
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
    // 失败必须让用户看见:此前只写控制台,界面表现为“点了没反应”(审查修复 20261021 P2),
    MessagePlugin.error(extractServerError(e) || translate('operate.deleteFailedPrompt'));
  }
};

// 提交迁出登记：idTransfer 为0走新增，否则走修改；成功后刷新列表 20260916 新增,

// 确认提交防重复：首个 await 前无任何锁，双击/慢网络会并发发出两次写接口→重复记录；submitting 同步上锁并在 finally 复位 20261004 新增
const { submitting, run } = useSubmitGuard();
const ClickSubmit = () => run(submitCore);
const submitCore = async () => {
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
      MessagePlugin.error(extractServerError(e) || translate('operate.createdFailedPrompt'));
    }
  } else {
    try {
      await updateTransferOut(formTransferOutData.value);
      MessagePlugin.success(translate('operate.modifySuccessPrompt'));
      await getRoomData();
      ClickCreateClose();
    } catch (e) {
      logError(e);
      MessagePlugin.error(extractServerError(e) || translate('operate.modifyFailedPrompt'));
    }
  }
};
</script>
<style lang="less" scoped>
@import './index.less';
</style>

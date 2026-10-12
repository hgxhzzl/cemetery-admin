<template>
  <div>
    <!-- 列表开始 -->
    <div v-show="isListShow" class="table-tree-container">
      <div class="list-tree-content reserve-page-content">
        <div
          class="list-common-table reserve-list-panel"
          :class="{ 'reserve-list-panel--full': hasQueried && reserveCardRows.length }"
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
                  <!-- 区域由墓区预定下区域三级菜单经路由下发：下拉框仅展示当前区域且不可用（不可切换），形态与宽度均同墓区业务页（收窄 120px）20261010 新增 -->
                  <t-form-item
                    :label="$t('pages.room.region')"
                    name="region"
                    class="cms-filter-item reserve-filter-item-narrow"
                  >
                    <t-select
                      v-model="formfindData.region"
                      class="demo-select-base cms-filter-control reserve-filter-control-narrow"
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
                  <!-- 排序选项：对排号升/降序展示卡片行组，默认降序；位置/样式与墓区业务页筛选行末项一致（窄项自适应宽，不占 basic 286px） 20261010 新增 -->
                  <t-form-item
                    :label="$t('pages.reserve.sortOrder')"
                    name="sortOrder"
                    class="cms-filter-item reserve-filter-item-sort"
                  >
                    <t-radio-group v-model="formfindData.sortOrder" variant="default-filled" size="small">
                      <t-radio-button value="asc">{{ $t('pages.reserve.sortAsc') }}</t-radio-button>
                      <t-radio-button value="desc">{{ $t('pages.reserve.sortDesc') }}</t-radio-button>
                    </t-radio-group>
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

          <!-- 查询后无数据时不展示卡片区，仅在筛选表单下方居中提示 -->
          <div v-if="hasQueried && !reserveCardRows.length" class="reserve-no-data">暂无数据</div>

          <div v-if="hasQueried && reserveCardRows.length" class="reserve-list-body">
            <div ref="reserveCardViewport" class="table-container reserve-card-layout">
              <div v-if="reserveCardRows.length" class="reserve-card-rows" :style="{ zoom: reserveZoom }">
                <div v-for="rowGroup in reserveCardRows" :key="rowGroup.yNum" class="reserve-card-row">
                  <div class="reserve-card-grid">
                    <div
                      v-for="card in rowGroup.cards"
                      :key="`${rowGroup.yNum}-${card.xNum}`"
                      class="reserve-card"
                      :class="{ 'reserve-card--empty': card.placeholder }"
                    >
                      <template v-if="card.placeholder">
                        <!-- 空位卡序号与正常卡同样顶部对齐 -->
                        <div class="reserve-card__header">
                          <div class="reserve-card__serial">{{ rowGroup.yNum }} 排 {{ card.xNum }} 号</div>
                        </div>
                        <div class="reserve-card__body">
                          <div class="reserve-card__empty-text">空位</div>
                        </div>
                      </template>
                      <template v-else>
                        <div class="reserve-card__header">
                          <!-- 首行编号取 xyNumber，缺失时回退“排/号”拼接；墓位类型为右侧胶囊，口径同墓位迁出页卡片 20261012 调整 -->
                          <div class="reserve-card__serial">
                            {{ card.row.xyNumber || `${rowGroup.yNum} 排 ${card.row.xNum} 号` }}
                          </div>
                          <span class="reserve-card__type">{{ $t(card.row.roomType).trim() }}</span>
                        </div>
                        <div class="reserve-card__body">
                          <!-- 卡片内容参照墓位迁出页布局，行为：购墓人/预定人/预定期/备注（去掉原规格/价格/状态胶囊行），
                               长文本超 7 字截断 + 悬停提示、无值统一显示“无”；按钮区维持本页原有预定/修改/删除口径不变 20261012 调整,
                               管理期行于 20261012 去掉（预定阶段不关注管理费到期）,
                               预定人行：下葬者 改名并改取 reserve.liaison（后端 /canSale LEFT JOIN 活动预定记录）20261012 调整,
                               手机号行于 20261012 去掉（卡片不展示预定人电话；后端 /canSale 仍回传 reserveLiaisonPhone 作为多余列，不影响其它展示） -->
                          <div class="reserve-card__meta">
                            <span class="reserve-card__meta-label">{{ $t('pages.room.buyer') }}</span>
                            <span class="reserve-card__meta-value">{{ card.row.buyer || $t('common.none') }}</span>
                          </div>
                          <div class="reserve-card__meta">
                            <span class="reserve-card__meta-label">{{ $t('pages.reserve.reserver') }}</span>
                            <t-tooltip
                              v-if="isOverflow(card.row.reserveLiaison)"
                              :content="String(card.row.reserveLiaison)"
                            >
                              <span class="reserve-card__meta-value">{{ truncateText(card.row.reserveLiaison) }}</span>
                            </t-tooltip>
                            <span v-else class="reserve-card__meta-value">{{
                              card.row.reserveLiaison || $t('common.none')
                            }}</span>
                          </div>
                          <!-- 预定期（room.reservationExpireDate，活动预定记录的限期副本）：位置、标签、写法均同墓区业务页卡片对应行，
                               无活动预定/未填限期时 formatDate 回空串、默认展示“无” 20261012 新增 -->
                          <div class="reserve-card__meta">
                            <span class="reserve-card__meta-label">
                              {{ $t('pages.gravePlotBusiness.reservationPeriod') }}
                            </span>
                            <span class="reserve-card__meta-value">{{
                              formatDate(card.row.reservationExpireDate) || $t('common.none')
                            }}</span>
                          </div>
                          <div class="reserve-card__meta">
                            <span class="reserve-card__meta-label">{{ $t('pages.room.remark') }}</span>
                            <t-tooltip v-if="isOverflow(card.row.remark)" :content="String(card.row.remark)">
                              <span class="reserve-card__meta-value">{{ truncateText(card.row.remark) }}</span>
                            </t-tooltip>
                            <span v-else class="reserve-card__meta-value">{{
                              card.row.remark || $t('common.none')
                            }}</span>
                          </div>
                        </div>
                        <div class="reserve-card__actions">
                          <t-link theme="primary" @click="handleClickDetail(card.row)">{{
                            $t('operate.detail')
                          }}</t-link>
                          <!-- 未销售墓位才可预定，权限沿用新增权限 useCreate，标签按新增权限显示为新建 20260907 修改,
                               已预定墓位不再出新建：预定只置 reserveStatus、销售状态保持未销售，不加这层判断会
                               与「修改/删除」并存，重复登记会把原预定覆盖掉 20261011 修改 -->
                          <t-link
                            v-if="
                              card.row.saleStatus === 'statusType.saleStatusEnum.unsold' &&
                              card.row.reserveStatus !== 'statusType.reserveStatusEnum.reserved' &&
                              userInfo.useCreate === 1
                            "
                            theme="danger"
                            @click="handleClickReserve(card.row)"
                          >
                            {{ $t('operate.create') }}
                          </t-link>
                          <!-- 已预定墓位按修改权限显示“修改”，点击进入预定登记表单回填 20260907 新增 -->
                          <t-link
                            v-if="
                              card.row.reserveStatus === 'statusType.reserveStatusEnum.reserved' &&
                              userInfo.useModify === 1
                            "
                            theme="primary"
                            @click="handleClickModify(card.row)"
                          >
                            {{ $t('operate.modify') }}
                          </t-link>
                          <!-- 已预定墓位按删除权限显示“删除”，点击弹出二次确认 20260907 新增 -->
                          <t-link
                            v-if="
                              card.row.reserveStatus === 'statusType.reserveStatusEnum.reserved' &&
                              userInfo.useDelete === 1
                            "
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

          <!-- 列表底部工具行：左侧记录数，右侧放大/缩小卡片列表 -->
          <div v-if="hasQueried && reserveCardRows.length" class="reserve-list-toolbar">
            <span>{{ listTotalText }}</span>
            <span class="reserve-list-toolbar__zoom">
              <zoom-in-icon class="reserve-list-toolbar__zoom-icon" @click="handleZoomIn" />
              <zoom-out-icon class="reserve-list-toolbar__zoom-icon" @click="handleZoomOut" />
            </span>
          </div>

          <!-- 删除预定二次确认弹窗，参照墓区设置页 20260907 新增 -->
          <t-dialog
            v-model:visible="confirmVisible"
            :header="dialogHeader"
            :body="confirmBody"
            :on-cancel="onCancel"
            @confirm="onConfirmDelete"
          />
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
    <!-- 预定开始 -->
    <div v-if="isCreateShow">
      <t-form class="base-form" :data="formReserveData" label-align="top" :label-width="100">
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
              <!-- 区域信息不在预定登记表单展示 20260907 修改 -->
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
                <!-- priceString 列已删，墓位价格由数值 price 千分位格式化 20260910 修改 -->
                <span>{{ $t('pages.room.price') }} : {{ formatPrice(formRoomData.price) }}</span>
              </t-col>
              <t-col :span="6">
                <span>{{ $t('pages.room.reserveStatus') }} : {{ t(formRoomData.reserveStatus) }}</span>
              </t-col>
              <t-col :span="6">
                <span>{{ $t('pages.room.saleStatus') }} : {{ t(formRoomData.saleStatus) }}</span>
              </t-col>
              <t-col :span="6">
                <span>{{ $t('pages.room.intoStatus') }} : {{ t(formRoomData.intoStatus) }}</span>
              </t-col>
              <t-col :span="6">
                <!-- 必填星号靠 required-mark 渲染：t-form-item 并无 required 这个 prop(写 :required 不报错也不生效)，
                     统一改用与预定限期/墓区业务页一致的 required-mark 20261011 修复 -->
                <t-form-item :required-mark="true" :label="$t('pages.reserve.liaison')" name="liaison">
                  <t-input
                    v-model="formReserveData.liaison"
                    :maxcharacter="20"
                    show-limit-number
                    :style="{ width: '322px' }"
                    :placeholder="$t('pages.reserve.liaisonPlaceholder')"
                  />
                </t-form-item>
              </t-col>
              <t-col :span="6">
                <!-- 电话同为必填，与联系人同样加星，提交提示见 submitCore 20261011 新增 -->
                <t-form-item :required-mark="true" :label="$t('pages.reserve.liaisonPhone')" name="liaisonPhone">
                  <t-input
                    v-model="formReserveData.liaisonPhone"
                    :maxcharacter="11"
                    show-limit-number
                    :style="{ width: '322px' }"
                    :placeholder="$t('pages.reserve.liaisonPhonePlaceholder')"
                  />
                </t-form-item>
              </t-col>
              <!-- 预定限期(reserve.reservationExpireDate)：必填，与备注同行；控件写法同墓区业务页下葬日期 20261011 新增,
                   库列为 datetime，前端只取日期部分，提交后由后端按 YYYY-MM-DD 落库(时间 00:00:00) 20261011 新增
                   字段由 endDate 改名：旧名与 room.endDate（管理费止期）同字不同义，详情卡同屏易误读 20261011 修改 -->
              <t-col :span="6">
                <t-form-item
                  :required-mark="true"
                  :label="$t('pages.reserve.reservationExpireDate')"
                  name="reservationExpireDate"
                >
                  <t-date-picker
                    v-model="formReserveData.reservationExpireDate"
                    :style="{ width: '322px' }"
                    theme="primary"
                    mode="date"
                    separator="/"
                    :placeholder="$t('pages.reserve.reservationExpireDatePlaceholder')"
                  />
                </t-form-item>
              </t-col>
              <!-- 备注：由原独占整行(690px)收进本行右列，宽度随 t-row 公共规则取 322px，限字 20 20261011 修改 -->
              <t-col :span="6">
                <t-form-item :label="$t('pages.reserve.remark')" name="remark">
                  <t-input
                    v-model="formReserveData.remark"
                    :maxcharacter="20"
                    show-limit-number
                    :style="{ width: '322px' }"
                    :placeholder="$t('pages.reserve.remarkPlaceholder')"
                  />
                </t-form-item>
              </t-col>
            </t-row>
            <!-- 经办人字段不再展示，后端保存时仍自动写入当前登录用户 operator 20260917 修改 -->
          </div>
        </div>

        <div class="form-submit-container">
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
    <!-- 预定结束 -->
  </div>
</template>
<script lang="ts">
export default {
  name: 'Reserve',
};
</script>
<script setup lang="ts">
import { RollbackIcon, ZoomInIcon, ZoomOutIcon } from 'tdesign-icons-vue-next';
import { MessagePlugin } from 'tdesign-vue-next';
import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';

import type { RoomModel } from '@/api/model/roomModel';
import { deleteReserve, getReserveByRoom, insertReserve, updateReserve } from '@/api/reserve';
import { getCanSaleList, getIdList } from '@/api/room';
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
import { t, translate } from '@/locales';
import { formatDate } from '@/utils/date';
import { formatPrice } from '@/utils/format';
import { logError } from '@/utils/logger';

import { FIND_DATA, INITIAL_RESERVE_DATA, INITIAL_ROOM_DATA } from './constants';

// ============================================================
// 墓区预定基础页，参照销售页卡片网格布局：筛选查询 → 卡片网格 → 详情 → 预定登记 20260902 新增,
// ============================================================

// ==================== 通用：权限与视图切换 ====================
// 向tab记录登记组件真实name，保证切tab时页面状态保活
useTabCacheName('Reserve');

// 预定模块权限对象按 idMenu(103104) 精确匹配，权限不足时兼容空对象避免运行时报错
const userInfo = usePermission('103104');
// 经办人字段不再展示，后端保存时仍自动写入当前登录用户 operator 20260917 修改

type FilterFormData = typeof FIND_DATA;
type RoomFormData = typeof INITIAL_ROOM_DATA;
type ReserveFormData = typeof INITIAL_RESERVE_DATA;

// 三个视图互斥显示：列表 / 详情 / 预定登记，切换逻辑收敛于公共 usePageSwitch 20260914 抽取
const isListShow = ref(false);
const isDetailShow = ref(false);
const isCreateShow = ref(false);
const { controlPageShow } = usePageSwitch({
  list: isListShow,
  detail: isDetailShow,
  createReserve: isCreateShow,
});

// ==================== 列表：状态与筛选下拉数据 ====================
// 区域由墓区预定下区域三级菜单经路由meta下发，挂载时读取一次
const menuRegion = (useRoute().meta.region as string) || '';
// 卡片长文本截断：超过7字显示前6字+4个半角点，悬停 tooltip 展示完整内容（口径同墓位迁出页卡片）20261012 新增
const truncateText = (value?: string | null) => {
  const text = String(value || '');
  return text.length > 7 ? `${text.slice(0, 6)}....` : text;
};
// 是否超过7字需要截断并显示悬停提示 20261012 新增
const isOverflow = (value?: string | null) => String(value || '').length > 7;
const formfindData = ref<FilterFormData>({ ...FIND_DATA, region: menuRegion });
const reserveCardViewport = ref<HTMLElement | null>(null);

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
} = useParkRoomFilter<RoomModel>(formfindData, (park, region) => getCanSaleList(park, region));

// ==================== 列表：卡片行分组与缩放 ====================
// 迁出状态：已迁出。已迁出的墓位不展示（迁出为终态，其展示由迁出查询页负责）20260921 新增
const TRANSFER_OUT_OUT = 'statusType.transferOutStatusEnum.out';
// 卡片列表过滤已迁出的墓位后再进入网格补位 20260921 新增
const visibleReserveRoomList = computed(() =>
  searchRoomList.value.filter((item) => item.transferOutStatus !== TRANSFER_OUT_OUT),
);
// 卡片网格：按排分组补位/缩放控制/记录数文案统一由 useCardGrid 提供 20260914 抽取
const {
  zoom: reserveZoom,
  handleZoomIn,
  handleZoomOut,
  cardRows: rawReserveCardRows,
  totalText: listTotalText,
} = useCardGrid(visibleReserveRoomList);

// 排序选项：对排号 yNum 升/降序，默认降序；useCardGrid 内行组固定按排号升序分组，
// 降序时反转行组（组内序号顺序不变），升序保持原序，口径同墓区业务页 20261010 新增
const reserveCardRows = computed(() =>
  formfindData.value.sortOrder === 'asc' ? rawReserveCardRows.value : rawReserveCardRows.value.slice().reverse(),
);

// ==================== 列表：查询与筛选事件 ====================
// 按园区+区域请求墓位，加载完成后才置 hasQueried，避免先闪现“暂无数据”再切换为卡片

onMounted(() => {
  getRegionData();
  getParkData();
  // 列表不默认查询展示，需用户选择园区后手动查询
  setTimeout(() => {
    controlPageShow('list');
  }, 380);
});

// ==================== 详情 ====================
// 详情数据：单条墓位与活动预定/销售记录、下葬/收款/联系人记录列表，统一由 useRoomDetail 管理 20260907 修改 20260914 抽取
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

// 点击卡片详情：拉取 6 类详情数据后进入详情视图 20260907 修改 20260914 抽取
const handleClickDetail = async (row: CardRowArg<RoomModel>) => {
  try {
    const currentRow = row.row ?? row;
    await loadDetail(currentRow.idRoom);
    controlPageShow('detail');
  } catch (e) {
    logError(e);
  }
};

// 详情关闭：清空详情数据并回到列表 20260907 修改,
const ClickDetailClose = () => {
  clearDetail();
  controlPageShow('list');
};

// ==================== 预定登记 ====================
const formRoomData = ref<RoomFormData>({ ...INITIAL_ROOM_DATA });
const formReserveData = ref<ReserveFormData>({ ...INITIAL_RESERVE_DATA });

const resetReserveForm = (idRoom = 0) => {
  formReserveData.value = {
    ...INITIAL_RESERVE_DATA,
    idRoom,
  };
};

// 点击卡片“预定”：校验墓位可查后进入预定登记视图
const handleClickReserve = async (row: CardRowArg<RoomModel>) => {
  const currentRow = row.row ?? row;
  resetReserveForm(currentRow.idRoom);
  const loaded = await getRoomID(currentRow.idRoom);
  if (!loaded) {
    resetReserveForm();
    return;
  }
  controlPageShow('createReserve');
};

const getRoomID = async (id: number) => {
  try {
    const { list } = await getIdList(id);
    if (!list || list.length === 0) {
      return false;
    }
    const dataQuery = list[0];
    dataQuery.xNum = dataQuery.xNum.toString();
    dataQuery.yNum = dataQuery.yNum.toString();
    formRoomData.value = dataQuery;
    return true;
  } catch (e) {
    logError(e);
    return false;
  }
};

// 取消：重置预定表单，保持当前墓位
const onReset = () => {
  resetReserveForm(formRoomData.value.idRoom);
};

// 预定关闭：清空数据并回到列表
const ClickCreateClose = () => {
  formRoomData.value = { ...INITIAL_ROOM_DATA };
  resetReserveForm();
  controlPageShow('list');
};

// 表单标题随模式切换：idReserve 非0为修改预定，否则为新建预定 20260907 新增
const formTitle = computed(() =>
  formReserveData.value.idReserve !== 0
    ? translate('pages.reserve.modifyTitle')
    : translate('pages.reserve.creatTitle'),
);

// ==================== 卡片：修改预定 ====================
// 点击卡片“修改”：加载墓位信息 + 已存在的活动预定记录回填表单后进入预定登记视图 20260907 新增
const handleClickModify = async (row: CardRowArg<RoomModel>) => {
  const currentRow = row.row ?? row;
  resetReserveForm(currentRow.idRoom);
  const loaded = await getRoomID(currentRow.idRoom);
  if (!loaded) {
    resetReserveForm();
    return;
  }
  const filled = await fillReserveForm(currentRow.idRoom);
  if (!filled) {
    resetReserveForm();
    return;
  }
  controlPageShow('createReserve');
};

// 按墓位查询当前活动预定记录，回填可编辑字段（联系人/电话/预定限期/备注）及 idReserve 20260907 新增, 20261011 字段改名
const fillReserveForm = async (idRoom: number) => {
  try {
    const { list } = await getReserveByRoom(idRoom);
    if (!list || list.length === 0) {
      return false;
    }
    const record = list[0];
    formReserveData.value = {
      idReserve: record.idReserve,
      idRoom,
      liaison: record.liaison ?? '',
      liaisonPhone: record.liaisonPhone ?? '',
      // 库中为 datetime（ISO 串），日期控件只认 yyyy-MM-dd，旧记录未填时保持空由用户补选 20261011 新增,
      reservationExpireDate: formatDate(record.reservationExpireDate ?? ''),
      remark: record.remark ?? '',
    };
    return true;
  } catch (e) {
    logError(e);
    return false;
  }
};

// ==================== 卡片：删除预定 ====================
const confirmVisible = ref(false);
// 待删除预定的墓位行数据，卡片操作直接传入 20260907 新增
const deleteReserveRow = ref<RoomModel | null>(null);
const dialogHeader = translate('operate.deleteDataCPrompt');

const confirmBody = computed(() => {
  if (deleteReserveRow.value) {
    const { park, yNum, xNum } = deleteReserveRow.value;
    return `${translate('operate.deleteDataAPrompt')}${park}${yNum}${translate('operate.row')}${xNum}${translate(
      'pages.reserve.deleteInfoPrompt',
    )}`;
  }
  return '';
});

const resetDeleteRow = () => {
  deleteReserveRow.value = null;
};

const onCancel = () => {
  resetDeleteRow();
};

// 点击卡片“删除”：记录待删除墓位并弹出二次确认 20260907 新增
const handleClickDelete = (row: CardRowArg<RoomModel>) => {
  const currentRow = row.row ?? row;
  deleteReserveRow.value = currentRow;
  confirmVisible.value = true;
};

// 确认删除：软删除预定记录并回置墓位状态，成功后刷新列表 20260907 新增
const onConfirmDelete = async () => {
  if (!deleteReserveRow.value) {
    return;
  }
  const { idRoom } = deleteReserveRow.value;
  try {
    await deleteReserve(idRoom);
    await getRoomData();
    MessagePlugin.success(translate('operate.deleteSuccessPrompt'));
  } catch (e) {
    logError(e);
  }
  resetDeleteRow();
  confirmVisible.value = false;
};

// 提交预定数据，校验必填项（联系人/电话/预定限期）后按 idReserve 区分新增/修改 20260907 修改
// 确认提交防重复：首个 await 前无任何锁，双击/慢网络会并发发出两次写接口→重复记录；submitting 同步上锁并在 finally 复位 20261004 新增
const { submitting, run } = useSubmitGuard();
const ClickSubmit = () => run(submitCore);
const submitCore = async () => {
  const { liaison, liaisonPhone, reservationExpireDate, remark, idRoom, idReserve } = formReserveData.value;

  if (liaison === undefined || liaison.trim() === '') {
    return MessagePlugin.warning(translate('pages.reserve.liaisonRequiredPlaceholder'));
  }
  if (liaisonPhone === undefined || liaisonPhone.trim() === '') {
    return MessagePlugin.warning(translate('pages.reserve.liaisonPhoneRequiredPlaceholder'));
  }
  // 预定限期必填：库列为可空，必填口径只靠应用层守住（后端同样会 400 拦下），前端先提示 20261011 新增 20261011 可空口径统一
  if (reservationExpireDate === undefined || String(reservationExpireDate).trim() === '') {
    return MessagePlugin.warning(translate('pages.reserve.reservationExpireDateRequiredPlaceholder'));
  }

  const payload = {
    idReserve,
    idRoom,
    liaison: liaison.trim(),
    liaisonPhone: liaisonPhone.trim(),
    // 后端动态透传（body 键名即库列名），改名后两侧必须同步 20261011 修改
    reservationExpireDate: String(reservationExpireDate).trim(),
    remark,
  };

  if (idReserve === 0) {
    try {
      await insertReserve(payload);
      MessagePlugin.success(translate('operate.reserveSuccessPrompt'));
      await getRoomData();
      ClickCreateClose();
    } catch (e) {
      logError(e);
      MessagePlugin.error(translate('operate.reserveFailedPrompt'));
    }
  } else {
    // 修改预定：idReserve 非0 走更新接口，仅更新联系人/电话/预定限期/备注 20260907 新增 20261011 字段改名
    try {
      await updateReserve(payload);
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

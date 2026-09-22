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
                  <!-- 区域由墓区预定下区域三级菜单经路由下发 20260902 新增 -->
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
                          <!-- 卡片首行改为展示xyNumber编号字段，与墓区设置/销售页一致 20260917 修改 -->
                          <div class="reserve-card__serial">{{ card.row.xyNumber }}</div>
                          <!-- 墓穴类型值上移至首行右侧胶囊，去掉标题 20260917 修改 -->
                          <div class="reserve-card__type">{{ $t(card.row.roomType) }}</div>
                        </div>
                        <div class="reserve-card__body">
                          <!-- 规格/价格：标签在左、值在右两端对齐 20260917 修改 -->
                          <div class="reserve-card__meta">
                            <span class="reserve-card__meta-label">{{ $t('pages.room.specs') }}</span>
                            <span class="reserve-card__meta-value">{{ card.row.specs }}</span>
                          </div>
                          <!-- priceString 列已删，卡片价格改由数值 price 千分位格式化 20260910 修改 -->
                          <div class="reserve-card__meta">
                            <span class="reserve-card__meta-label">{{ $t('pages.room.price') }}</span>
                            <span class="reserve-card__meta-value">{{ formatPrice(card.row.price) }}</span>
                          </div>
                          <!-- 销售/预定状态两枚胶囊标签两端分布：去掉下葬状态，预定状态胶囊样式与下葬状态一致 20260917 修改 -->
                          <div class="reserve-card__status">
                            <span
                              class="reserve-card__tag"
                              :class="`reserve-card__tag--${statusKey(card.row.saleStatus)}`"
                            >
                              {{ $t(card.row.saleStatus) }}
                            </span>
                            <span
                              class="reserve-card__tag"
                              :class="`reserve-card__tag--${statusKey(card.row.reserveStatus)}`"
                            >
                              {{ $t(card.row.reserveStatus) }}
                            </span>
                          </div>
                        </div>
                        <div class="reserve-card__actions">
                          <t-link theme="primary" @click="handleClickDetail(card.row)">{{
                            $t('operate.detail')
                          }}</t-link>
                          <!-- 未销售墓位才可预定，权限沿用新增权限 useCreate，标签按新增权限显示为新建 20260907 修改 -->
                          <t-link
                            v-if="
                              card.row.saleStatus === 'statusType.saleStatusEnum.unsold' && userInfo.useCreate === 1
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
                <t-form-item :required="true" :label="$t('pages.reserve.liaison')" name="liaison">
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
                <t-form-item :label="$t('pages.reserve.liaisonPhone')" name="liaisonPhone">
                  <t-input
                    v-model="formReserveData.liaisonPhone"
                    :maxcharacter="11"
                    show-limit-number
                    :style="{ width: '322px' }"
                    :placeholder="$t('pages.reserve.liaisonPhonePlaceholder')"
                  />
                </t-form-item>
              </t-col>
            </t-row>
            <t-form-item :label="$t('pages.reserve.remark')" name="remark">
              <t-input
                v-model="formReserveData.remark"
                :maxcharacter="50"
                :style="{ width: '690px' }"
                :placeholder="$t('pages.reserve.remarkPlaceholder')"
              />
            </t-form-item>
            <!-- 经办人字段不再展示，后端保存时仍自动写入当前登录用户 operator 20260917 修改 -->
          </div>
        </div>

        <div class="form-submit-container">
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
import { useCardGrid, usePageSwitch, useParkRoomFilter, usePermission, useRoomDetail, useTabCacheName } from '@/hooks';
import { t, translate } from '@/locales';
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
// 状态胶囊修饰类：提取枚举 key 最后一段（如 sold/buried），与墓区设置/销售页一致 20260917 新增
const statusKey = (status?: string) => (status ? String(status).split('.').pop() || '' : '');
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
  cardRows: reserveCardRows,
  totalText: listTotalText,
} = useCardGrid(visibleReserveRoomList);

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

// 按墓位查询当前活动预定记录，回填可编辑字段（联系人/电话/备注）及 idReserve 20260907 新增
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

// 提交预定数据，校验必填项后按 idReserve 区分新增/修改 20260907 修改
const ClickSubmit = async () => {
  const { liaison, liaisonPhone, remark, idRoom, idReserve } = formReserveData.value;

  if (liaison === undefined || liaison.trim() === '') {
    return MessagePlugin.warning(translate('pages.reserve.liaisonPlaceholder'));
  }
  if (liaisonPhone === undefined || liaisonPhone.trim() === '') {
    return MessagePlugin.warning(translate('pages.reserve.liaisonPhonePlaceholder'));
  }

  const payload = {
    idReserve,
    idRoom,
    liaison: liaison.trim(),
    liaisonPhone: liaisonPhone.trim(),
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
    // 修改预定：idReserve 非0 走更新接口，仅更新联系人/电话/备注 20260907 新增
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

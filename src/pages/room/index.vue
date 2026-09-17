<template>
  <div>
    <!-- 列表开始：参照墓区销售页改为筛选行+卡片网格布局，去掉左侧园区树 20260828 修改 -->
    <div v-show="isListShow" class="table-tree-container">
      <div class="list-tree-content room-page-content">
        <div
          class="list-common-table room-list-panel"
          :class="{ 'room-list-panel--full': hasQueried && roomCardRows.length }"
        >
          <t-form
            class="cms-card-filter-bar"
            :data="formfindData"
            :label-width="BUSINESS_BASIC_FORM_LABEL_WIDTH"
            colon
            @reset="resetFilter"
            @submit="onSubmit"
          >
            <t-row>
              <t-col :span="10">
                <!-- 筛选条件横向排列，条件之间空隙固定 24px，不随屏幕宽度变化 20260914 修改 -->
                <div class="cms-card-filter-inline">
                  <!-- 区域下拉框移除，改由墓区设置下区域三级菜单经路由下发 20260831 修改 -->
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
                <!-- 新增按钮保留，仍按墓室模块新增权限控制显示 20260828 修改 -->
                <t-button v-if="userInfo.useCreate === 1" @click="handleClickCreate">
                  {{ $t('operate.create') }}
                </t-button>
              </t-col>
            </t-row>
          </t-form>

          <!-- 查询后无数据时不展示卡片区，仅在筛选表单下方居中提示 20260828 修改 -->
          <div v-if="hasQueried && !roomCardRows.length" class="room-no-data">暂无数据</div>

          <div v-if="hasQueried && roomCardRows.length" class="room-list-body">
            <div class="table-container room-card-layout">
              <div class="room-card-rows" :style="{ zoom: roomZoom }">
                <div v-for="rowGroup in roomCardRows" :key="rowGroup.yNum" class="room-card-row">
                  <div class="room-card-grid">
                    <div
                      v-for="card in rowGroup.cards"
                      :key="`${rowGroup.yNum}-${card.xNum}`"
                      class="room-card"
                      :class="{ 'room-card--empty': card.placeholder }"
                    >
                      <template v-if="card.placeholder">
                        <!-- 空位卡序号与正常卡同样顶部对齐 20260828 修改 -->
                        <div class="room-card__header">
                          <!-- 序号去掉多余空格，与正常卡xyNumber格式一致 20260831 修改 -->
                          <div class="room-card__serial">{{ rowGroup.yNum }}排{{ card.xNum }}号</div>
                        </div>
                        <div class="room-card__body">
                          <div class="room-card__empty-text">空位</div>
                        </div>
                      </template>
                      <template v-else>
                        <div class="room-card__header">
                          <!-- 卡片首行改为展示xyNumber编号字段 20260831 修改 -->
                          <div class="room-card__serial">{{ card.row.xyNumber }}</div>
                          <!-- 墓位类型值上移至首行右侧，去掉墓穴类型标题 20260916 修改 -->
                          <div class="room-card__type">{{ $t(card.row.roomType) }}</div>
                        </div>
                        <div class="room-card__body">
                          <!-- 规格/价格信息行：标签在左、值在右两端对齐 20260916 修改 -->
                          <div class="room-card__meta">
                            <span class="room-card__meta-label">{{ $t('pages.room.specs') }}</span>
                            <span class="room-card__meta-value">{{ card.row.specs }}</span>
                          </div>
                          <!-- priceString 列已删，卡片价格改由数值 price 千分位格式化 20260910 修改 -->
                          <div class="room-card__meta">
                            <span class="room-card__meta-label">{{ $t('pages.room.price') }}</span>
                            <span class="room-card__meta-value">{{ formatPrice(card.row.price) }}</span>
                          </div>
                          <!-- 销售/下葬状态改为两枚胶囊标签两端分布，去掉标题 20260916 修改 -->
                          <div class="room-card__status">
                            <span class="room-card__tag" :class="`room-card__tag--${statusKey(card.row.saleStatus)}`">
                              {{ $t(card.row.saleStatus) }}
                            </span>
                            <span class="room-card__tag" :class="`room-card__tag--${statusKey(card.row.intoStatus)}`">
                              {{ $t(card.row.intoStatus) }}
                            </span>
                          </div>
                        </div>
                        <div class="room-card__actions">
                          <t-link theme="primary" @click="handleClickDetail(card.row)">{{
                            $t('operate.detail')
                          }}</t-link>
                          <!-- 仅"未预定/未销售/未下葬"的墓位显示删除，否则不显示 20260916 修改 -->
                          <t-link v-if="isRoomDeletable(card.row)" theme="danger" @click="handleClickDelete(card.row)">
                            {{ $t('operate.delete') }}
                          </t-link>
                          <t-link theme="danger" @click="handleClickModify(card.row)">{{
                            $t('operate.modify')
                          }}</t-link>
                        </div>
                      </template>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 列表底部工具行：左侧记录数，右侧放大/缩小卡片列表 20260828 修改 -->
          <div v-if="hasQueried && roomCardRows.length" class="room-list-toolbar">
            <span>{{ listTotalText }}</span>
            <span class="room-list-toolbar__zoom">
              <zoom-in-icon class="room-list-toolbar__zoom-icon" @click="handleZoomIn" />
              <zoom-out-icon class="room-list-toolbar__zoom-icon" @click="handleZoomOut" />
            </span>
          </div>

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
    <!-- 详情开始：与墓区销售/下葬/预定/联系/管理费收款/销售查询页共用 room-detail 组件 20260912 统一 -->
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
    <!-- 新建始 -->
    <div v-if="isCreateShow">
      <t-form ref="formCreate" class="base-form" :data="formData" label-align="top" :label-width="100" @reset="onReset">
        <div class="form-basic-container">
          <div class="form-basic-item">
            <div v-show="isCreate" class="form-basic-container-title">
              {{ $t('pages.room.creatTitle') }}
              <t-button style="float: right" theme="default" shape="square" variant="text" @click="ClickCreateClose()">
                <rollback-icon size="16px" />
              </t-button>
            </div>
            <div v-show="isModify" class="form-basic-container-title">
              {{ $t('pages.room.modifyTitle') }}
              <t-radio-group v-model="formDataModify" style="padding-left: 120px">
                <t-radio value="1" @click="ClickSingleData"> {{ $t('pages.room.singleData') }} </t-radio>
                <t-radio value="2" @click="ClickMultipleData"> {{ $t('pages.room.multipleData') }} </t-radio>
              </t-radio-group>
              <t-button style="float: right" theme="default" shape="square" variant="text" @click="ClickCreateClose()">
                <rollback-icon size="16px" />
              </t-button>
            </div>
            <!-- 表单内容 -->

            <t-row class="row-gap" :gutter="[32, 5]">
              <!-- 区域信息不展示,新建时仍预填 menuRegion 供提交与园区联动 20260902 修改 -->
              <t-col :span="6">
                <t-form-item :label="$t('pages.room.park')" name="park">
                  <t-select
                    v-model="formData.park"
                    :style="{ width: '322px' }"
                    class="demo-select-base"
                    clearable
                    :disabled="isModify"
                  >
                    <t-option
                      v-for="(item, index) in createAvailableParkList"
                      :key="index"
                      :value="item.value"
                      :label="item.label"
                    >
                      {{ item.label }}
                    </t-option>
                  </t-select>
                </t-form-item>
              </t-col>
              <!-- :format="format" -->
              <t-col :span="6">
                <t-form-item :required="true" :label="$t('pages.room.yNum')" name="yNum">
                  <t-input-number
                    v-model="formData.yNum"
                    large-number
                    max="100"
                    min="1"
                    theme="normal"
                    :style="{ width: '147px' }"
                    :placeholder="$t('pages.room.yNumPlaceholder')"
                    @blur="changeNumberFocus('yNum', formData.yNum)"
                  />

                  <p v-show="isMultiple">&nbsp;&nbsp;{{ $t('pages.room.to') }}&nbsp;&nbsp;</p>
                  <t-input-number
                    v-show="isMultiple"
                    v-model="formData.yNumTo"
                    large-number
                    max="100"
                    min="1"
                    theme="normal"
                    :style="{ width: '147px' }"
                    :placeholder="$t('pages.room.yNumPlaceholder')"
                    @blur="changeNumberFocus('yNumTo', formData.yNumTo)"
                  />
                </t-form-item>
              </t-col>

              <t-col :span="6">
                <t-form-item :label="$t('pages.room.xNum')" name="xNum">
                  <t-input-number
                    v-model="formData.xNum"
                    large-number
                    max="100"
                    min="1"
                    theme="normal"
                    :style="{ width: '147px' }"
                    :placeholder="$t('pages.room.xNumPlaceholder')"
                    @blur="changeNumberFocus('xNum', formData.xNum)"
                  />

                  <p v-show="isMultiple">&nbsp;&nbsp;{{ $t('pages.room.to') }}&nbsp;&nbsp;</p>
                  <t-input-number
                    v-show="isMultiple"
                    v-model="formData.xNumTo"
                    large-number
                    max="100"
                    min="1"
                    theme="normal"
                    :style="{ width: '147px' }"
                    :placeholder="$t('pages.room.xNumPlaceholder')"
                    @blur="changeNumberFocus('xNumTo', formData.xNumTo)"
                  />
                </t-form-item>
              </t-col>
              <!-- 空占位：单条修改时补满序号行，使编号换行与墓穴类型同行（TDesign为12栅格，span6=半行） 20260916 修改 -->
              <t-col v-if="isModify && formDataModify === '1'" :span="6"></t-col>
              <!-- 单条修改时新增编号行（独占一行），值为xyNumber可编辑保存 20260831 新增 -->
              <t-col v-if="isModify && formDataModify === '1'" :span="6">
                <t-form-item :label="$t('pages.room.xyNumber')" name="xyNumber">
                  <t-input
                    v-model="formData.xyNumber"
                    :maxcharacter="20"
                    show-limit-number
                    :style="{ width: '322px' }"
                    :placeholder="$t('pages.room.xyNumberPlaceholder')"
                  />
                </t-form-item>
              </t-col>
              <!-- 墓穴类型上移至编号右侧同行（各占半行） 20260916 修改 -->
              <t-col :span="6">
                <t-form-item :label="$t('pages.room.roomType')" name="roomType">
                  <t-select v-model="formData.roomType" :style="{ width: '322px' }" class="demo-select-base" clearable>
                    <t-option
                      v-for="(item, index) in TYPE_ROOM_TYPES"
                      :key="index"
                      :value="item.value"
                      :label="t(item.label)"
                    >
                      {{ t(item.label) }}
                    </t-option>
                  </t-select>
                </t-form-item>
              </t-col>
              <t-col :span="6">
                <t-form-item :required="true" :label="$t('pages.room.specs')" name="specs">
                  <t-input
                    v-model="formData.specs"
                    :maxcharacter="20"
                    show-limit-number
                    :style="{ width: '322px' }"
                    :placeholder="$t('pages.room.specsPlaceholder')"
                  />
                </t-form-item>
              </t-col>

              <t-col :span="6">
                <t-form-item :label="$t('pages.room.price')" name="price">
                  <!-- priceString 列已删，价格直接绑数值 price 录入，千分位仅用于展示位 20260910 修改 -->
                  <t-input-number
                    v-model="formData.price"
                    large-number
                    max="9999999"
                    min="1"
                    theme="normal"
                    :style="{ width: '322px' }"
                    :placeholder="$t('pages.room.pricePlaceholder')"
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
                {{ $t('operate.confirm') }}
              </t-button>
              <t-button v-if="isCreate" class="form-submit-cancel" theme="default" type="reset">
                {{ $t('operate.cancel') }}
              </t-button>
              <t-button v-if="isModify" class="form-submit-cancel" theme="default" @click="ClickReset()">
                {{ $t('operate.cancel') }}
              </t-button>
            </div>
          </div>
        </div>
      </t-form>
    </div>
    <!-- 新建结束 -->
  </div>
</template>
<script lang="ts">
export default {
  name: 'Room',
};
</script>
<script setup lang="ts">
import { RollbackIcon, ZoomInIcon, ZoomOutIcon } from 'tdesign-icons-vue-next';
import { MessagePlugin } from 'tdesign-vue-next';
import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';

import type { RoomModel } from '@/api/model/roomModel';
import { deleteRoom, getIdList, getRoomList, insertRoom, updateRoom } from '@/api/room';
import RoomDetail from '@/components/room-detail/index.vue';
import { BUSINESS_BASIC_FORM_LABEL_WIDTH, TYPE_ROOM_TYPES } from '@/constants';
import type { CardRowArg } from '@/hooks';
import { useCardGrid, useParkRoomFilter, usePermission, useRoomDetail, useTabCacheName } from '@/hooks';
import { t, translate } from '@/locales';
import { formatPrice } from '@/utils/format';
import { logError } from '@/utils/logger';

import { FIND_DATA, INITIAL_DATA } from './constants';

type FilterFormData = typeof FIND_DATA;
type RoomFormData = typeof INITIAL_DATA;

// ==================== 通用：权限与视图切换 ====================
// 向tab记录登记组件真实name，修复后端路由name与组件name不一致导致切tab不保活、查询数据丢失的问题 20260828 修复,
useTabCacheName('Room');

// 墓室模块权限对象按 idMenu(103101) 精确匹配，权限不足时兼容空对象避免运行时报错 20260823 修改,
const userInfo = usePermission('103101');

// 区域由墓区设置下的区域三级菜单经路由meta下发，挂载时读取一次；
// keep-alive按fullPath区分实例，各区域tab互不影响，无需响应式监听 20260831 新增,
const menuRegion = (useRoute().meta.region as string) || '';

const dialogHeader = translate('operate.deleteDataCPrompt');

// 卡片状态标签配色：取状态枚举 key 末段(如 sold/buried)拼接胶囊标签修饰类 20260916 新增
const statusKey = (status?: string) => (status ? String(status).split('.').pop() || '' : '');

// 视图互斥显示：列表 / 详情 / 新建修改 20260828 梳理,
const isListShow = ref(false);
const isDetailShow = ref(false);
const isCreateShow = ref(false);
const isCreate = ref(false);
const isModify = ref(false);
const isMultiple = ref(false);
const formDataModify = ref('0');

const controlPageShow = (name: string) => {
  if (name === 'list') {
    isCreateShow.value = false;
    isDetailShow.value = false;
    isCreate.value = false;
    isModify.value = false;
    isListShow.value = true;
  }
  if (name === 'detail') {
    isCreateShow.value = false;
    isListShow.value = false;
    isDetailShow.value = true;
  }
  if (name === 'createCreate') {
    isDetailShow.value = false;
    isListShow.value = false;
    isCreateShow.value = true;
    isModify.value = false;
    isCreate.value = true;
    formDataModify.value = '2';
    isMultiple.value = true;
  }
  if (name === 'createModify') {
    setTimeout(() => {
      isListShow.value = false;
      isDetailShow.value = false;
      isCreate.value = false;
      formDataModify.value = '1';
      isModify.value = true;
      isMultiple.value = false;
      isCreateShow.value = true;
    }, 180);
  }
  if (name === 'single') {
    formDataModify.value = '1';
    isMultiple.value = false;
  }
  if (name === 'multiple') {
    formDataModify.value = '2';

    isMultiple.value = true;
  }
};

// ==================== 列表：状态与筛选下拉数据 ====================
// 区域初始值取自菜单下发的区域，页面不再提供区域切换 20260831 修改,
const formfindData = ref<FilterFormData>({ ...FIND_DATA, region: menuRegion });

// 区域/园区下拉、园区联动、排号去重、查询二次过滤收敛于公共 useParkRoomFilter 20260914 抽取
const {
  dataRoomList,
  searchRoomList,
  hasQueried,
  dataParkList,
  availableParkList,
  yNumList,
  getSelectedRegionLabel,
  getRegionData,
  getParkData,
  onSelectChange,
  getRoomData,
  onSubmit,
  getDefaultFilterPark,
} = useParkRoomFilter<RoomModel>(formfindData, (park, region) => getRoomList(park, region));

// ==================== 列表：卡片行分组与缩放 ====================
// 卡片网格：按排分组补位/缩放控制/记录数文案统一由 useCardGrid 提供 20260914 抽取
const {
  zoom: roomZoom,
  handleZoomIn,
  handleZoomOut,
  cardRows: roomCardRows,
  totalText: listTotalText,
} = useCardGrid(searchRoomList);

const resetFilter = () => {
  formfindData.value = {
    ...FIND_DATA,
    region: menuRegion, // 区域由菜单下发，重置时不清空 20260831 修改,
    park: getDefaultFilterPark(),
  };
  searchRoomList.value = dataRoomList.value;
};

onMounted(() => {
  getRegionData();
  getParkData();
  // 列表不再默认查询展示，需用户选择园区后手动查询 20260831 修改,
  setTimeout(() => {
    controlPageShow('list');
  }, 380);
});

// ==================== 列表：删除确认 ====================
const confirmVisible = ref(false);
// 待删除的墓位记录，卡片操作直接传行数据，替代原表格行下标方式 20260828 修改,
const deleteRoomRow = ref<RoomModel | null>(null);

const confirmBody = computed(() => {
  if (deleteRoomRow.value) {
    const { region, park, yNum, xNum } = deleteRoomRow.value;
    return `${translate('operate.deleteDataAPrompt')}${region}${park}${yNum}${translate(
      'operate.row',
    )}${xNum}${translate('operate.deleteDataBPrompt')}`;
  }
  return '';
});

const resetIdx = () => {
  deleteRoomRow.value = null;
};

const onCancel = () => {
  resetIdx();
};

// 仅"未预定/未销售/未下葬/未迁出"的墓位允许删除，任一状态流转后即禁止 20260902 新增 20260916 加迁出条件,
const isRoomDeletable = (row: CardRowArg<RoomModel>) => {
  const currentRow = row.row ?? row;
  return (
    currentRow.reserveStatus === 'statusType.reserveStatusEnum.unreserved' &&
    currentRow.saleStatus === 'statusType.saleStatusEnum.unsold' &&
    currentRow.intoStatus === 'statusType.intoStatusEnum.incomplet' &&
    // 旧数据迁出状态为 NULL，仅"已迁出"禁删
    currentRow.transferOutStatus !== 'statusType.transferOutStatusEnum.out'
  );
};

const handleClickDelete = (row: CardRowArg<RoomModel>) => {
  const currentRow = row.row ?? row;
  deleteRoomRow.value = currentRow;
  confirmVisible.value = true;
};

const onConfirmDelete = async () => {
  if (!deleteRoomRow.value) {
    return;
  }
  const { idRoom } = deleteRoomRow.value;
  try {
    await deleteRoom(idRoom);
    const i = dataRoomList.value.findIndex((item) => item.idRoom === idRoom);
    if (i > -1) {
      dataRoomList.value.splice(i, 1);
    }
    onSelectChange();
  } catch (e) {
    logError(e);
  }
  resetIdx();
  confirmVisible.value = false;
  MessagePlugin.success(translate('pages.operator.deleteSuccessPrompt'));
};

// ==================== 列表：详情与修改入口 ====================
let roomDetailRequestId = 0;

// 详情数据：单条墓位与活动预定/销售记录、下葬/收款/联系人记录列表，统一由 useRoomDetail 管理 20260912 统一 20260914 抽取
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

// 点击卡片详情：拉取 6 类详情数据后进入详情视图 20260828 修改 20260914 抽取
const handleClickDetail = async (row: CardRowArg<RoomModel>) => {
  try {
    const currentRow = row.row ?? row;
    await loadDetail(currentRow.idRoom);
    controlPageShow('detail');
  } catch (e) {
    logError(e);
  }
};

// 点击卡片修改：校验墓位可查后进入修改表单 20260828 修改,
const handleClickModify = async (row: CardRowArg<RoomModel>) => {
  const currentRow = row.row ?? row;
  const loaded = await getRoomID(currentRow.idRoom);
  if (!loaded) {
    return;
  }

  controlPageShow('createModify');
};

const handleClickCreate = async () => {
  onCreateMounted();
  controlPageShow('createCreate');
};

const getRoomID = async (id: number) => {
  const currentRequestId = ++roomDetailRequestId;

  try {
    const { list } = await getIdList(id);
    if (currentRequestId !== roomDetailRequestId) {
      return false;
    }

    if (!list || list.length === 0) {
      return false;
    }

    const dataQuery = list[0];
    dataQuery.xNum = dataQuery.xNum.toString();
    dataQuery.yNum = dataQuery.yNum.toString();
    dataQuery.xNumTo = dataQuery.xNum.toString();
    dataQuery.yNumTo = dataQuery.yNum.toString();
    formData.value = dataQuery;
    return true;
  } catch (e) {
    logError(e);
    return false;
  }
};

// 区域下拉已从新建表单移除,联动函数随之清理 20260902 修改,

// 新建表单重置回调 20260828 梳理,
const onReset = () => {
  // 取消新建，无需额外处理 20260828 梳理,
};

const ClickReset = () => {
  getRoomID(formData.value.idRoom);
};

// ==================== 详情 ====================
// 详情关闭：清空详情数据并回到列表，与其它共用页返回逻辑一致 20260912 统一
const ClickDetailClose = () => {
  clearDetail();
  controlPageShow('list');
};

// 新建/修改表单数据 20260828 梳理,
const formData = ref<RoomFormData>({ ...INITIAL_DATA });

// 新建表单园区下拉随所选区域联动过滤，复用列表已加载的园区数据 20260828 修改,
const createAvailableParkList = computed(() => {
  const { region } = formData.value;
  if (!region) {
    return dataParkList.value;
  }
  return dataParkList.value.filter((item) => item.region === region || item.region === getSelectedRegionLabel(region));
});

const changeNumberFocus = (value: string, number: string) => {
  if (number === undefined || number === null || number === '') {
    return;
  }

  const normalizedValue = String(number).replace(/\D/g, '');

  if (normalizedValue === '') {
    return;
  }

  if (value === 'yNum') {
    formData.value.yNum = parseInt(normalizedValue, 10).toString();
  }
  if (value === 'yNumTo') {
    formData.value.yNumTo = parseInt(normalizedValue, 10).toString();
  }
  if (value === 'xNum') {
    formData.value.xNum = parseInt(normalizedValue, 10).toString();
  }
  if (value === 'xNumTo') {
    formData.value.xNumTo = parseInt(normalizedValue, 10).toString();
  }
};

// 新建数据准备，区域/园区下拉复用列表已加载数据，无需重复请求；区域预填为菜单下发值 20260831 修改,
// 新建时状态不可编辑，固定初值：未预订/未销售/未下葬/未迁出 20260902 修改 20260916 加迁出初值,
const onCreateMounted = () => {
  roomDetailRequestId += 1;
  formData.value = {
    ...INITIAL_DATA,
    region: menuRegion,
    reserveStatus: 'statusType.reserveStatusEnum.unreserved',
    saleStatus: 'statusType.saleStatusEnum.unsold',
    intoStatus: 'statusType.intoStatusEnum.incomplet',
    transferOutStatus: 'statusType.transferOutStatusEnum.notOut',
  };
};
// 新建关闭
const formCreate = ref<{ reset: () => void } | null>(null);
const ClickCreateClose = () => {
  roomDetailRequestId += 1;
  formData.value = { ...INITIAL_DATA };
  formCreate.value?.reset();
  controlPageShow('list');
};

const ClickSingleData = () => {
  controlPageShow('single');
  formData.value.yNumTo = formData.value.yNum;
  formData.value.xNumTo = formData.value.xNum;
};
const ClickMultipleData = () => {
  controlPageShow('multiple');
  formData.value.yNumTo = formData.value.yNum;
  formData.value.xNumTo = formData.value.xNum;
};

// 提交数据
const ClickSubmit = async () => {
  // 将Proxy对象转换为JSON字符串,不转也可以

  if (formData.value.region === '' || formData.value.region === undefined) {
    return MessagePlugin.warning(translate('pages.room.regionPlaceholder'));
  }
  if (formData.value.park === '' || formData.value.park === undefined) {
    return MessagePlugin.warning(translate('pages.room.parkPlaceholder'));
  }
  if (formData.value.yNum === undefined) {
    return MessagePlugin.warning(translate('pages.room.yNumMessagePlugin'));
  }
  if (formData.value.yNumTo === undefined || formData.value.yNumTo === '') {
    formData.value.yNumTo = formData.value.yNum;
  }
  if (formData.value.xNum === undefined) {
    return MessagePlugin.warning(translate('pages.room.yNumMessagePlugin'));
  }
  if (formData.value.xNumTo === undefined || formData.value.xNumTo === '') {
    formData.value.xNumTo = formData.value.xNum;
  }
  if (formData.value.price === undefined || formData.value.price === null) {
    return MessagePlugin.warning(translate('pages.room.priceMessagePlugin'));
  }

  if (formData.value.saleStatus === '' || formData.value.saleStatus === undefined) {
    return MessagePlugin.warning(translate('pages.room.saleStatusPlaceholder'));
  }
  if (formData.value.intoStatus === '' || formData.value.intoStatus === undefined) {
    return MessagePlugin.warning(translate('pages.room.intoStatusPlaceholder'));
  }
  if (formData.value.roomType === '' || formData.value.roomType === undefined) {
    return MessagePlugin.warning(translate('pages.room.roomTypePlaceholder'));
  }
  // 表单已去掉修复状态,改为预定状态必填;repairStatus 提交前剔除,保留库中原值 20260902 修改,
  if (formData.value.reserveStatus === '' || formData.value.reserveStatus === undefined) {
    return MessagePlugin.warning(translate('pages.room.reserveStatusPlaceholder'));
  }

  const startYNum = Number(formData.value.yNum);
  const endYNum = Number(formData.value.yNumTo);
  const startXNum = Number(formData.value.xNum);
  const endXNum = Number(formData.value.xNumTo);

  if (endYNum < startYNum) {
    return MessagePlugin.warning('结束排号不能小于开始排号');
  }
  if (endXNum < startXNum) {
    return MessagePlugin.warning('结束序号不能小于开始序号');
  }
  // if formDataModify

  const jsonformDataString = JSON.stringify(formData.value);
  const jsonbody = JSON.parse(jsonformDataString);
  jsonbody.modify = formDataModify.value;
  // 多条修改不更新编号，避免范围内墓位被覆写为同一编号 20260831 新增,
  if (jsonbody.modify === '2') {
    delete jsonbody.xyNumber;
  }
  // 表单已无修复状态,剔除空值避免新建/修改时覆写库中 repairStatus 20260902 新增,
  delete jsonbody.repairStatus;

  if (formData.value.idRoom === 0) {
    try {
      await insertRoom(jsonbody);
      MessagePlugin.success(translate('operate.createdSuccessPrompt'));
      // 如果单条，单独更新暂时不做，
      getRoomData();

      ClickCreateClose();
    } catch (e) {
      logError(e);
      MessagePlugin.error(translate('operate.createdFailedPrompt'));
    }
  } else {
    try {
      await updateRoom(jsonbody);
      MessagePlugin.success(translate('operate.modifySuccessPrompt'));
      getRoomData();
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

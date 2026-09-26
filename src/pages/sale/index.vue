<template>
  <div>
    <!-- 列表开始 -->
    <div v-show="isListShow" class="table-tree-container">
      <div class="list-tree-content sale-page-content">
        <div
          class="list-common-table sale-list-panel"
          :class="{ 'sale-list-panel--full': hasQueried && saleCardRows.length }"
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
                  <!-- 区域由墓区销售下区域三级菜单经路由下发：下拉框仅展示当前区域且不可用（不可切换）20260923 修改 -->
                  <t-form-item
                    :label="$t('pages.room.region')"
                    name="region"
                    class="cms-filter-item cms-filter-item-basic"
                  >
                    <t-select
                      v-model="formfindData.region"
                      class="demo-select-base cms-filter-control"
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
                </div>
              </t-col>

              <t-col :span="2" class="operation-container">
                <t-button theme="primary" type="submit">
                  {{ $t('operate.query') }}
                </t-button>
              </t-col>
            </t-row>
          </t-form>

          <!-- 查询后无数据时不展示卡片区，仅在筛选表单下方居中提示 20260827 修改 -->
          <div v-if="hasQueried && !saleCardRows.length" class="sale-no-data">暂无数据</div>

          <div v-if="hasQueried && saleCardRows.length" class="sale-list-body">
            <div ref="saleCardViewport" class="table-container sale-card-layout">
              <div v-if="saleCardRows.length" class="sale-card-rows" :style="{ zoom: saleZoom }">
                <div v-for="rowGroup in saleCardRows" :key="rowGroup.yNum" class="sale-card-row">
                  <div class="sale-card-grid">
                    <div
                      v-for="card in rowGroup.cards"
                      :key="`${rowGroup.yNum}-${card.xNum}`"
                      class="sale-card"
                      :class="{
                        'sale-card--empty': card.placeholder,
                        // 已销售卡片红色外框区分，取消原浅灰底约定，样式见 index.less 的 .sale-card--sold 20260923 修改
                        'sale-card--sold':
                          !card.placeholder && card.row.saleStatus === 'statusType.saleStatusEnum.sold',
                        // 未销售卡片绿色外框区分，样式见 .sale-card--unsold 20260923 新增
                        'sale-card--unsold':
                          !card.placeholder && card.row.saleStatus === 'statusType.saleStatusEnum.unsold',
                      }"
                    >
                      <template v-if="card.placeholder">
                        <!-- 空位卡序号与正常卡同样顶部对齐 20260828 修改 -->
                        <div class="sale-card__header">
                          <div class="sale-card__serial">{{ rowGroup.yNum }} 排 {{ card.xNum }} 号</div>
                        </div>
                        <div class="sale-card__body">
                          <div class="sale-card__empty-text">空位</div>
                        </div>
                      </template>
                      <template v-else>
                        <div class="sale-card__header">
                          <!-- 卡片首行改为展示xyNumber编号字段，与墓区设置页一致 20260916 修改 -->
                          <div class="sale-card__serial">{{ card.row.xyNumber }}</div>
                          <!-- 墓穴类型值上移至首行右侧胶囊，去掉墓穴类型标题 20260916 修改 -->
                          <div class="sale-card__type">{{ $t(card.row.roomType) }}</div>
                        </div>
                        <div class="sale-card__body">
                          <div class="sale-card__meta">
                            <span class="sale-card__meta-label">{{ $t('pages.room.specs') }}</span>
                            <span class="sale-card__meta-value">{{ card.row.specs }}</span>
                          </div>
                          <!-- priceString 列已删，卡片价格改由数值 price 千分位格式化 20260910 修改 -->
                          <div class="sale-card__meta">
                            <span class="sale-card__meta-label">{{ $t('pages.room.price') }}</span>
                            <span class="sale-card__meta-value">{{ formatPrice(card.row.price) }}</span>
                          </div>
                          <!-- 预定/销售状态两枚胶囊两端分布：去掉下葬状态，预定状态样式与下葬状态一致，
                               预定状态置于销售状态之前 20260917 修改 -->
                          <div class="sale-card__status">
                            <span
                              class="sale-card__tag"
                              :class="`sale-card__tag--${statusKey(card.row.reserveStatus)}`"
                            >
                              {{ $t(card.row.reserveStatus) }}
                            </span>
                            <span class="sale-card__tag" :class="`sale-card__tag--${statusKey(card.row.saleStatus)}`">
                              {{ $t(card.row.saleStatus) }}
                            </span>
                          </div>
                        </div>
                        <div class="sale-card__actions">
                          <t-link theme="primary" @click="handleClickDetail(card.row)">{{
                            $t('operate.detail')
                          }}</t-link>
                          <!-- 未销售墓位才可开单，权限沿用新增权限 useCreate，标签按新建显示 20260907 修改 -->
                          <t-link
                            v-if="
                              card.row.saleStatus === 'statusType.saleStatusEnum.unsold' && userInfo.useCreate === 1
                            "
                            theme="danger"
                            @click="handleClickSale(card.row)"
                          >
                            {{ $t('operate.create') }}
                          </t-link>
                          <!-- 已销售墓位按修改权限显示“修改”，点击进入开单表单回填 20260907 新增 -->
                          <t-link
                            v-if="card.row.saleStatus === 'statusType.saleStatusEnum.sold' && userInfo.useModify === 1"
                            theme="primary"
                            @click="handleClickModify(card.row)"
                          >
                            {{ $t('operate.modify') }}
                          </t-link>
                          <!-- 已销售墓位按删除权限显示“删除”，点击弹出二次确认 20260907 新增 -->
                          <t-link
                            v-if="card.row.saleStatus === 'statusType.saleStatusEnum.sold' && userInfo.useDelete === 1"
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

          <!-- 列表底部工具行：左侧记录数，右侧放大/缩小卡片列表 20260828 修改 -->
          <div v-if="hasQueried && saleCardRows.length" class="sale-list-toolbar">
            <span>{{ listTotalText }}</span>
            <span class="sale-list-toolbar__zoom">
              <zoom-in-icon class="sale-list-toolbar__zoom-icon" @click="handleZoomIn" />
              <zoom-out-icon class="sale-list-toolbar__zoom-icon" @click="handleZoomOut" />
            </span>
          </div>

          <!-- 删除销售二次确认弹窗，参照墓区预定页 20260907 新增 -->
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
    <!-- 新建始 -->
    <div v-if="isCreateShow">
      <t-form class="base-form" :data="formSaleData" label-align="top" :label-width="100">
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
                <span>{{ $t('pages.room.region') }} : {{ formRoomData.region }}</span>
              </t-col>
              <t-col :span="6">
                <span>{{ $t('pages.room.park') }} : {{ formRoomData.park }}</span>
              </t-col>
              <t-col :span="6">
                <!-- 去掉排号/序号，原排号位置改为显示编号xyNumber 20260901 修改 -->
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
                <span>{{ $t('pages.room.saleStatus') }} : {{ t(formRoomData.saleStatus) }}</span>
              </t-col>
              <t-col :span="6">
                <span>{{ $t('pages.room.intoStatus') }} : {{ t(formRoomData.intoStatus) }}</span>
              </t-col>
              <!-- 维修状态从开单页墓位信息区移除 20260901 修改 -->
              <!-- 收款人与编号字段 20260918 新增，字段顺序：编号、实收金额、付款人、付款人电话、付款人身份证号、收款人 20260918 调整 -->
              <t-col :span="6">
                <t-form-item :label="$t('pages.sale.serialNo')" name="serialNo">
                  <t-input
                    v-model="formSaleData.serialNo"
                    :maxcharacter="6"
                    show-limit-number
                    :style="{ width: '312px' }"
                    :placeholder="$t('pages.sale.serialNoPlaceholder')"
                  />
                </t-form-item>
              </t-col>
              <t-col :span="6">
                <t-form-item :label="$t('pages.sale.realPrice')" name="realPrice">
                  <t-input-number
                    v-model="formSaleData.realPriceString"
                    large-number
                    max="9999999"
                    min="1"
                    theme="normal"
                    :style="{ width: '312px' }"
                    :placeholder="$t('pages.sale.realPricPlaceholder')"
                    @blur="changeNumberFocus('price', formSaleData.realPriceString)"
                  />
                </t-form-item>
              </t-col>
              <t-col :span="6">
                <t-form-item :required="true" :label="$t('pages.sale.payer')" name="payer">
                  <t-input
                    v-model="formSaleData.payer"
                    :maxcharacter="20"
                    show-limit-number
                    :style="{ width: '312px' }"
                    :placeholder="$t('pages.sale.payerPlaceholder')"
                  />
                </t-form-item>
              </t-col>
              <t-col :span="6">
                <t-form-item :required="true" :label="$t('pages.sale.phone')" name="payerPhone">
                  <t-input
                    v-model="formSaleData.payerPhone"
                    :maxcharacter="11"
                    show-limit-number
                    :style="{ width: '312px' }"
                    :placeholder="$t('pages.sale.phonePlaceholder')"
                  />
                </t-form-item>
              </t-col>
              <t-col :span="6">
                <t-form-item :label="$t('pages.sale.payerIDCard')" name="payerIDCard">
                  <t-input
                    v-model="formSaleData.payerIDCard"
                    :maxcharacter="18"
                    show-limit-number
                    :style="{ width: '312px' }"
                    :placeholder="$t('pages.sale.payerIDCardPlaceholder')"
                  />
                </t-form-item>
              </t-col>
              <t-col :span="6">
                <t-form-item :label="$t('pages.sale.payee')" name="payee">
                  <t-input
                    v-model="formSaleData.payee"
                    :maxcharacter="20"
                    show-limit-number
                    :style="{ width: '312px' }"
                    :placeholder="$t('pages.sale.payeePlaceholder')"
                  />
                </t-form-item>
              </t-col>
            </t-row>
            <!-- 备注改回单行输入框，宽度与联系人电话输入框右缘对齐（实测681），字数限制50并在输入框右侧计数，同电话 20260916 修改 -->
            <t-form-item :label="$t('pages.sale.remark')" name="remark">
              <t-input
                v-model="formSaleData.remark"
                :maxcharacter="50"
                show-limit-number
                :style="{ width: '690px' }"
                :placeholder="$t('pages.sale.remarkPlaceholder')"
              />
            </t-form-item>
          </div>
        </div>

        <div class="form-submit-container">
          <div class="form-submit-sub">
            <div class="form-submit-left">
              <t-button theme="primary" class="form-submit-confirm" :disabled="saleSubmitted" @click="ClickSubmit()">
                {{ $t('operate.confirm') }}
              </t-button>

              <!-- 打印票据按钮：修改模式进入即显示（表单已回填可打印当前单据），新建提交成功后显示 20260922 修改 -->
              <t-button
                v-if="saleSubmitted || formSaleData.idSale !== 0"
                class="form-submit-cancel"
                theme="default"
                @click="printReceipt()"
              >
                {{ $t('operate.printReceipt') }}
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
  name: 'Sale',
};
</script>
<script setup lang="ts">
import { RollbackIcon, ZoomInIcon, ZoomOutIcon } from 'tdesign-icons-vue-next';
import { MessagePlugin } from 'tdesign-vue-next';
import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';

import type { RoomModel } from '@/api/model/roomModel';
import { getReceiptConfigForPrint } from '@/api/receiptConfig';
import { getCanSaleList, getIdList } from '@/api/room';
import { deleteSale, getSaleByRoom, insertSale, updateSale } from '@/api/sale';
import RoomDetail from '@/components/room-detail/index.vue';
import { BUSINESS_BASIC_FORM_LABEL_WIDTH } from '@/constants';
import type { CardRowArg } from '@/hooks';
import { useCardGrid, usePageSwitch, useParkRoomFilter, usePermission, useRoomDetail, useTabCacheName } from '@/hooks';
import { t, translate } from '@/locales';
import { useUserStore } from '@/store';
import { formatPrice } from '@/utils/format';
import { logError } from '@/utils/logger';
import type { ReceiptConfigData, ReceiptData } from '@/utils/receipt';
import { buildReceiptHtml } from '@/utils/receipt';

import { FIND_DATA, INITIAL_ROOM_DATA, INITIAL_SALE_DATA } from './constants';

// ============================================================
// 墓区销售基础页，整体分四块：通用定义 → 列表（筛选/查询/卡片）→ 详情 → 新建销售开单 20260828 梳理,
// ============================================================

// ==================== 通用：权限与视图切换 ====================
// 向tab记录登记组件真实name，修复后端路由name与组件name不一致导致切tab不保活、查询数据丢失的问题 20260828 修复,
useTabCacheName('Sale');

// 销售模块权限对象按 idMenu(103102) 精确匹配，权限不足时兼容空对象避免运行时报错 20260827 修改,
const userInfo = usePermission('103102');
// 经办人字段不再展示，后端保存时仍自动写入当前登录用户 operator 20260916 修改,

// 卡片状态标签配色：取状态枚举 key 末段(如 sold/buried)拼接胶囊标签修饰类 20260916 新增
const statusKey = (status?: string) => (status ? String(status).split('.').pop() || '' : '');

type FilterFormData = typeof FIND_DATA;
type RoomFormData = typeof INITIAL_ROOM_DATA;
type SaleFormData = typeof INITIAL_SALE_DATA;
// 提交数据排除实收金额字符串与创建日期：金额由数值字段提交，创建日期由后端审计自动写入 20260922 修改
type SaleSubmitData = Omit<SaleFormData, 'realPriceString' | 'createDate'> & {
  realPrice: number;
};

// 三个视图互斥显示：列表 / 详情 / 新建销售开单，切换逻辑收敛于公共 usePageSwitch 20260828 梳理,
const isListShow = ref(false);
const isDetailShow = ref(false);
const isCreateShow = ref(false);
const { controlPageShow } = usePageSwitch({
  list: isListShow,
  detail: isDetailShow,
  createModify: isCreateShow,
});

// ==================== 列表：状态与筛选下拉数据 ====================
// 区域由墓区销售下区域三级菜单经路由meta下发，挂载时读取一次；
// keep-alive按fullPath区分实例，各区域tab互不影响，无需响应式监听 20260831 新增,
const menuRegion = (useRoute().meta.region as string) || '';
const formfindData = ref<FilterFormData>({ ...FIND_DATA, region: menuRegion });
const saleCardViewport = ref<HTMLElement | null>(null);

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
const visibleSaleRoomList = computed(() =>
  searchRoomList.value.filter((item) => item.transferOutStatus !== TRANSFER_OUT_OUT),
);
// 卡片网格：按排分组补位/缩放控制/记录数文案统一由 useCardGrid 提供 20260914 抽取
const {
  zoom: saleZoom,
  handleZoomIn,
  handleZoomOut,
  cardRows: saleCardRows,
  totalText: listTotalText,
} = useCardGrid(visibleSaleRoomList);

// ==================== 列表：查询与筛选事件 ====================
// 按园区+区域请求可售墓位，加载完成后才置 hasQueried，避免先闪现“暂无数据”再切换为卡片 20260827 修改,

onMounted(() => {
  getRegionData();
  getParkData();
  // 列表不再默认查询展示，需用户选择园区后手动查询 20260831 修改,
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

// ==================== 新建：销售开单 ====================
const formRoomData = ref<RoomFormData>({ ...INITIAL_ROOM_DATA });
const formSaleData = ref<SaleFormData>({ ...INITIAL_SALE_DATA });

// 新建提交成功后置灰确认按钮防重复提交，重新进入表单时重置 20260922 新增
const saleSubmitted = ref(false);

const resetSaleForm = (idRoom = 0) => {
  saleSubmitted.value = false;
  formSaleData.value = {
    ...INITIAL_SALE_DATA,
    idRoom,
  };
};

// 表单标题随模式切换：idSale 非0为修改销售，否则为新建销售 20260907 新增
const formTitle = computed(() =>
  formSaleData.value.idSale !== 0 ? translate('pages.sale.modifyTitle') : translate('pages.sale.creatTitle'),
);

// 点击卡片“新建”：校验墓位可查后进入开单视图（原“销售”按钮改名而来）20260907 修改,
const handleClickSale = async (row: CardRowArg<RoomModel>) => {
  const currentRow = row.row ?? row;
  resetSaleForm(currentRow.idRoom);
  const loaded = await getRoomID(currentRow.idRoom);
  if (!loaded) {
    resetSaleForm();
    return;
  }
  controlPageShow('createModify');
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
    // 实收金额默认等于墓位价格，仍可手动修改；priceString 列已删，由数值 price 格式化 20260910 修改,
    formSaleData.value.realPriceString = formatPrice(dataQuery.price);
    return true;
  } catch (e) {
    logError(e);
    return false;
  }
};

// ==================== 新建：票据打印 ====================
// 经办人显示当前登录操作员姓名，开单保存时后端同样自动写入 20260921 新增
const userStore = useUserStore();

// 打印票据：校验付款人与金额后，点击手势内同步打开空白新标签页（原系统页不动），
// 查询收据配制后把完整票据文档直接写入新标签页并唤起浏览器打印对话框，不经 SPA 页面加载无中间页闪现 20260922 修改
const printReceipt = async () => {
  const { realPriceString, payer } = formSaleData.value;
  if (payer === undefined || payer.trim() === '') {
    return MessagePlugin.warning(translate('pages.sale.payerPlaceholder'));
  }
  if (realPriceString === undefined || realPriceString === '') {
    return MessagePlugin.warning(translate('pages.sale.realPricPlaceholder'));
  }
  const data: ReceiptData = {
    payer: String(payer).trim(),
    realPriceString: String(realPriceString),
    payee: String(formSaleData.value.payee ?? '').trim(),
    // 票据编号后缀取墓位卡号（yyyyymm+卡号）20260926 修改
    cardno: String(formRoomData.value.cardno ?? ''),
    // 票据编号前缀取销售创建日期，新建未保存时为空由工具回退当天日期 20260922 新增
    createDate: String(formSaleData.value.createDate ?? ''),
    region: String(formRoomData.value.region ?? ''),
    park: String(formRoomData.value.park ?? ''),
    yNum: String(formRoomData.value.yNum ?? ''),
    xNum: String(formRoomData.value.xNum ?? ''),
    userName: String(userStore.userName ?? ''),
  };
  // 收据配制（标题前缀/地址/电话）：打印读取不属页面操作，失败回退空值不阻断打印 20260922 修改
  let config: ReceiptConfigData = { prefix: '', phone: '', address: '' };
  try {
    const { list } = await getReceiptConfigForPrint(data.region);
    const item = list?.[0];
    if (item) {
      config = { prefix: item.prefix ?? '', phone: item.phone ?? '', address: item.address ?? '' };
    }
  } catch (e) {
    logError(e);
  }
  // 隐藏 iframe 打印会让打印预览覆盖系统页，改回新标签页方案：
  // 打开空白新标签页（屏幕无任何内容）写入票据文档，加载完成后直接唤起打印预览，原系统页保持不变可随时切回 20260922 修改
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    return MessagePlugin.warning(translate('pages.sale.printBlockedPrompt'));
  }
  const printDoc = printWindow.document;
  printDoc.open();
  printDoc.write(buildReceiptHtml(data, config));
  printDoc.close();
  // 等票据文档完全加载后再唤起打印，避免打印预览因页面加载未完成而一闪即关 20260922 修改
  const triggerPrint = () => {
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 100);
  };
  if (printDoc.readyState === 'complete') {
    triggerPrint();
  } else {
    printWindow.onload = triggerPrint;
  }
};

// 成交价失焦时格式化为千分位 20260828 梳理,
const changeNumberFocus = (value: string, number: string) => {
  if (value === 'price') {
    let val = number.replace(/\D/g, '');
    val = parseInt(val, 10).toString();
    val = val.replace(/\d{1,3}(?=(\d{3})+(\.|$))/g, '$&,');
    formSaleData.value.realPriceString = val;
  }
};

// 开单关闭：清空数据并回到列表 20260828 梳理,
const ClickCreateClose = () => {
  formRoomData.value = { ...INITIAL_ROOM_DATA };
  resetSaleForm();
  controlPageShow('list');
};

// ==================== 卡片：修改销售 ====================
// 点击卡片“修改”：加载墓位信息 + 已存在的活动销售记录回填表单后进入开单视图 20260907 新增
const handleClickModify = async (row: CardRowArg<RoomModel>) => {
  const currentRow = row.row ?? row;
  resetSaleForm(currentRow.idRoom);
  const loaded = await getRoomID(currentRow.idRoom);
  if (!loaded) {
    resetSaleForm();
    return;
  }
  const filled = await fillSaleForm(currentRow.idRoom);
  if (!filled) {
    resetSaleForm();
    return;
  }
  controlPageShow('createModify');
};

// 按墓位查询当前活动销售记录，回填开单可编辑字段及 idSale 20260907 新增
const fillSaleForm = async (idRoom: number) => {
  try {
    const { list } = await getSaleByRoom(idRoom);
    if (!list || list.length === 0) {
      return false;
    }
    const record = list[0];
    formSaleData.value = {
      idSale: record.idSale,
      idRoom,
      realPrice: record.realPrice ?? 0,
      realPriceString: record.realPrice ? formatPrice(record.realPrice) : '',
      payer: record.payer ?? '',
      payerPhone: record.payerPhone ?? '',
      remark: record.remark ?? '',
      payerIDCard: record.payerIDCard ?? '',
      // 收款人与编号回填 20260918 新增
      payee: record.payee ?? '',
      serialNo: record.serialNo ?? '',
      // 创建日期回填：票据编号取 yyyymm 前缀 20260922 新增
      createDate: record.createDate ?? '',
    };
    return true;
  } catch (e) {
    logError(e);
    return false;
  }
};

// ==================== 卡片：删除销售 ====================
const confirmVisible = ref(false);
// 待删除销售的墓位行数据，卡片操作直接传入 20260907 新增
const deleteSaleRow = ref<RoomModel | null>(null);
const dialogHeader = translate('operate.deleteDataCPrompt');

const confirmBody = computed(() => {
  if (deleteSaleRow.value) {
    const { park, yNum, xNum } = deleteSaleRow.value;
    return `${translate('operate.deleteDataAPrompt')}${park}${yNum}${translate('operate.row')}${xNum}${translate(
      'pages.sale.deleteInfoPrompt',
    )}`;
  }
  return '';
});

const resetDeleteRow = () => {
  deleteSaleRow.value = null;
};

const onCancel = () => {
  resetDeleteRow();
};

// 点击卡片“删除”：记录待删除墓位并弹出二次确认 20260907 新增
const handleClickDelete = (row: CardRowArg<RoomModel>) => {
  const currentRow = row.row ?? row;
  deleteSaleRow.value = currentRow;
  confirmVisible.value = true;
};

// 确认删除：软删除销售记录并回置墓位销售状态为未销售，成功后刷新列表 20260907 新增
const onConfirmDelete = async () => {
  if (!deleteSaleRow.value) {
    return;
  }
  const { idRoom } = deleteSaleRow.value;
  try {
    await deleteSale(idRoom);
    await getRoomData();
    MessagePlugin.success(translate('operate.deleteSuccessPrompt'));
  } catch (e) {
    logError(e);
  }
  resetDeleteRow();
  confirmVisible.value = false;
};

// 提交开单数据，校验必填项与成交价后调用新增接口 20260828 梳理,
const ClickSubmit = async () => {
  const { realPriceString, payer, payerPhone, remark, idRoom, idSale, payerIDCard, payee, serialNo } =
    formSaleData.value;

  if (realPriceString === undefined || realPriceString === '') {
    return MessagePlugin.warning(translate('pages.sale.realPricPlaceholder'));
  }
  if (payer === undefined || payer.trim() === '') {
    return MessagePlugin.warning(translate('pages.sale.payerPlaceholder'));
  }
  if (payerPhone === undefined || payerPhone.trim() === '') {
    return MessagePlugin.warning(translate('operate.phonePlaceholder'));
  }

  const realPrice = Number(realPriceString.replace(/,/g, ''));
  if (Number.isNaN(realPrice) || realPrice <= 0) {
    return MessagePlugin.warning(translate('pages.sale.realPricPlaceholder'));
  }

  const payload: SaleSubmitData = {
    idSale,
    idRoom,
    realPrice,
    payer: payer.trim(),
    payerPhone: payerPhone.trim(),
    remark,
    // 付款人扩展字段随开单提交保存 20260901 新增,
    payerIDCard: payerIDCard.trim(),
    // 收款人与编号随开单提交保存 20260918 新增,
    payee: payee.trim(),
    serialNo: serialNo.trim(),
  };

  if (idSale === 0) {
    try {
      await insertSale(payload);
      MessagePlugin.success(translate('operate.createdSuccessPrompt'));
      await getRoomData();
      // 新建提交成功不返回列表，留在表单页以便打印票据，确认按钮置灰防重复提交 20260922 修改
      saleSubmitted.value = true;
    } catch (e) {
      logError(e);
      MessagePlugin.error(translate('operate.createdFailedPrompt'));
    }
  } else {
    // 修改销售：idSale 非0 走更新接口；提交成功不返回，留在表单页可继续调整或打印票据 20260922 修改
    try {
      await updateSale(payload);
      MessagePlugin.success(translate('operate.modifySuccessPrompt'));
      await getRoomData();
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

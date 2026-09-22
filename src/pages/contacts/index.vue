<template>
  <div>
    <!-- 列表开始 -->
    <div v-show="isListShow" class="table-tree-container">
      <div class="list-tree-content contacts-page-content">
        <div
          class="list-common-table contacts-list-panel"
          :class="{ 'contacts-list-panel--full': hasQueried && contactsCardRows.length }"
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
                  <!-- 区域由墓区业务下区域三级菜单经路由下发，此处仅保留园区/排号筛选 20260909 新增 -->
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
          <div v-if="hasQueried && !contactsCardRows.length" class="contacts-no-data">暂无数据</div>

          <div v-if="hasQueried && contactsCardRows.length" class="contacts-list-body">
            <div ref="contactsCardViewport" class="table-container contacts-card-layout">
              <div v-if="contactsCardRows.length" class="contacts-card-rows" :style="{ zoom: contactsZoom }">
                <div v-for="rowGroup in contactsCardRows" :key="rowGroup.yNum" class="contacts-card-row">
                  <div class="contacts-card-grid">
                    <div
                      v-for="card in rowGroup.cards"
                      :key="`${rowGroup.yNum}-${card.xNum}`"
                      class="contacts-card"
                      :class="{ 'contacts-card--empty': card.placeholder }"
                    >
                      <template v-if="card.placeholder">
                        <!-- 空位卡序号与正常卡同样顶部对齐 20260909 新增 -->
                        <div class="contacts-card__header">
                          <div class="contacts-card__serial">{{ rowGroup.yNum }} 排 {{ card.xNum }} 号</div>
                        </div>
                        <div class="contacts-card__body">
                          <div class="contacts-card__empty-text">空位</div>
                        </div>
                      </template>
                      <template v-else>
                        <div class="contacts-card__header">
                          <!-- 卡片首行改为展示xyNumber编号字段，与墓区设置/销售/预定页一致；缺失时回退 yNum/xNum 拼接，与下葬页一致 20260917 修改 -->
                          <div class="contacts-card__serial">
                            {{ card.row.xyNumber || `${rowGroup.yNum} 排 ${card.row.xNum} 号` }}
                          </div>
                          <!-- 墓穴类型值上移至首行右侧胶囊，去掉标题 20260917 修改 -->
                          <div class="contacts-card__type">{{ $t(card.row.roomType) }}</div>
                        </div>
                        <div class="contacts-card__body">
                          <!-- 购买人/下葬者/联系人/价格：标签在左灰色、值在右深色两端对齐，与墓区下葬页卡片信息内容一致 20260917 修改 -->
                          <div class="contacts-card__meta">
                            <span class="contacts-card__meta-label">{{ $t('pages.room.buyer') }}</span>
                            <!-- 购买人无值时默认显示“无”，与下葬页一致 20260917 修改 -->
                            <span class="contacts-card__meta-value">{{ card.row.buyer || $t('common.none') }}</span>
                          </div>
                          <div class="contacts-card__meta">
                            <span class="contacts-card__meta-label">{{ $t('pages.room.buriedPerson') }}</span>
                            <!-- 下葬者超过7字截断为前7字+省略号，悬停提示完整内容，与下葬页一致 20260917 修改 -->
                            <t-tooltip v-if="isOverflow(card.row.deceased)" :content="String(card.row.deceased)">
                              <span class="contacts-card__meta-value">{{ truncateText(card.row.deceased) }}</span>
                            </t-tooltip>
                            <!-- 下葬者无值时默认显示“无”，与下葬页一致 20260917 修改 -->
                            <span v-else class="contacts-card__meta-value">
                              {{ card.row.deceased || $t('common.none') }}
                            </span>
                          </div>
                          <!-- 联系人：room 表字段，存所有联系人，与下葬页一致 20260917 修改 -->
                          <div class="contacts-card__meta">
                            <span class="contacts-card__meta-label">{{ $t('pages.room.contacts') }}</span>
                            <!-- 联系人超过7字截断为前7字+省略号，悬停提示完整内容，与下葬页一致 20260917 修改 -->
                            <t-tooltip v-if="isOverflow(card.row.contacts)" :content="String(card.row.contacts)">
                              <span class="contacts-card__meta-value">{{ truncateText(card.row.contacts) }}</span>
                            </t-tooltip>
                            <!-- 联系人无值时默认显示“无”，与下葬页一致 20260917 修改 -->
                            <span v-else class="contacts-card__meta-value">{{
                              card.row.contacts || $t('common.none')
                            }}</span>
                          </div>
                          <!-- priceString 列已删，卡片价格改由数值 price 千分位格式化 20260910 修改 -->
                          <div class="contacts-card__meta">
                            <span class="contacts-card__meta-label">{{ $t('pages.room.price') }}</span>
                            <span class="contacts-card__meta-value">{{ formatPrice(card.row.price) }}</span>
                          </div>
                          <!-- 销售/下葬状态改为两枚胶囊标签两端分布，去掉标题 20260917 修改 -->
                          <div class="contacts-card__status">
                            <span
                              class="contacts-card__tag"
                              :class="`contacts-card__tag--${statusKey(card.row.saleStatus)}`"
                            >
                              {{ $t(card.row.saleStatus) }}
                            </span>
                            <span
                              class="contacts-card__tag"
                              :class="`contacts-card__tag--${statusKey(card.row.intoStatus)}`"
                            >
                              {{ $t(card.row.intoStatus) }}
                            </span>
                          </div>
                        </div>
                        <div class="contacts-card__actions">
                          <t-link theme="primary" @click="handleClickDetail(card.row)">{{
                            $t('operate.detail')
                          }}</t-link>
                          <!-- 墓位联系人于墓位售出后登记，故仅“已销售”墓位显示新建，并按新建权限门控；支持一穴多个联系人 20260909 新增 -->
                          <t-link
                            v-if="card.row.saleStatus === SALE_SOLD && userInfo.useCreate === 1"
                            theme="danger"
                            @click="handleClickCreate(card.row)"
                          >
                            {{ $t('operate.create') }}
                          </t-link>
                          <!-- 已销售按修改权限显示“修改”，点击进入修改页选择要修改的联系人记录 20260909 新增 -->
                          <t-link
                            v-if="card.row.saleStatus === SALE_SOLD && userInfo.useModify === 1"
                            theme="primary"
                            @click="handleClickModify(card.row)"
                          >
                            {{ $t('operate.modify') }}
                          </t-link>
                          <!-- 已销售按删除权限显示“删除”，点击进入删除页逐行删除联系人记录 20260909 新增 -->
                          <t-link
                            v-if="card.row.saleStatus === SALE_SOLD && userInfo.useDelete === 1"
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
          <div v-if="hasQueried && contactsCardRows.length" class="contacts-list-toolbar">
            <span>{{ listTotalText }}</span>
            <span class="contacts-list-toolbar__zoom">
              <zoom-in-icon class="contacts-list-toolbar__zoom-icon" @click="handleZoomIn" />
              <zoom-out-icon class="contacts-list-toolbar__zoom-icon" @click="handleZoomOut" />
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
    <!-- 墓位联系人登记（新建/修改/删除）开始 -->
    <div v-if="isCreateShow">
      <t-form class="base-form" :data="formContactsData" label-align="top" :label-width="100">
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
              <!-- 下葬状态独占整行：展示该墓位当前下葬情况，作为联系人登记的墓位上下文 20260909 新增 -->
              <t-col :span="12">
                <span>{{ $t('pages.room.intoStatus') }} : {{ t(formRoomData.intoStatus) }}</span>
              </t-col>

              <!-- 修改/删除模式：墓穴信息下方以列表展示全部联系人记录；修改用单选列回填表单，删除用操作列逐行删除 20260909 新增 -->
              <t-col v-if="isModifyMode || isDeleteMode" :span="12">
                <t-form-item name="idContacts">
                  <t-table
                    v-model:selected-row-keys="selectedContactsKeys"
                    class="contacts-record-table"
                    :data="contactsRecords"
                    :columns="isDeleteMode ? deleteColumns : modifyColumns"
                    row-key="idContacts"
                    :bordered="true"
                    size="small"
                    :max-height="240"
                    @select-change="onSelectContactsRecord"
                  >
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
                <t-form-item :required="true" :label="$t('pages.contacts.contacts')" name="contacts">
                  <t-input
                    v-model="formContactsData.contacts"
                    :maxcharacter="20"
                    show-limit-number
                    :style="{ width: '322px' }"
                    :placeholder="$t('pages.contacts.contactsPlaceholder')"
                  />
                </t-form-item>
              </t-col>
              <t-col v-if="!isDeleteMode" :span="6">
                <t-form-item :label="$t('pages.contacts.contactsPhone')" name="contactsPhone">
                  <t-input
                    v-model="formContactsData.contactsPhone"
                    :maxcharacter="11"
                    show-limit-number
                    :style="{ width: '322px' }"
                    :placeholder="$t('pages.contacts.contactsPhonePlaceholder')"
                  />
                </t-form-item>
              </t-col>
              <t-col v-if="!isDeleteMode" :span="6">
                <t-form-item :label="$t('pages.contacts.contactsIDCard')" name="contactsIDCard">
                  <t-input
                    v-model="formContactsData.contactsIDCard"
                    :maxcharacter="18"
                    show-limit-number
                    :style="{ width: '322px' }"
                    :placeholder="$t('pages.contacts.contactsIDCardPlaceholder')"
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
    <!-- 墓位联系人登记结束 -->
    <!-- 删除联系人记录二次确认弹窗，参照墓区下葬页 20260909 新增 -->
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
  name: 'Contacts',
};
</script>
<script setup lang="ts">
import type { AxiosError } from 'axios';
import { RollbackIcon, ZoomInIcon, ZoomOutIcon } from 'tdesign-icons-vue-next';
import type { PrimaryTableCol } from 'tdesign-vue-next';
import { MessagePlugin } from 'tdesign-vue-next';
import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';

import { deleteContacts, getContactsList, getRoomList, insertContacts, updateContacts } from '@/api/contacts';
import type { ContactsModel } from '@/api/model/contactsModel';
import type { RoomModel } from '@/api/model/roomModel';
import { getIdList } from '@/api/room';
import RoomDetail from '@/components/room-detail/index.vue';
import { BUSINESS_BASIC_FORM_LABEL_WIDTH } from '@/constants';
import type { CardRowArg } from '@/hooks';
import { useCardGrid, usePageSwitch, useParkRoomFilter, usePermission, useRoomDetail, useTabCacheName } from '@/hooks';
import { t, translate } from '@/locales';
import { formatPrice } from '@/utils/format';
import { logError } from '@/utils/logger';

import { FIND_DATA, INITIAL_CONTACTS_DATA, INITIAL_ROOM_DATA } from './constants';

// ============================================================
// 墓位联系人页，参照墓区下葬页卡片网格：通用定义 → 列表（筛选/查询/卡片）→ 详情 → 联系人登记（新建/修改/删除）20260909 新增,
// ============================================================

// ==================== 通用：权限与视图切换 ====================
// 向tab记录登记组件真实name，修复后端路由name与组件name不一致导致切tab不保活的问题 20260909 新增,
useTabCacheName('Contacts');

// 墓位联系人权限对象按 idMenu(103105) 精确匹配，权限不足时兼容空对象避免运行时报错 20260909 新增
const userInfo = usePermission('103105');

// 销售状态：已销售。墓位联系人于墓位售出后登记，仅“已销售”墓位显示新建/修改/删除 20260909 新增
const SALE_SOLD = 'statusType.saleStatusEnum.sold';

type FilterFormData = typeof FIND_DATA;
type RoomFormData = typeof INITIAL_ROOM_DATA;
type ContactsFormData = typeof INITIAL_CONTACTS_DATA;

// 视图互斥显示：列表 / 详情 / 联系人登记（新建、修改、删除复用同一表单）20260909 新增,
const isListShow = ref(false);
const isDetailShow = ref(false);
const isCreateShow = ref(false);

const formRoomData = ref<RoomFormData>({ ...INITIAL_ROOM_DATA });
const formContactsData = ref<ContactsFormData>({ ...INITIAL_CONTACTS_DATA });

// 视图互斥切换收敛于公共 usePageSwitch，模板引用名保持不变 20260914 抽取
const { controlPageShow } = usePageSwitch({
  list: isListShow,
  detail: isDetailShow,
  create: isCreateShow,
});

// ==================== 列表：状态与筛选下拉数据 ====================
// 区域由墓区业务下区域三级菜单经路由meta下发，挂载时读取一次；
// keep-alive按fullPath区分实例，各区域tab互不影响，无需响应式监听 20260909 新增,
const menuRegion = (useRoute().meta.region as string) || '';
// 状态胶囊修饰类：提取枚举 key 最后一段（如 sold/buried），与墓区设置/销售/预定页一致 20260917 新增
const statusKey = (status?: string) => (status ? String(status).split('.').pop() || '' : '');
// 卡片长文本截断：下葬者/联系人超过7字显示前7字+省略号，悬停 tooltip 展示完整内容，与下葬页一致 20260917 新增
const truncateText = (value?: string | null) => {
  const text = String(value || '');
  return text.length > 7 ? `${text.slice(0, 7)}…` : text;
};
// 是否超过7字需要截断并显示悬停提示，与下葬页一致 20260917 新增
const isOverflow = (value?: string | null) => String(value || '').length > 7;
const formfindData = ref<FilterFormData>({ ...FIND_DATA, region: menuRegion });
const contactsCardViewport = ref<HTMLElement | null>(null);

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
// 迁出状态：已迁出。已迁出的墓位不展示（迁出为终态，其展示由迁出查询页负责）20260921 新增
const TRANSFER_OUT_OUT = 'statusType.transferOutStatusEnum.out';
// 卡片列表过滤已迁出的墓位后再进入网格补位 20260921 新增
const visibleContactsRoomList = computed(() =>
  searchRoomList.value.filter((item) => item.transferOutStatus !== TRANSFER_OUT_OUT),
);
// 卡片网格（缩放/分组补位/记录数）收敛于公共 useCardGrid，模板引用名保持不变 20260914 抽取
const {
  zoom: contactsZoom,
  handleZoomIn,
  handleZoomOut,
  cardRows: contactsCardRows,
  totalText: listTotalText,
} = useCardGrid(visibleContactsRoomList);

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

// ==================== 联系人登记：新建 / 修改 / 删除 ====================
// 删除模式：复用联系人登记视图，仅展示墓穴信息+记录列表(操作列删除)，隐藏可编辑表单与提交区 20260909 新增
const isDeleteMode = ref(false);
// 表单标题随模式切换：删除 > 修改 > 新建 20260909 新增
const formTitle = computed(() => {
  if (isDeleteMode.value) {
    return translate('pages.contacts.deleteTitle');
  }
  return formContactsData.value.idContacts !== 0
    ? translate('pages.contacts.modifyTitle')
    : translate('pages.contacts.creatTitle');
});

// 修改模式下在墓穴信息下方以列表展示“选择联系人记录”；contactsRecords 为该墓位全部活动联系人记录（后端按 idContacts DESC，[0] 为最新）20260909 新增
const isModifyMode = ref(false);
const contactsRecords = ref<ContactsModel[]>([]);
// 列表单选选中的联系人记录 idContacts（默认最新一条），及展示完整信息的列定义 20260909 新增
const selectedContactsKeys = ref<Array<string | number>>([]);
const modifyColumns: PrimaryTableCol[] = [
  { title: translate('pages.contacts.contacts'), colKey: 'contacts' },
  { title: translate('pages.contacts.contactsPhone'), colKey: 'contactsPhone', width: 140 },
  { title: translate('pages.contacts.contactsIDCard'), colKey: 'contactsIDCard', width: 180 },
  // 选择列（单选 radio）置于最后一列 20260909 新增
  { title: translate('pages.contacts.select'), colKey: 'row-select', type: 'single', width: 50 },
];

// 删除页记录列表列：与修改页一致，但末列由“选择”单选列改为“操作”列（逐行删除按钮）20260909 新增
const deleteColumns: PrimaryTableCol[] = [
  { title: translate('pages.contacts.contacts'), colKey: 'contacts' },
  { title: translate('pages.contacts.contactsPhone'), colKey: 'contactsPhone', width: 140 },
  { title: translate('pages.contacts.contactsIDCard'), colKey: 'contactsIDCard', width: 180 },
  { title: translate('operate.operation'), colKey: 'op', width: 90 },
];

const resetContactsForm = (idRoom = 0) => {
  formContactsData.value = {
    ...INITIAL_CONTACTS_DATA,
    idRoom,
  };
};

// 用选中的联系人记录回填表单（供修改），字段与 INITIAL_CONTACTS_DATA 结构一致 20260909 新增
const fillContactsForm = (record: ContactsModel) => {
  formContactsData.value = {
    idContacts: record.idContacts,
    idRoom: record.idRoom,
    contacts: record.contacts ?? '',
    contactsPhone: record.contactsPhone ?? '',
    contactsIDCard: record.contactsIDCard ?? '',
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

// 点击卡片“新建”：进入联系人登记页（新建），清空表单并带入墓位信息 20260909 新增,
const handleClickCreate = async (row: CardRowArg<RoomModel>) => {
  const currentRow = row.row ?? row;
  isModifyMode.value = false;
  isDeleteMode.value = false;
  contactsRecords.value = [];
  selectedContactsKeys.value = [];
  resetContactsForm(currentRow.idRoom);
  await getRoomID(currentRow.idRoom);
  controlPageShow('create');
};

// 取消：重置联系人表单，保持当前墓位 20260909 新增,
const onReset = () => {
  resetContactsForm(formRoomData.value.idRoom);
};

// 联系人登记关闭：清空数据并回到列表 20260909 新增,
const ClickCreateClose = () => {
  formRoomData.value = { ...INITIAL_ROOM_DATA };
  resetContactsForm();
  isModifyMode.value = false;
  isDeleteMode.value = false;
  contactsRecords.value = [];
  selectedContactsKeys.value = [];
  controlPageShow('list');
};

// ==================== 卡片：修改 / 删除（多条联系人记录选择）====================
// 删除二次确认弹窗，提示文案参照墓区下葬页：删除后，园区+排+序号 + 联系人信息将被清空 20260909 新增
const confirmVisible = ref(false);
const deleteTarget = ref<{ idContacts: number; idRoom: number; contacts: string } | null>(null);
const dialogHeader = translate('operate.deleteDataCPrompt');
const confirmBody = computed(() => {
  if (!deleteTarget.value) {
    return '';
  }
  const { park, yNum, xNum } = formRoomData.value;
  return `${translate('operate.deleteDataAPrompt')}${park}${yNum}${translate('operate.row')}${xNum}${translate(
    'pages.contacts.deleteInfoPrompt',
  )}`;
});
const onCancel = () => {
  deleteTarget.value = null;
};

// 列表单选联系人记录：选中行变化时用该记录回填下方修改表单 20260909 新增
const onSelectContactsRecord = (keys: Array<string | number>) => {
  const id = Number(keys[0]);
  const record = contactsRecords.value.find((item) => item.idContacts === id);
  if (record) {
    fillContactsForm(record);
  }
};

// 点击卡片“修改”：进入修改页，墓穴信息下方列出全部联系人记录，默认选中最后一条（最新）20260909 新增,
const handleClickModify = async (row: CardRowArg<RoomModel>) => {
  const currentRow = row.row ?? row;
  try {
    const { list } = await getContactsList(currentRow.idRoom);
    if (!list || list.length === 0) {
      MessagePlugin.warning(translate('pages.contacts.noRecord'));
      return;
    }
    // 后端已按 idContacts DESC 排序，list[0] 即最后一条（最新）联系人记录，默认单选它
    contactsRecords.value = list;
    isModifyMode.value = true;
    isDeleteMode.value = false;
    resetContactsForm(currentRow.idRoom);
    await getRoomID(currentRow.idRoom);
    fillContactsForm(list[0]);
    selectedContactsKeys.value = [list[0].idContacts];
    controlPageShow('create');
  } catch (e) {
    logError(e);
  }
};

// 点击卡片“删除”：进入删除页（复用联系人登记视图 isDeleteMode），墓穴信息下方列出全部联系人记录，操作列逐行删除 20260909 新增
const handleClickDelete = async (row: CardRowArg<RoomModel>) => {
  const currentRow = row.row ?? row;
  try {
    const { list } = await getContactsList(currentRow.idRoom);
    if (!list || list.length === 0) {
      MessagePlugin.warning(translate('pages.contacts.noRecord'));
      return;
    }
    contactsRecords.value = list;
    isModifyMode.value = false;
    isDeleteMode.value = true;
    selectedContactsKeys.value = [];
    resetContactsForm(currentRow.idRoom);
    await getRoomID(currentRow.idRoom);
    controlPageShow('create');
  } catch (e) {
    logError(e);
  }
};

// 删除页操作列“删除”：记录待删除目标并打开二次确认 20260909 新增,
const onSelectRecord = (record: ContactsModel) => {
  deleteTarget.value = { idContacts: record.idContacts, idRoom: record.idRoom, contacts: record.contacts };
  confirmVisible.value = true;
};

// 确认删除：软删除选中的联系人记录（联系人删除不回置墓位状态）；成功后刷新列表并关闭删除页 20260909 新增
const onConfirmDelete = async () => {
  if (!deleteTarget.value) {
    return;
  }
  const { idContacts, idRoom } = deleteTarget.value;
  deleteTarget.value = null;
  confirmVisible.value = false;
  try {
    await deleteContacts(idContacts, idRoom);
    MessagePlugin.success(translate('operate.deleteSuccessPrompt'));
    await getRoomData();
    ClickCreateClose();
  } catch (e) {
    logError(e);
  }
};

// 提交联系人登记：idContacts 为0走新增，否则走修改；成功后刷新列表 20260909 新增,

const ClickSubmit = async () => {
  if (formContactsData.value.contacts === '') {
    return MessagePlugin.warning(translate('pages.contacts.contactsPlaceholder'));
  }

  if (formContactsData.value.idContacts === 0) {
    try {
      await insertContacts(formContactsData.value);
      MessagePlugin.success(translate('operate.createdSuccessPrompt'));
      await getRoomData();
      ClickCreateClose();
    } catch (e) {
      logError(e);
      // 后端拒绝时展示具体原因(如重名提示),否则回退到通用失败词条 20260913 修改
      const errMsg = (e as AxiosError<{ error?: string }>)?.response?.data?.error;
      MessagePlugin.error(errMsg || translate('operate.createdFailedPrompt'));
    }
  } else {
    try {
      await updateContacts(formContactsData.value);
      MessagePlugin.success(translate('operate.modifySuccessPrompt'));
      await getRoomData();
      ClickCreateClose();
    } catch (e) {
      logError(e);
      // 后端拒绝时展示具体原因(如重名提示),否则回退到通用失败词条 20260913 修改
      const errMsg = (e as AxiosError<{ error?: string }>)?.response?.data?.error;
      MessagePlugin.error(errMsg || translate('operate.modifyFailedPrompt'));
    }
  }
};
</script>
<style lang="less" scoped>
@import './index.less';
</style>

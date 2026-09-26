<template>
  <div>
    <!-- 列表开始 -->
    <div v-show="isListShow" class="table-tree-container">
      <div class="list-tree-content buried-page-content">
        <div
          class="list-common-table buried-list-panel"
          :class="{ 'buried-list-panel--full': hasQueried && buriedCardRows.length }"
        >
          <!-- 标题为两字短词，label 宽度收窄以减小与下拉框的空隙 20260913 修改 -->
          <t-form
            class="cms-card-filter-bar"
            :data="formfindData"
            :label-width="BUSINESS_BASIC_FORM_LABEL_WIDTH"
            colon
            @submit="onSubmit"
          >
            <t-row>
              <t-col :span="10">
                <!-- 园区与排号直接相邻排列，间距由 flex gap 固定，消除栅格列内空白 20260913 修改 -->
                <div class="cms-card-filter-inline">
                  <!-- 区域下拉框移除，改由墓区下葬下区域三级菜单经路由下发 20260907 修改 -->
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

              <!-- 重置按钮移除，保留查询按钮即可 20260913 修改 -->
              <t-col :span="2" class="operation-container">
                <t-button theme="primary" type="submit">
                  {{ $t('operate.query') }}
                </t-button>
              </t-col>
            </t-row>
          </t-form>

          <!-- 查询后无数据时不展示卡片区，仅在筛选表单下方居中提示 20260907 修改 -->
          <div v-if="hasQueried && !buriedCardRows.length" class="buried-no-data">暂无数据</div>

          <div v-if="hasQueried && buriedCardRows.length" class="buried-list-body">
            <div ref="buriedCardViewport" class="table-container buried-card-layout">
              <div v-if="buriedCardRows.length" class="buried-card-rows" :style="{ zoom: buriedZoom }">
                <div v-for="rowGroup in buriedCardRows" :key="rowGroup.yNum" class="buried-card-row">
                  <div class="buried-card-grid">
                    <div
                      v-for="card in rowGroup.cards"
                      :key="`${rowGroup.yNum}-${card.xNum}`"
                      class="buried-card"
                      :class="{ 'buried-card--empty': card.placeholder }"
                    >
                      <template v-if="card.placeholder">
                        <!-- 空位卡序号与正常卡同样顶部对齐 20260907 修改 -->
                        <div class="buried-card__header">
                          <div class="buried-card__serial">{{ rowGroup.yNum }} 排 {{ card.xNum }} 号</div>
                        </div>
                        <div class="buried-card__body">
                          <div class="buried-card__empty-text">空位</div>
                        </div>
                      </template>
                      <template v-else>
                        <div class="buried-card__header">
                          <!-- 排号改取 xyNumber 字段(自定义坐标名)，缺失时回退 yNum/xNum 拼接 20260913 修改 -->
                          <div class="buried-card__serial">
                            {{ card.row.xyNumber || `${rowGroup.yNum} 排 ${card.row.xNum} 号` }}
                          </div>
                          <!-- 墓穴类型标题去掉，值改为胶囊标签上移至卡片第一行右侧 20260913 修改 -->
                          <span class="buried-card__type">{{ $t(card.row.roomType).trim() }}</span>
                        </div>
                        <div class="buried-card__body">
                          <!-- 购墓人/下葬者/联系人/期限：标签在左灰色、值在右深色两端对齐 20260913 修改 20260921 价格改期限 -->
                          <div class="buried-card__meta">
                            <span class="buried-card__meta-label">{{ $t('pages.room.buyer') }}</span>
                            <!-- 购墓人无值时默认显示“无” 20260916 修改 -->
                            <span class="buried-card__meta-value">{{ card.row.buyer || $t('common.none') }}</span>
                          </div>
                          <div class="buried-card__meta">
                            <span class="buried-card__meta-label">{{ $t('pages.room.buriedPerson') }}</span>
                            <!-- 下葬者超过7字截断为前7字+省略号，悬停提示完整内容 20260913 新增 -->
                            <t-tooltip v-if="isOverflow(card.row.deceased)" :content="String(card.row.deceased)">
                              <span class="buried-card__meta-value">{{ truncateText(card.row.deceased) }}</span>
                            </t-tooltip>
                            <!-- 下葬者无值时默认显示“无” 20260916 修改 -->
                            <span v-else class="buried-card__meta-value">
                              {{ card.row.deceased || $t('common.none') }}
                            </span>
                          </div>
                          <!-- 联系人：room 表字段，存所有联系人 20260913 修改 -->
                          <div class="buried-card__meta">
                            <span class="buried-card__meta-label">{{ $t('pages.room.contacts') }}</span>
                            <!-- 联系人超过7字截断为前7字+省略号，悬停提示完整内容 20260913 新增 -->
                            <t-tooltip v-if="isOverflow(card.row.contacts)" :content="String(card.row.contacts)">
                              <span class="buried-card__meta-value">{{ truncateText(card.row.contacts) }}</span>
                            </t-tooltip>
                            <!-- 联系人无值时默认显示“无” 20260916 修改 -->
                            <span v-else class="buried-card__meta-value">{{
                              card.row.contacts || $t('common.none')
                            }}</span>
                          </div>
                          <!-- 价格信息已去除，改为期限信息（管理费结束日期），标签用短词条避免卡片内换行，与管理费收款页卡片一致 20260921 修改 -->
                          <div class="buried-card__meta">
                            <span class="buried-card__meta-label">{{ $t('pages.adminfee.period') }}</span>
                            <!-- 期限无值时默认显示“无” 20260921 新增 -->
                            <span class="buried-card__meta-value">{{
                              formatDate(card.row.endDate) || $t('common.none')
                            }}</span>
                          </div>
                          <!-- 预定状态行已移除；销售/下葬状态改为两枚彩色胶囊标签两端分布 20260913 修改 -->
                          <div class="buried-card__status">
                            <span
                              class="buried-card__tag"
                              :class="`buried-card__tag--${statusKey(card.row.saleStatus)}`"
                            >
                              {{ $t(card.row.saleStatus) }}
                            </span>
                            <span
                              class="buried-card__tag"
                              :class="`buried-card__tag--${statusKey(card.row.intoStatus)}`"
                            >
                              {{ $t(card.row.intoStatus) }}
                            </span>
                          </div>
                        </div>
                        <div class="buried-card__actions">
                          <t-link theme="primary" @click="handleClickDetail(card.row)">{{
                            $t('operate.detail')
                          }}</t-link>
                          <!-- 仅“已销售”墓位显示新建下葬（未售/预定不显示），并按新建权限门控；支持一穴多次下葬 20260908 修改 -->
                          <t-link
                            v-if="card.row.saleStatus === SALE_SOLD && userInfo.useCreate === 1"
                            theme="danger"
                            @click="handleClickCreate(card.row)"
                          >
                            {{ $t('operate.create') }}
                          </t-link>
                          <!-- 已下葬（存在下葬记录）按修改权限显示“修改”，点击弹窗选择要修改的记录 20260907 新增 -->
                          <t-link
                            v-if="card.row.intoStatus !== INTO_INCOMPLET && userInfo.useModify === 1"
                            theme="primary"
                            @click="handleClickModify(card.row)"
                          >
                            {{ $t('operate.modify') }}
                          </t-link>
                          <!-- 已下葬按删除权限显示“删除”，点击弹窗选择要删除的记录 20260907 新增 -->
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

          <!-- 列表底部工具行：左侧记录数，右侧放大/缩小卡片列表 20260907 修改 -->
          <div v-if="hasQueried && buriedCardRows.length" class="buried-list-toolbar">
            <span>{{ listTotalText }}</span>
            <span class="buried-list-toolbar__zoom">
              <zoom-in-icon class="buried-list-toolbar__zoom-icon" @click="handleZoomIn" />
              <zoom-out-icon class="buried-list-toolbar__zoom-icon" @click="handleZoomOut" />
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
    <!-- 下葬登记（新建/修改）开始 -->
    <div v-if="isCreateShow">
      <t-form class="base-form" :data="formBuriedData" label-align="top" :label-width="100">
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
              <!-- 去掉排号/序号，原排号位置改为显示编号xyNumber 20260907 修改 -->
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
              <!-- 下葬状态独占整行：强制新建页表单首项（安葬者）另起一行排在其正下方 20260908 修改 -->
              <t-col :span="12">
                <span>{{ $t('pages.room.intoStatus') }} : {{ t(formRoomData.intoStatus) }}</span>
              </t-col>

              <!-- 修改/删除模式：墓穴信息下方以列表展示全部下葬记录；修改用单选列回填表单，删除用操作列逐行删除 20260908 修改 -->
              <t-col v-if="isModifyMode || isDeleteMode" :span="12">
                <t-form-item name="idBuried">
                  <t-table
                    v-model:selected-row-keys="selectedBuriedKeys"
                    class="buried-record-table"
                    :data="buriedRecords"
                    :columns="isDeleteMode ? deleteColumns : modifyColumns"
                    row-key="idBuried"
                    :bordered="true"
                    size="small"
                    :max-height="240"
                    @select-change="onSelectBuriedRecord"
                  >
                    <!-- 下葬日期库中为 datetime，列表统一格式化为 yyyy-mm-dd 20260907 新增 -->
                    <template #burialDate="{ row }">
                      {{ formatDate(row.burialDate) }}
                    </template>
                    <!-- 删除模式操作列：逐行“删除”按钮，点击弹出同墓区预定的二次确认 20260908 新增 -->
                    <template #op="{ row }">
                      <t-link theme="danger" @click="onSelectRecord(row)">
                        {{ $t('operate.delete') }}
                      </t-link>
                    </template>
                  </t-table>
                </t-form-item>
              </t-col>

              <t-col v-if="!isDeleteMode" :span="6">
                <t-form-item :required="true" :label="$t('pages.buried.deceased')" name="deceased">
                  <t-input
                    v-model="formBuriedData.deceased"
                    :maxcharacter="20"
                    show-limit-number
                    :style="{ width: '322px' }"
                    :placeholder="$t('pages.buried.deceasedPlaceholder')"
                  />
                </t-form-item>
              </t-col>
              <!-- 安葬者身份证号，安葬者后新增，非必填，最长18位与销售页统一 20260917 修改 -->
              <t-col v-if="!isDeleteMode" :span="6">
                <t-form-item :label="$t('pages.buried.deceasedIDCard')" name="deceasedIDCard">
                  <t-input
                    v-model="formBuriedData.deceasedIDCard"
                    :maxcharacter="18"
                    show-limit-number
                    :style="{ width: '322px' }"
                    :placeholder="$t('pages.buried.deceasedIDCardPlaceholder')"
                  />
                </t-form-item>
              </t-col>
              <t-col v-if="!isDeleteMode" :span="6">
                <t-form-item :required="true" :label="$t('pages.buried.burialDate')" name="burialDate">
                  <t-date-picker
                    v-model="formBuriedData.burialDate"
                    :style="{ width: '322px' }"
                    theme="primary"
                    mode="date"
                    separator="/"
                    :placeholder="$t('pages.buried.burialDatePlaceholder')"
                  />
                </t-form-item>
              </t-col>
              <!-- 联系人/联系人电话字段：contacts 对应库列 contacts，contactsphone 对应库列 contactsphone(全小写)，非必填 20260909 新增 -->
              <!-- 联系人输入框右侧“选择”按钮：打开联系人选择页，选中后回填联系人/电话 20260909 新增 -->
              <t-col v-if="!isDeleteMode" :span="6">
                <t-form-item :label="$t('pages.buried.contacts')" name="contacts">
                  <div style="display: flex; gap: 8px; align-items: center">
                    <t-input
                      v-model="formBuriedData.contacts"
                      :maxcharacter="20"
                      show-limit-number
                      :style="{ width: '240px' }"
                      :placeholder="$t('pages.buried.contactsPlaceholder')"
                    />
                    <t-button theme="default" variant="outline" @click="handleOpenContactsSelect()">
                      {{ $t('pages.buried.select') }}
                    </t-button>
                  </div>
                </t-form-item>
              </t-col>
              <t-col v-if="!isDeleteMode" :span="6">
                <t-form-item :label="$t('pages.buried.contactsPhone')" name="contactsphone">
                  <t-input
                    v-model="formBuriedData.contactsphone"
                    :maxcharacter="11"
                    show-limit-number
                    :style="{ width: '322px' }"
                    :placeholder="$t('pages.buried.contactsPhonePlaceholder')"
                  />
                </t-form-item>
              </t-col>
              <!-- 联系人身份证号：在联系人电话右侧同行，非必填，最长18位与销售页统一 20260917 修改 -->
              <t-col v-if="!isDeleteMode" :span="6">
                <t-form-item :label="$t('pages.buried.contactsIDCard')" name="contactsIDCard">
                  <t-input
                    v-model="formBuriedData.contactsIDCard"
                    :maxcharacter="18"
                    show-limit-number
                    :style="{ width: '322px' }"
                    :placeholder="$t('pages.buried.contactsIDCardPlaceholder')"
                  />
                </t-form-item>
              </t-col>
              <!-- 费用金额字段移除：修改/新建均不再采集 cost，payload 剔除后修改不覆写库中旧值 20260908 修改 -->
              <!-- 备注统一限制50字 20260917 修改 -->
              <t-col v-if="!isDeleteMode" :span="12">
                <t-form-item :label="$t('pages.buried.remark')" name="remark">
                  <t-input
                    v-model="formBuriedData.remark"
                    :maxcharacter="50"
                    :height="124"
                    :placeholder="$t('pages.buried.remarkPlaceholder')"
                  />
                </t-form-item>
              </t-col>
              <!-- 预定/核对/完成流程取消，isPay/isReady/isFinish/isFull 复选框随之移除 20260907 修改 -->
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
    <!-- 下葬登记结束 -->
    <!-- 联系人选择页：样式复用墓穴下葬删除页（墓穴信息 + 记录表格 + 操作列），操作列为“选择”，点击把联系人/电话回填下葬表单并返回 20260909 新增 -->
    <div v-if="isContactsSelectShow">
      <t-form class="base-form" :data="formBuriedData" label-align="top" :label-width="100">
        <div class="form-basic-container">
          <div class="form-basic-item">
            <div class="form-basic-container-title">
              {{ $t('pages.buried.selectContactTitle') }}
              <t-button
                class="cms-back-btn"
                style="float: right"
                theme="default"
                variant="text"
                @click="handleCloseContactsSelect()"
              >
                {{ $t('operate.backDetail') }}
                <rollback-icon size="16px" />
              </t-button>
            </div>

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
              <t-col :span="12">
                <span>{{ $t('pages.room.intoStatus') }} : {{ t(formRoomData.intoStatus) }}</span>
              </t-col>

              <!-- 该墓位活动联系人列表，操作列逐行“选择”按钮，点击回填下葬表单并返回 20260909 新增 -->
              <t-col :span="12">
                <t-form-item name="idContacts">
                  <t-table
                    class="buried-record-table"
                    :data="contactsRecords"
                    :columns="contactsColumns"
                    row-key="idContacts"
                    :bordered="true"
                    size="small"
                    :max-height="240"
                  >
                    <template #op="{ row }">
                      <t-link theme="primary" @click="onSelectContact(row)">
                        {{ $t('pages.buried.select') }}
                      </t-link>
                    </template>
                  </t-table>
                </t-form-item>
              </t-col>
            </t-row>
          </div>
        </div>
      </t-form>
    </div>
    <!-- 联系人选择页结束 -->
    <!-- 删除改为独立删除页（复用下葬登记视图 + isDeleteMode），原记录选择弹窗移除 20260908 修改 -->
    <!-- 删除下葬二次确认弹窗，参照销售页 20260907 新增 -->
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
  name: 'Buried',
};
</script>
<script setup lang="ts">
import { RollbackIcon, ZoomInIcon, ZoomOutIcon } from 'tdesign-icons-vue-next';
import type { PrimaryTableCol } from 'tdesign-vue-next';
import { MessagePlugin } from 'tdesign-vue-next';
import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';

import { deleteBuried, getBuriedList, getRoomList, insertBuried, updateBuried } from '@/api/buried';
import { getContactsList } from '@/api/contacts';
import type { BuriedModel } from '@/api/model/buriedModel';
import type { ContactsModel } from '@/api/model/contactsModel';
import type { RoomModel } from '@/api/model/roomModel';
import { getIdList } from '@/api/room';
import RoomDetail from '@/components/room-detail/index.vue';
import { BUSINESS_BASIC_FORM_LABEL_WIDTH } from '@/constants';
import type { CardRowArg } from '@/hooks';
import { useCardGrid, usePageSwitch, useParkRoomFilter, usePermission, useRoomDetail, useTabCacheName } from '@/hooks';
import { t, translate } from '@/locales';
import { formatDate } from '@/utils/date';
import { logError } from '@/utils/logger';

import { FIND_DATA, INITIAL_ROOM_DATA, INITIAL_SALE_DATA } from './constants';

// ============================================================
// 墓区下葬基础页，参照销售页卡片网格：通用定义 → 列表（筛选/查询/卡片）→ 详情 → 下葬登记（新建/修改）20260907 修改,
// ============================================================

// ==================== 通用：权限与视图切换 ====================
// 向tab记录登记组件真实name，修复后端路由name与组件name不一致导致切tab不保活的问题 20260907 修改,
useTabCacheName('Buried');

// 安葬模块权限对象按 idMenu(103103) 精确匹配，权限不足时兼容空对象避免运行时报错 20260827 修改
const userInfo = usePermission('103103');

// 下葬状态：未下葬用于区分卡片是否显示“修改/删除”（非未下葬即视为已下葬，含历史 reserve/examine）20260907 新增
const INTO_INCOMPLET = 'statusType.intoStatusEnum.incomplet';
// 销售状态：已销售。仅“已销售”墓位才允许新建下葬记录（未售/预定不显示新建）20260908 新增
const SALE_SOLD = 'statusType.saleStatusEnum.sold';
// 卡片状态标签配色：取状态枚举 key 末段(如 sold/buried)拼接胶囊标签修饰类 20260913 新增
const statusKey = (status?: string) => (status ? String(status).split('.').pop() || '' : '');
// 卡片长文本截断：下葬者/联系人超过7字显示前7字+省略号，悬停 tooltip 展示完整内容 20260913 新增
const truncateText = (value?: string | null) => {
  const text = String(value || '');
  return text.length > 7 ? `${text.slice(0, 7)}…` : text;
};
// 是否超过7字需要截断并显示悬停提示 20260913 新增
const isOverflow = (value?: string | null) => String(value || '').length > 7;

type BuriedRoomRow = RoomModel & {
  reserve?: number;
  examine?: number;
  finish?: number;
};
type FilterFormData = typeof FIND_DATA;
type RoomFormData = typeof INITIAL_ROOM_DATA;
type BuriedFormData = typeof INITIAL_SALE_DATA;

// 视图互斥显示：列表 / 详情 / 下葬登记（新建与修改复用同一表单）20260907 修改,
const isListShow = ref(false);
const isDetailShow = ref(false);
const isCreateShow = ref(false);
// 联系人选择页显隐：从下葬表单联系人字段的“选择”按钮进入，与列表/详情/登记页互斥 20260909 新增
const isContactsSelectShow = ref(false);

const formRoomData = ref<RoomFormData>({ ...INITIAL_ROOM_DATA });
const formBuriedData = ref<BuriedFormData>({ ...INITIAL_SALE_DATA });

// 视图互斥切换收敛于公共 usePageSwitch，模板引用名保持不变 20260914 抽取
const { controlPageShow } = usePageSwitch({
  list: isListShow,
  detail: isDetailShow,
  create: isCreateShow,
  contactsSelect: isContactsSelectShow,
});

// ==================== 列表：状态与筛选下拉数据 ====================
// 区域由墓区下葬下区域三级菜单经路由meta下发，挂载时读取一次；
// keep-alive按fullPath区分实例，各区域tab互不影响，无需响应式监听 20260907 新增,
const menuRegion = (useRoute().meta.region as string) || '';
const formfindData = ref<FilterFormData>({ ...FIND_DATA, region: menuRegion });
const buriedCardViewport = ref<HTMLElement | null>(null);

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
} = useParkRoomFilter<BuriedRoomRow>(formfindData, (park, region) => getRoomList(park, region));

// ==================== 列表：卡片行分组与缩放 ====================
// 迁出状态：已迁出。已迁出的墓位不展示（迁出为终态，其展示由迁出查询页负责）20260921 新增
const TRANSFER_OUT_OUT = 'statusType.transferOutStatusEnum.out';
// 卡片列表过滤已迁出的墓位后再进入网格补位 20260921 新增
const visibleBuriedRoomList = computed(() =>
  searchRoomList.value.filter((item) => item.transferOutStatus !== TRANSFER_OUT_OUT),
);
// 卡片网格（缩放/分组补位/记录数）收敛于公共 useCardGrid，模板引用名保持不变 20260914 抽取
const {
  zoom: buriedZoom,
  handleZoomIn,
  handleZoomOut,
  cardRows: buriedCardRows,
  totalText: listTotalText,
} = useCardGrid(visibleBuriedRoomList);

// ==================== 列表：查询与筛选事件 ====================
// 按园区+区域请求可下葬墓位，加载完成后才置 hasQueried，避免先闪现“暂无数据”再切换为卡片 20260907 修改,

onMounted(() => {
  getRegionData();
  getParkData();
  // 列表不再默认查询展示，需用户选择园区后手动查询 20260907 修改,
  setTimeout(() => {
    controlPageShow('list');
  }, 380);
});

// ==================== 详情 ====================
// 详情统一由 room-detail 组件展示：销售页/预定页/下葬页共用同一详情视图，数据加载收敛于 useRoomDetail 20260914 抽取
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

// 点击卡片详情：拉取单条墓位数据与活动预定/销售/下葬记录后进入详情视图 20260907 修改,
const handleClickDetail = async (row: CardRowArg<BuriedRoomRow>) => {
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

// ==================== 下葬登记：新建 / 修改 / 删除 ====================
// 删除模式：复用下葬登记视图，仅展示墓穴信息+记录列表(操作列删除)，隐藏可编辑表单与提交区 20260908 新增
const isDeleteMode = ref(false);
// 表单标题随模式切换：删除 > 修改 > 新建 20260908 修改
const formTitle = computed(() => {
  if (isDeleteMode.value) {
    return translate('pages.buried.deleteTitle');
  }
  return formBuriedData.value.idBuried !== 0
    ? translate('pages.buried.modifyTitle')
    : translate('pages.buried.creatTitle');
});

// 修改模式下在墓穴信息下方以列表展示“选择下葬记录”；buriedRecords 为该墓位全部活动下葬记录（后端按 idBuried DESC，[0] 为最新）20260907 修改
const isModifyMode = ref(false);
const buriedRecords = ref<BuriedModel[]>([]);
// 列表单选选中的下葬记录 idBuried（默认最新一条），及展示完整信息的列定义 20260907 新增
const selectedBuriedKeys = ref<Array<string | number>>([]);
const modifyColumns: PrimaryTableCol[] = [
  { title: translate('pages.buried.deceased'), colKey: 'deceased' },
  // 安葬者列后新增身份证号列，数据来自 SELECT * 的 deceasedIDCard 20260908 新增
  // 身份证号列加宽至 200px，确保 18 位号码完整显示 20260908 修改
  { title: translate('pages.buried.deceasedIDCard'), colKey: 'deceasedIDCard', width: 200 },
  { title: translate('pages.buried.burialDate'), colKey: 'burialDate' },
  { title: translate('pages.buried.remark'), colKey: 'remark', ellipsis: true },
  // 选择列（单选 radio）调整至最后一列 20260908 修改
  { title: translate('pages.buried.select'), colKey: 'row-select', type: 'single', width: 50 },
];

// 删除页记录列表列：与修改页一致，但末列由“选择”单选列改为“操作”列（逐行删除按钮）20260908 新增
const deleteColumns: PrimaryTableCol[] = [
  { title: translate('pages.buried.deceased'), colKey: 'deceased' },
  // 身份证号列加宽至 200px，与修改页列表保持一致 20260908 修改
  { title: translate('pages.buried.deceasedIDCard'), colKey: 'deceasedIDCard', width: 200 },
  { title: translate('pages.buried.burialDate'), colKey: 'burialDate' },
  { title: translate('pages.buried.remark'), colKey: 'remark', ellipsis: true },
  { title: translate('operate.operation'), colKey: 'op', width: 90 },
];

// ==================== 联系人选择页（从下葬表单联系人字段“选择”进入）====================
// 该墓位活动联系人记录与展示列（联系人/电话/身份证号 + 操作列“选择”），数据源 getContactsList 20260909 新增
const contactsRecords = ref<ContactsModel[]>([]);
const contactsColumns: PrimaryTableCol[] = [
  { title: translate('pages.contacts.contacts'), colKey: 'contacts' },
  { title: translate('pages.contacts.contactsPhone'), colKey: 'contactsPhone', width: 140 },
  { title: translate('pages.contacts.contactsIDCard'), colKey: 'contactsIDCard', width: 180 },
  { title: translate('operate.operation'), colKey: 'op', width: 90 },
];

// 打开联系人选择页：加载该墓位活动联系人，无记录时提示且不跳转，参照修改/删除的记录校验 20260909 新增
const handleOpenContactsSelect = async () => {
  const { idRoom } = formBuriedData.value;
  try {
    const { list } = await getContactsList(idRoom);
    if (!list || list.length === 0) {
      MessagePlugin.warning(translate('pages.buried.noContact'));
      return;
    }
    contactsRecords.value = list;
    controlPageShow('contactsSelect');
  } catch (e) {
    logError(e);
  }
};

// 选择联系人：把联系人名/电话/身份证号回填下葬表单（电话库列为 contactsphone），返回下葬登记页 20260909 新增 20260917 补充身份证号回填
const onSelectContact = (row: ContactsModel) => {
  formBuriedData.value.contacts = row.contacts ?? '';
  formBuriedData.value.contactsphone = row.contactsPhone ?? '';
  formBuriedData.value.contactsIDCard = row.contactsIDCard ?? '';
  contactsRecords.value = [];
  controlPageShow('create');
};

// 关闭联系人选择页：返回下葬登记页，不改动已填表单 20260909 新增
const handleCloseContactsSelect = () => {
  contactsRecords.value = [];
  controlPageShow('create');
};

// 下葬日期在库中为 datetime，列表统一格式化为 yyyy-mm-dd 显示，收敛于公共 formatDate 20260914 抽取

const resetBuriedForm = (idRoom = 0) => {
  formBuriedData.value = {
    ...INITIAL_SALE_DATA,
    idRoom,
  };
};

// 用选中的下葬记录回填表单（供修改），字段与 INITIAL_SALE_DATA 结构一致 20260907 新增
const fillBuriedForm = (record: BuriedModel) => {
  formBuriedData.value = {
    idBuried: record.idBuried,
    idRoom: record.idRoom,
    deceased: record.deceased ?? '',
    deceasedIDCard: record.deceasedIDCard ?? '',
    burialDate: record.burialDate ?? '',
    // 联系人/联系人电话回填：库列 contactsphone(全小写)，SELECT * 返回同名键 20260909 新增,
    contacts: record.contacts ?? '',
    contactsphone: record.contactsphone ?? '',
    // 联系人身份证号回填：库列 contactsIDCard，SELECT * 返回同名键 20260917 新增
    contactsIDCard: record.contactsIDCard ?? '',
    remark: record.remark ?? '',
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

// 点击卡片“新建”：加载墓位信息并重置为新增下葬记录 20260907 修改,
const handleClickCreate = async (row: CardRowArg<BuriedRoomRow>) => {
  const currentRow = row.row ?? row;
  isModifyMode.value = false;
  isDeleteMode.value = false;
  buriedRecords.value = [];
  selectedBuriedKeys.value = [];
  resetBuriedForm(currentRow.idRoom);
  await getRoomID(currentRow.idRoom);
  controlPageShow('create');
};

// 取消：重置下葬表单，保持当前墓位 20260907 修改,
const onReset = () => {
  resetBuriedForm(formRoomData.value.idRoom);
};

// 下葬登记关闭：清空数据并回到列表 20260907 修改,
const ClickCreateClose = () => {
  formRoomData.value = { ...INITIAL_ROOM_DATA };
  resetBuriedForm();
  isModifyMode.value = false;
  isDeleteMode.value = false;
  buriedRecords.value = [];
  selectedBuriedKeys.value = [];
  controlPageShow('list');
};

// ==================== 卡片：修改 / 删除（多条下葬记录选择）====================
// 删除二次确认弹窗，提示文案参照墓区预定页：删除后，园区+排+序号 + 下葬信息将被清空 20260908 修改
const confirmVisible = ref(false);
const deleteTarget = ref<{ idBuried: number; idRoom: number; deceased: string } | null>(null);
const dialogHeader = translate('operate.deleteDataCPrompt');
const confirmBody = computed(() => {
  if (!deleteTarget.value) {
    return '';
  }
  const { park, yNum, xNum } = formRoomData.value;
  return `${translate('operate.deleteDataAPrompt')}${park}${yNum}${translate('operate.row')}${xNum}${translate(
    'pages.buried.deleteInfoPrompt',
  )}`;
});
const onCancel = () => {
  deleteTarget.value = null;
};

// 列表单选下葬记录：选中行变化时用该记录回填下方修改表单 20260907 修改
const onSelectBuriedRecord = (keys: Array<string | number>) => {
  const id = Number(keys[0]);
  const record = buriedRecords.value.find((item) => item.idBuried === id);
  if (record) {
    fillBuriedForm(record);
  }
};

// 点击卡片“修改”：进入修改页，墓穴信息下方列出全部下葬记录，默认选中最后一条（最新）20260907 修改,
const handleClickModify = async (row: CardRowArg<BuriedRoomRow>) => {
  const currentRow = row.row ?? row;
  try {
    const { list } = await getBuriedList(currentRow.idRoom);
    if (!list || list.length === 0) {
      MessagePlugin.warning(translate('pages.buried.noRecord'));
      return;
    }
    // 后端已按 idBuried DESC 排序，list[0] 即最后一条（最新）下葬记录，默认单选它
    buriedRecords.value = list;
    isModifyMode.value = true;
    isDeleteMode.value = false;
    resetBuriedForm(currentRow.idRoom);
    await getRoomID(currentRow.idRoom);
    fillBuriedForm(list[0]);
    selectedBuriedKeys.value = [list[0].idBuried];
    controlPageShow('create');
  } catch (e) {
    logError(e);
  }
};

// 点击卡片“删除”：进入删除页（复用下葬登记视图 isDeleteMode），墓穴信息下方列出全部下葬记录，操作列逐行删除 20260908 修改
const handleClickDelete = async (row: CardRowArg<BuriedRoomRow>) => {
  const currentRow = row.row ?? row;
  try {
    const { list } = await getBuriedList(currentRow.idRoom);
    if (!list || list.length === 0) {
      MessagePlugin.warning(translate('pages.buried.noRecord'));
      return;
    }
    buriedRecords.value = list;
    isModifyMode.value = false;
    isDeleteMode.value = true;
    selectedBuriedKeys.value = [];
    resetBuriedForm(currentRow.idRoom);
    await getRoomID(currentRow.idRoom);
    controlPageShow('create');
  } catch (e) {
    logError(e);
  }
};

// 删除页操作列“删除”：记录待删除目标并打开二次确认 20260908 修改,
const onSelectRecord = (record: BuriedModel) => {
  deleteTarget.value = { idBuried: record.idBuried, idRoom: record.idRoom, deceased: record.deceased };
  confirmVisible.value = true;
};

// 确认删除：软删除选中的下葬记录，无剩余记录时后端回置墓位为未下葬；成功后刷新列表并关闭删除页 20260908 修改
const onConfirmDelete = async () => {
  if (!deleteTarget.value) {
    return;
  }
  const { idBuried, idRoom } = deleteTarget.value;
  deleteTarget.value = null;
  confirmVisible.value = false;
  try {
    await deleteBuried(idBuried, idRoom);
    MessagePlugin.success(translate('operate.deleteSuccessPrompt'));
    await getRoomData();
    ClickCreateClose();
  } catch (e) {
    logError(e);
  }
};

// 提交下葬登记：idBuried 为0走新增，否则走修改；成功后刷新列表 20260907 修改,

const ClickSubmit = async () => {
  if (formBuriedData.value.deceased === '') {
    return MessagePlugin.warning(translate('pages.buried.deceasedPlaceholder'));
  }
  if (formBuriedData.value.burialDate === '' || formBuriedData.value.burialDate === null) {
    return MessagePlugin.warning(translate('pages.buried.burialDatePlaceholder'));
  }

  if (formBuriedData.value.idBuried === 0) {
    try {
      await insertBuried(formBuriedData.value);
      MessagePlugin.success(translate('operate.createdSuccessPrompt'));
      await getRoomData();
      ClickCreateClose();
    } catch (e) {
      logError(e);
      MessagePlugin.error(translate('operate.createdFailedPrompt'));
    }
  } else {
    try {
      await updateBuried(formBuriedData.value);
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

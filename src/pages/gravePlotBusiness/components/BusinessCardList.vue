<template>
  <!-- 卡片列表区：从墓位业务页 index.vue 拆出（20261019 结构拆分第一阶段），
       结构与类名与原页面完全一致，样式随模板迁入本组件 scoped 块 -->
  <div class="gravePlotBusiness-list-body">
    <div
      ref="cardViewport"
      class="table-container gravePlotBusiness-card-layout"
      @scroll.passive="onCardViewportScroll"
    >
      <div class="gravePlotBusiness-card-rows" :style="{ zoom }">
        <div v-for="rowGroup in rows" :key="rowGroup.yNum" class="gravePlotBusiness-card-row">
          <div class="gravePlotBusiness-card-grid">
            <div
              v-for="card in rowGroup.cards"
              :key="`${rowGroup.yNum}-${card.xNum}`"
              class="gravePlotBusiness-card"
              :class="{
                'gravePlotBusiness-card--empty': card.placeholder,
                [cardStatusClass(card.row)]: !card.placeholder,
              }"
            >
              <template v-if="card.placeholder">
                <!-- 空位卡序号与正常卡同样顶部对齐 20260828 修改 -->
                <div class="gravePlotBusiness-card__header">
                  <div class="gravePlotBusiness-card__serial">{{ rowGroup.yNum }} 排 {{ card.xNum }} 号</div>
                </div>
                <div class="gravePlotBusiness-card__body">
                  <div class="gravePlotBusiness-card__empty-text">空位</div>
                </div>
              </template>
              <template v-else>
                <div class="gravePlotBusiness-card__header">
                  <!-- 排号改取 xyNumber 字段(自定义坐标名)，缺失时回退 yNum/xNum 拼接 20260923 修改；
                       编号点击进详情（悬停小手），原整卡双击事件已移除 20260926 修改；
                       20261003 取消整卡空白处点击进详情，点击事件回到编号本身 -->
                  <div
                    class="gravePlotBusiness-card__serial gravePlotBusiness-card__serial--clickable"
                    @click="emit('detail', card.row)"
                  >
                    {{ card.row.xyNumber || `${rowGroup.yNum} 排 ${card.xNum} 号` }}
                  </div>
                  <!-- 墓位类型标题去掉，值改为胶囊标签上移至卡片第一行右侧 20260923 修改 -->
                  <span class="gravePlotBusiness-card__type">{{ $t(card.row.roomType).trim() }}</span>
                </div>
                <div class="gravePlotBusiness-card__body">
                  <!-- 卡片信息内容参照墓区下葬页：购墓人/下葬者/联系人/期限，标签在左灰色、值在右深色两端对齐
                       20260923 修改 20261002 去掉预定人一行 -->
                  <!-- 销售状态保留在卡片行数据 card.row.saleStatus 中，仅在卡面上不渲染展示；
                       除交互门控外，未销售时卡片背景色与墓位类型胶囊同色（浅橙）20260923 新增 20261002 用于背景色 -->
                  <div class="gravePlotBusiness-card__meta">
                    <!-- 购墓人按钮：点击进入销售形态表单（同墓位销售页样式内容：有销售信息为“修改销售”、无则为“销售墓位”；数据仍走自有接口）20260923 修改 -->
                    <t-link theme="primary" @click="emit('buyer', card.row)">
                      {{ $t('pages.room.buyer') }}
                    </t-link>
                    <!-- 购墓人无值时默认显示“无” 20260923 新增 -->
                    <span class="gravePlotBusiness-card__meta-value">{{ card.row.buyer || $t('common.none') }}</span>
                  </div>
                  <div class="gravePlotBusiness-card__meta">
                    <!-- 下葬者按钮：点击进入下葬形态表单（同下葬页修改页内容，数据走自有接口读写 buried 表） 20260923 修改；
                         未销售墓位置灰不可点（t-link disabled 内部拦截 click 事件） 20261005 新增 -->
                    <t-link :disabled="isUnsold(card.row.saleStatus)" theme="primary" @click="emit('buried', card.row)">
                      {{ $t('pages.room.buriedPerson') }}
                    </t-link>
                    <!-- 下葬者超过7字截断为前6字+4个半角点，悬停提示完整内容 20260924 修改 -->
                    <t-tooltip v-if="isOverflow(card.row.deceased)" :content="String(card.row.deceased)">
                      <span class="gravePlotBusiness-card__meta-value">{{
                        truncateBuriedText(card.row.deceased)
                      }}</span>
                    </t-tooltip>
                    <!-- 下葬者无值时默认显示“无” 20260923 新增 -->
                    <span v-else class="gravePlotBusiness-card__meta-value">
                      {{ card.row.deceased || $t('common.none') }}
                    </span>
                  </div>
                  <!-- 联系人：room 表字段，存所有联系人；标签为操作按钮，点击进入业务登记表单 20260923 修改；
                       未销售墓位置灰不可点（t-link disabled 内部拦截 click 事件） 20261005 新增 -->
                  <div class="gravePlotBusiness-card__meta">
                    <t-link :disabled="isUnsold(card.row.saleStatus)" theme="primary" @click="emit('person', card.row)">
                      {{ $t('pages.room.contacts') }}
                    </t-link>
                    <!-- 联系人超过7字截断为前6字+4个半角点，悬停提示完整内容 20260923 新增 20260924 修改 -->
                    <t-tooltip v-if="isOverflow(card.row.contacts)" :content="String(card.row.contacts)">
                      <span class="gravePlotBusiness-card__meta-value">{{
                        truncateContactsText(card.row.contacts)
                      }}</span>
                    </t-tooltip>
                    <!-- 联系人无值时默认显示“无” 20260923 新增 -->
                    <span v-else class="gravePlotBusiness-card__meta-value">{{
                      card.row.contacts || $t('common.none')
                    }}</span>
                  </div>
                  <!-- 预定期（room.reservationExpireDate，活动预定记录的限期副本）：写法同下行管理期，
                       无活动预定/未填限期时 formatDate 回空串、默认展示“无” 20261011 新增 -->
                  <div class="gravePlotBusiness-card__meta">
                    <span class="gravePlotBusiness-card__meta-label">
                      {{ $t('pages.gravePlotBusiness.reservationPeriod') }}
                    </span>
                    <span class="gravePlotBusiness-card__meta-value">{{
                      formatDate(card.row.reservationExpireDate) || $t('common.none')
                    }}</span>
                  </div>
                  <!-- 期限信息（管理费结束日期），标签用短词条避免卡片内换行，与下葬页卡片一致 20260923 新增 -->
                  <div class="gravePlotBusiness-card__meta">
                    <span class="gravePlotBusiness-card__meta-label">{{ $t('pages.adminfee.period') }}</span>
                    <!-- 期限无值时默认显示“无” 20260923 新增 -->
                    <span class="gravePlotBusiness-card__meta-value">{{
                      formatDate(card.row.endDate) || $t('common.none')
                    }}</span>
                  </div>
                  <!-- 备注信息（room.remark），显示形式同下葬者：超过7字截断为前6字+4个半角点，悬停提示完整内容，
                       无值时默认显示“无”；列已在运行库存在且 room-list 接口 SELECT * 自动带出；
                       标题与联系人标题样式相同（t-link 按钮），点击进入墓位备注（修改）页 20261002 新增 20261002 改可点击 -->
                  <div class="gravePlotBusiness-card__meta">
                    <t-link theme="primary" @click="emit('remark', card.row)">
                      {{ $t('pages.gravePlotBusiness.remark') }}
                    </t-link>
                    <t-tooltip v-if="isOverflow(card.row.remark)" :content="String(card.row.remark)">
                      <span class="gravePlotBusiness-card__meta-value">{{ truncateRemarkText(card.row.remark) }}</span>
                    </t-tooltip>
                    <!-- 备注无值时默认显示“无” 20261002 新增 -->
                    <span v-else class="gravePlotBusiness-card__meta-value">{{
                      card.row.remark || $t('common.none')
                    }}</span>
                  </div>
                  <!-- 销售/下葬状态胶囊行移除，卡片仅保留人员信息与期限；销售状态仍随行数据返回但不展示 20260923 修改 -->
                </div>
                <!-- 卡片操作行移除：详情/新建/修改/删除不再从卡片进入，交互方式后续调整 20260923 修改 -->
              </template>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- 列表底部工具行：左侧记录数，右侧外框颜色图例（同首页销售数量统计图例样式）+ 放大/缩小卡片列表 20260926 修改 -->
  <div class="gravePlotBusiness-list-toolbar">
    <span>{{ totalText }}</span>
    <div class="gravePlotBusiness-list-toolbar__right">
      <!-- 卡片外框颜色说明：未销售橙/绿已销售/蓝已下葬/浅红管理到期，未销售说明位于已销售左侧 20260926 新增 20261002 补未销售；
           图例与卡片着色同源：卡片颜色页未勾选的态不参与判定、卡面也不会出现该色，故图例不显示 20261011 修改, -->
      <div class="gravePlotBusiness-list-toolbar__legend">
        <span v-if="isCardStateEnabled('unsold')" class="gravePlotBusiness-legend-item">
          <i class="gravePlotBusiness-legend-item__swatch gravePlotBusiness-legend-item__swatch--unsold" />
          {{ $t('statusType.saleStatusEnum.unsold') }}
        </span>
        <span v-if="isCardStateEnabled('reserved')" class="gravePlotBusiness-legend-item">
          <i class="gravePlotBusiness-legend-item__swatch gravePlotBusiness-legend-item__swatch--reserved" />
          {{ $t('statusType.reserveStatusEnum.reserved') }}
        </span>
        <span v-if="isCardStateEnabled('sold')" class="gravePlotBusiness-legend-item">
          <i class="gravePlotBusiness-legend-item__swatch gravePlotBusiness-legend-item__swatch--sold" />
          {{ $t('statusType.saleStatusEnum.sold') }}
        </span>
        <span v-if="isCardStateEnabled('buried')" class="gravePlotBusiness-legend-item">
          <i class="gravePlotBusiness-legend-item__swatch gravePlotBusiness-legend-item__swatch--buried" />
          {{ $t('statusType.intoStatusEnum.buried') }}
        </span>
        <span v-if="isCardStateEnabled('expired')" class="gravePlotBusiness-legend-item">
          <i class="gravePlotBusiness-legend-item__swatch gravePlotBusiness-legend-item__swatch--expired" />
          {{ $t('pages.gravePlotBusiness.legendExpired') }}
        </span>
      </div>
      <span class="gravePlotBusiness-list-toolbar__zoom">
        <zoom-in-icon class="gravePlotBusiness-list-toolbar__zoom-icon" @click="emit('zoom-in')" />
        <zoom-out-icon class="gravePlotBusiness-list-toolbar__zoom-icon" @click="emit('zoom-out')" />
      </span>
    </div>
  </div>
</template>
<script lang="ts">
export default {
  name: 'BusinessCardList',
};
</script>
<script setup lang="ts">
import { ZoomInIcon, ZoomOutIcon } from 'tdesign-icons-vue-next';
import { nextTick, onActivated, ref } from 'vue';

import type { GravePlotBusinessRoomRow } from '@/api/gravePlotBusiness';
import type { CardRowGroup } from '@/hooks';
import { getCardStatusClass, isUnsold } from '@/utils/cardStatus';
import { isCardStateEnabled } from '@/utils/cardTheme';
import { formatDate } from '@/utils/date';
import { isCardTextOverflow as isOverflow, truncateCardText } from '@/utils/text';

// 墓位业务页卡片列表子组件：卡片区 + 底部工具行（记录数/图例/缩放），
// 由 index.vue 拆出，网格数据与缩放状态仍由页面 useCardGrid 提供，本组件纯展示 + 事件上抛 20261019 拆分
const props = defineProps<{
  // 按排分组并补位后的卡片行（含占位卡）
  rows: CardRowGroup<GravePlotBusinessRoomRow>[];
  // 卡片缩放比例（放大/缩小图标驱动，页面 useCardGrid 持有）
  zoom: number;
  // 记录数文案
  totalText: string;
  // 列表视图是否处于显示态（页面 v-show 切换，滚动恢复仅在列表显示时执行）
  listVisible: boolean;
}>();

const emit = defineEmits<{
  (e: 'detail', row: GravePlotBusinessRoomRow): void;
  (e: 'buyer', row: GravePlotBusinessRoomRow): void;
  (e: 'buried', row: GravePlotBusinessRoomRow): void;
  (e: 'person', row: GravePlotBusinessRoomRow): void;
  (e: 'remark', row: GravePlotBusinessRoomRow): void;
  (e: 'zoom-in'): void;
  (e: 'zoom-out'): void;
}>();

// 卡片状态类名判定：收至 utils/cardStatus.getCardStatusClass（四页同一套「勾选递补」规则），
// 本页前缀与未销售参量在此固化 20261011 修改 20261019 随卡片拆分迁入本组件
const cardStatusClass = (row: GravePlotBusinessRoomRow | null | undefined) =>
  getCardStatusClass('gravePlotBusiness', row, { withUnsold: true });

// 卡片长文本截断：超过7字显示前6字+4个半角点，悬停 tooltip 展示完整内容（实现收敛于 utils/text）
const truncateBuriedText = truncateCardText;
const truncateContactsText = truncateCardText;
const truncateRemarkText = truncateCardText;

// ==================== 卡片区滚动位置保持（tab 切换往返） ====================
// 页面 keep-alive 保活仅保留数据：失活时组件 DOM 从文档移除，内部滚动容器 scrollTop 随之归零，
// 切回 tab 会回到顶部；滚动时实时记录位置，onActivated（tab 切回）恢复 20260925 新增 20261019 随拆分迁入本组件
const cardViewport = ref<HTMLElement | null>(null);
const cardScrollTop = ref(0);
const onCardViewportScroll = (e: Event) => {
  cardScrollTop.value = (e.target as HTMLElement).scrollTop;
};

onActivated(() => {
  // 列表视图且有卡片数据时才恢复；详情/登记视图下页面 v-show 隐藏卡片区不处理
  if (!props.listVisible || !props.rows.length) {
    return;
  }
  nextTick(() => {
    if (cardViewport.value) {
      cardViewport.value.scrollTop = cardScrollTop.value;
    }
  });
});
</script>
<style lang="less" scoped>
// 卡片列表区样式：原位于页面 index.less，随模板迁入本组件（公共库 mixin 传本页前缀调用）20261019 拆分
// 只引卡片结构 mixin 子库而非全量业务库：避开与本组件无关的裸类规则（.cms-query-*/.detail-base 等）
// 被复制成作用域内死规则；卡片区与筛选表单的上下间距改由父页 :deep 规则提供 20261019
@import '../../../style/business/card-page-mixins.less';

// ==================== 卡片页公共结构（前缀 gravePlotBusiness） ====================
.cms-list-body(gravePlotBusiness);
.cms-list-toolbar(gravePlotBusiness);
.cms-card-layout(gravePlotBusiness);
.cms-card-basic(gravePlotBusiness);
.cms-card-empty-dashed(gravePlotBusiness);
// 卡片统一迭代样式套件：与墓区设置页共用（hover 凸显/首行胶囊/两端对齐/状态胶囊/操作两端对齐）
.cms-card-hover-highlight(gravePlotBusiness);
.cms-card-head-pill(gravePlotBusiness);
.cms-card-meta-between(gravePlotBusiness);
// 状态胶囊行已移除，cms-card-status-tags 不再调用 20260923 修改
// 卡片操作行已移除，cms-card-actions-between 不再调用 20260923 修改
// 信息行标题胶囊样式已取消，恢复 cms-card-meta-between 默认灰色文本标题 20260923 修改

// 人员信息行标签（预定人/购墓人/下葬者/联系人）已改为 t-link 操作按钮，
// 主题绿/悬停浅蓝及可点击标题样式随标题方案一并移除 20260923 修改

// 人员按钮字号与内容值对齐：t-link 用 font 简写（14px/22px）覆盖继承，需 :deep 显式改回信息行 12px/16px 20260923 新增
.gravePlotBusiness-card__meta {
  :deep(.t-link) {
    font-size: 12px;
    line-height: 16px;
  }
}

// 卡片编号可点击进详情：悬停小手，hover 品牌色提示可点（仅非空卡片，空位卡编号无点击事件）20260926 新增
.gravePlotBusiness-card__serial--clickable {
  cursor: pointer;

  &:hover {
    color: var(--td-brand-color);
  }
}

// 卡片外框状态色（已销售绿/已下葬蓝/管理到期红/未销售浅橙底）：
// 调用需位于 cms-card-hover-highlight 之后，以保持状态色覆盖 hover 品牌色的声明顺序 20261003 抽取
.cms-card-status-frame(gravePlotBusiness);

// 底部工具行右侧：图例 + 缩放按钮并排 20260926 新增
.gravePlotBusiness-list-toolbar__right {
  display: flex;
  align-items: center;
  gap: 32px;
}

// 外框颜色图例（同首页销售数量统计图例样式：小矩形色块 + 12px 文字）20260926 新增
.gravePlotBusiness-list-toolbar__legend {
  display: inline-flex;
  align-items: center;
  gap: 24px;
}

.gravePlotBusiness-legend-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--td-text-color-secondary);

  &__swatch {
    width: 12px;
    height: 4px;
    border-radius: 1px;

    // 四态图例色 = 卡片外框色同源，统一引用 style/card-color.less 变量（避免逐页抄写色值、改色漏改图例）20261011 修改,
    &--unsold {
      background-color: var(--cms-card-unsold-border);
    }

    &--reserved {
      background-color: var(--cms-card-reserved-border);
    }

    &--sold {
      background-color: var(--cms-card-sold-border);
    }

    &--buried {
      background-color: var(--cms-card-buried-border);
    }

    &--expired {
      background-color: var(--cms-card-expired-border);
    }
  }
}
</style>

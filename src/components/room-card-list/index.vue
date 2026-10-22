<template>
  <!-- 通用墓位卡片列表：卡片区 + 底部工具行（记录数/缩放），供 buried/reserve/contacts 等墓位列表页复用。
       结构与类名沿用原各页内联卡片模板，前缀统一取中性名 roomcard（各页前缀仅类名不同、值同源：状态色来自
       全局 card-color 变量、结构来自同一批 mixin），组件自带 scoped 已足以隔离，故无需按页前缀区分 20261020 P2 #6。
       卡片差异（展示哪些信息行、状态胶囊、操作链接）由 metaFields/statusFields/actions 配置承接，操作经 action 事件上抛。 -->
  <div class="roomcard-list-body">
    <div ref="viewportRef" class="table-container roomcard-card-layout" @scroll.passive="onScroll">
      <div class="roomcard-card-rows" :style="{ zoom }">
        <div v-for="rowGroup in rows" :key="rowGroup.yNum" class="roomcard-card-row">
          <div class="roomcard-card-grid">
            <div
              v-for="card in rowGroup.cards"
              :key="`${rowGroup.yNum}-${card.xNum}`"
              class="roomcard-card"
              :class="[
                { 'roomcard-card--empty': card.placeholder },
                card.placeholder || !cardClass ? '' : cardClass(card.row),
              ]"
            >
              <template v-if="card.placeholder">
                <!-- 空位卡序号与正常卡同样顶部对齐 -->
                <div class="roomcard-card__header">
                  <div class="roomcard-card__serial">{{ formatSerial(rowGroup.yNum, card.xNum) }}</div>
                </div>
                <div class="roomcard-card__body">
                  <div class="roomcard-card__empty-text">{{ translate('operate.emptyPlot') }}</div>
                </div>
              </template>
              <template v-else>
                <div class="roomcard-card__header">
                  <!-- 首行编号取 xyNumber（自定义坐标名），缺失回退 yNum/xNum 拼接；
                       serialAction 存在时编号可点击进详情（供墓位业务页复用原「编号点击」交互 20261020 P2 S2） -->
                  <div
                    class="roomcard-card__serial"
                    :class="{ 'roomcard-card__serial--clickable': !!serialAction }"
                    @click="serialAction && emit('action', serialAction, card.row)"
                  >
                    {{ card.row.xyNumber || formatSerial(rowGroup.yNum, card.row.xNum) }}
                  </div>
                  <!-- 墓位类型值上移至首行右侧胶囊 -->
                  <div class="roomcard-card__type">{{ $t(card.row.roomType).trim() }}</div>
                </div>
                <div class="roomcard-card__body">
                  <div v-for="mf in metaFields" :key="mf.field" class="roomcard-card__meta">
                    <!-- 标题默认灰色文本；labelAction 存在时渲染为 t-link 并上抛 action（业务登记入口），
                         labelDisabled 命中则置灰不可点（如未销售的下葬者/联系人 20261020 P2 S2） -->
                    <t-link
                      v-if="mf.labelAction"
                      theme="primary"
                      :disabled="mf.labelDisabled ? mf.labelDisabled(card.row) : false"
                      @click="emit('action', mf.labelAction, card.row)"
                    >
                      {{ $t(mf.labelKey) }}
                    </t-link>
                    <span v-else class="roomcard-card__meta-label">{{ $t(mf.labelKey) }}</span>
                    <template v-if="mf.format === 'truncate'">
                      <t-tooltip v-if="isOverflow(textCell(card.row, mf))" :content="textCell(card.row, mf)">
                        <span class="roomcard-card__meta-value">{{ truncateText(textCell(card.row, mf)) }}</span>
                      </t-tooltip>
                      <span v-else class="roomcard-card__meta-value">
                        {{ textCell(card.row, mf) || $t('common.none') }}
                      </span>
                    </template>
                    <span v-else-if="mf.format === 'price'" class="roomcard-card__meta-value">{{
                      formatPrice(rawCell(card.row, mf) as number)
                    }}</span>
                    <span v-else-if="mf.format === 'date'" class="roomcard-card__meta-value">
                      {{ formatDate(textCell(card.row, mf)) || $t('common.none') }}
                    </span>
                    <span v-else-if="mf.format === 'i18n'" class="roomcard-card__meta-value">
                      {{ $t(textCell(card.row, mf)) || $t('common.none') }}
                    </span>
                    <span v-else class="roomcard-card__meta-value">
                      {{ textCell(card.row, mf) || $t('common.none') }}
                    </span>
                  </div>
                  <div v-if="statusFields.length" class="roomcard-card__status">
                    <span
                      v-for="sf in statusFields"
                      :key="sf"
                      class="roomcard-card__tag"
                      :class="`roomcard-card__tag--${statusKey(cellSource(card.row, sf))}`"
                    >
                      {{ $t(cellSource(card.row, sf)) }}
                    </span>
                  </div>
                </div>
                <div class="roomcard-card__actions">
                  <t-link
                    v-for="a in visibleActions(card.row)"
                    :key="a.name"
                    :theme="a.theme || 'primary'"
                    @click="emit('action', a.name, card.row)"
                  >
                    {{ $t(a.labelKey) }}
                  </t-link>
                </div>
              </template>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- 列表底部工具行：与卡片区为同级双根（沿用原各页 list-body / list-toolbar 并列结构，
       父页对二者用同一 v-if 门控，故本组件多根 fragment、由父页在 <room-card-list> 上加 v-if） -->
  <div class="roomcard-list-toolbar">
    <span>{{ totalText }}</span>
    <!-- 工具行右侧容器：缩放控件由组件统一持有（样式来自 __right/cms-list-toolbar(roomcard)），
         reserve/transferOut 等页仅需经 toolbar-legend 插槽注入颜色图例，不再自带缩放控件 20261020 P2 S1a -->
    <div class="roomcard-list-toolbar__right">
      <slot name="toolbar-legend" />
      <span class="roomcard-list-toolbar__zoom">
        <zoom-in-icon class="roomcard-list-toolbar__zoom-icon" @click="emit('zoom-in')" />
        <zoom-out-icon class="roomcard-list-toolbar__zoom-icon" @click="emit('zoom-out')" />
      </span>
    </div>
  </div>
</template>
<script lang="ts">
export default {
  name: 'RoomCardList',
};
</script>
<script setup lang="ts">
import { ZoomInIcon, ZoomOutIcon } from 'tdesign-icons-vue-next';
import { ref } from 'vue';

import type { RoomModel } from '@/api/model/roomModel';
import type { CardRowGroup } from '@/hooks';
import { translate } from '@/locales';
import { formatDate } from '@/utils/date';
import { formatPrice } from '@/utils/format';
import { isCardTextOverflow as isOverflow } from '@/utils/text';

import type { RoomCardAction, RoomCardMetaField } from './types';

// 通用墓位卡片列表子组件：网格数据/缩放/记录数文案仍由父页 useCardGrid 提供，本组件纯展示 + 事件上抛 20261020 #6
const props = withDefaults(
  defineProps<{
    // 按排分组并补位后的卡片行（含占位卡）
    rows: CardRowGroup<RoomModel>[];
    // 卡片缩放比例（父页 useCardGrid 持有）
    zoom: number;
    // 记录数文案
    totalText: string;
    // 卡片信息行配置（各页字段不同）
    metaFields: RoomCardMetaField[];
    // 状态胶囊取值的字段名列表（收紧为 keyof RoomModel，拼错编译期即报错 20261020 P2 C3；空数组则不渲染状态行）
    statusFields?: (keyof RoomModel)[];
    // 操作链接配置（各页操作与门控不同）
    actions?: RoomCardAction[];
    // 长文本截断口径：'ellipsis'=前7字+…（contacts/buried），'dots'=前6字+4个半角点（reserve，同公共 truncateCardText）
    truncateMode?: 'ellipsis' | 'dots';
    // 每卡状态外框类名生成（reserve 按未售/已预定/已售/下葬/到期着色），缺省不加外框类
    cardClass?: (row: RoomModel) => string;
    // 首行编号点击上抛的 action 名（供墓位业务页「编号点击进详情」）；缺省编号不可点 20261020 P2 S2
    serialAction?: string;
  }>(),
  {
    statusFields: () => [],
    actions: () => [],
    truncateMode: 'ellipsis',
    cardClass: undefined,
    serialAction: undefined,
  },
);

const emit = defineEmits<{
  (e: 'zoom-in'): void;
  (e: 'zoom-out'): void;
  (e: 'action', name: string, row: RoomModel): void;
  (e: 'scroll', top: number): void;
}>();

// 状态胶囊修饰类：提取枚举 key 最后一段（如 sold/buried），同各页原实现
const statusKey = (status?: string) => (status ? String(status).split('.').pop() || '' : '');

// 坐标文案改走双语词条（审查修复 20261021 三轮 P2-16）：原写法把“排/号”直写进模板文本节点，
// 是全仓唯一未走 i18n 的展示文本，英文界面会露出中文；空位卡与正常卡同源用这一句，故抽到一处，
const formatSerial = (yNum: number | string, xNum: number | string) =>
  `${yNum}${translate('operate.row')}${xNum}${translate('operate.number')}`;

// 卡片长文本截断：超过7字截断，口径由 truncateMode 决定（ellipsis=前7字+…；dots=前6字+....），悬停 tooltip 展示完整内容
const truncateText = (value: string) => {
  if (value.length <= 7) return value;
  return props.truncateMode === 'dots' ? `${value.slice(0, 6)}....` : `${value.slice(0, 7)}…`;
};

// 按字段名从墓位行取原始值（RoomModel 无索引签名，经 unknown 中转后按 Record 读取；入参收紧为 keyof RoomModel 20261020 C3）
const cellSource = (row: RoomModel, field: keyof RoomModel): string =>
  String((row as unknown as Record<string, unknown>)[field] ?? '');
const rawCell = (row: RoomModel, mf: RoomCardMetaField): unknown =>
  (row as unknown as Record<string, unknown>)[mf.field];
const textCell = (row: RoomModel, mf: RoomCardMetaField): string => String(rawCell(row, mf) ?? '');

// 操作链接按各行显示条件过滤（无 visible 恒显示）
const visibleActions = (row: RoomModel) => (props.actions ?? []).filter((a) => !a.visible || a.visible(row));

// 卡片区滚动容器：滚动位置实时上抛，父页 onActivated 经 restoreScroll 恢复（tab 往返保持滚动行，口径同原 reserve 页）
const viewportRef = ref<HTMLElement | null>(null);
const onScroll = (e: Event) => emit('scroll', (e.target as HTMLElement).scrollTop);
defineExpose({
  restoreScroll: (top: number) => {
    if (viewportRef.value) viewportRef.value.scrollTop = top;
  },
});
</script>
<style lang="less" scoped>
// 卡片列表结构样式：引卡片结构 mixin 子库（非全量业务库，避开无关裸类成死规则），
// 以中性前缀 roomcard 实体化，与 gravePlotBusiness/BusinessCardList 用同构方式各自 scoped 内聚 20261020 #6
@import '../../style/business/card-page-mixins.less';

// ==================== 卡片页公共结构（中性前缀 roomcard） ====================
// 结构 mixin 自身即产出 .roomcard-xxx 类，直接顶层调用即可（与原各页 index.less 同范式），
// 不要再套一层同名类，否则会生成 .roomcard-list-body .roomcard-list-body 死规则 20261020 #6
.cms-list-body(roomcard);
.cms-list-toolbar(roomcard);
.cms-card-layout(roomcard);
.cms-card-basic(roomcard);
.cms-card-empty-dashed(roomcard);
// 卡片统一迭代样式套件：hover 凸显/首行胶囊/两端对齐/状态胶囊/操作两端对齐（各页调用参数与原页一致）
.cms-card-hover-highlight(roomcard);
.cms-card-head-pill(roomcard);
.cms-card-meta-between(roomcard);
.cms-card-status-tags(roomcard);
// 四个操作链接两端对齐，间隙 2px（与原 contacts/buried 页一致）
.cms-card-actions-between(roomcard, 2px);
// 每卡状态外框色（未售/已预定/已售/下葬/到期）：reserve 页启用；对 contacts/buried 为惰性规则（无匹配类名、无副作用）。
// 需位于 cms-card-hover-highlight 之后以同特异性覆盖 hover 边框色（mixin 注释口径）
.cms-card-status-frame(roomcard);

// 英文态操作链接较长（Detail/Create/Modify/Delete）会撑宽卡片，统一加宽至 200px 保证同排等宽；
// 卡片区迁入本组件后原各页 .en_US .X-card 页 scoped 规则已不再命中子卡片，故上移到组件统一持有
// （.en_US 为 App.vue router-view 根类、系祖先，scoped 仅末位选择器带 data-v，祖先不受限制故照常命中）20261020 P2 S1a
.en_US .roomcard-card-layout .roomcard-card {
  flex-basis: 200px;
}

// 信息行标题为 t-link 时（labelAction），组件库对 .t-link 用 font 简写（14px/22px）会撑高信息行，
// 需 :deep 显式改回信息行 12px/16px（同原 gravePlotBusiness/BusinessCardList 口径 20261020 P2 S2）
.roomcard-card__meta {
  :deep(.t-link) {
    font-size: 12px;
    line-height: 16px;
  }
}

// 首行编号可点击进详情：悬停小手 + hover 品牌色提示可点（仅 serialAction 存在时上该类，空位卡无）20261020 P2 S2
.roomcard-card__serial--clickable {
  cursor: pointer;

  &:hover {
    color: var(--td-brand-color);
  }
}
</style>

<template>
  <div class="detail-base">
    <!-- 墓穴信息卡片：标题与销售/下葬等卡片一致展示在卡片头部，返回按钮在头部右侧，不再单独突出显示 20260914 修改 -->
    <t-card :title="$t('pages.room.detailTitle')" :bordered="false">
      <template #actions>
        <!-- 返回按钮：文字在前图标在后，样式统一用全局公共类 cms-back-btn 20260921 修改 -->
        <t-button class="cms-back-btn" theme="default" variant="text" @click="handleClose">
          {{ $t('operate.backDetail') }}
          <rollback-icon size="16px" />
        </t-button>
      </template>
      <div v-if="room" class="info-block">
        <div v-for="(item, index) in detailData" :key="index" class="info-item">
          <h1>{{ item.name }}</h1>
          <span>{{ item.value }}</span>
        </div>
      </div>
    </t-card>
    <!-- 该墓穴存在有效预定时展示只读预定信息卡片，样式参照墓穴信息 20260907 新增 -->
    <t-card v-if="reserve" :title="$t('pages.reserve.reserveInfoTitle')" :bordered="false">
      <div class="info-block">
        <div class="info-item">
          <h1>{{ $t('pages.reserve.liaison') }}</h1>
          <span>{{ display(reserve?.liaison) }}</span>
        </div>
        <div class="info-item">
          <h1>{{ $t('pages.reserve.liaisonPhone') }}</h1>
          <span>{{ display(reserve?.liaisonPhone) }}</span>
        </div>
        <div class="info-item">
          <h1>{{ $t('pages.reserve.remark') }}</h1>
          <span>{{ display(reserve?.remark) }}</span>
        </div>
        <div class="info-item">
          <h1>{{ $t('pages.reserve.operator') }}</h1>
          <span>{{ display(reserve?.operator) }}</span>
        </div>
      </div>
    </t-card>
    <!-- 该墓穴存在有效销售时展示只读销售信息卡片，样式参照墓穴信息 20260907 新增 -->
    <t-card v-if="sale" :title="$t('pages.sale.saleInfoTitle')" :bordered="false">
      <div class="info-block">
        <div class="info-item">
          <h1>{{ $t('pages.sale.realPrice') }}</h1>
          <span>{{ sale?.realPrice ? formatPrice(sale.realPrice) : display(sale?.realPrice) }}</span>
        </div>
        <!-- 付款人电话：位于实收金额之后，与付款人互换位置 20260919 修改 -->
        <div class="info-item">
          <h1>{{ $t('pages.sale.phone') }}</h1>
          <span>{{ display(sale?.payerPhone) }}</span>
        </div>
        <!-- 收款人：与经办人互换位置 20260919 修改 -->
        <div class="info-item">
          <h1>{{ $t('pages.sale.payee') }}</h1>
          <span>{{ display(sale?.payee) }}</span>
        </div>
        <!-- 经办人：与收款人互换位置 20260919 修改 -->
        <div class="info-item">
          <h1>{{ $t('pages.sale.operator') }}</h1>
          <span>{{ display(sale?.operator) }}</span>
        </div>
        <!-- 付款人：与付款人电话互换位置 20260919 修改 -->
        <div class="info-item">
          <h1>{{ $t('pages.sale.payer') }}</h1>
          <span>{{ display(sale?.payer) }}</span>
        </div>
        <div class="info-item">
          <h1>{{ $t('pages.sale.payerIDCard') }}</h1>
          <span>{{ display(sale?.payerIDCard) }}</span>
        </div>
        <div class="info-item">
          <h1>{{ $t('pages.sale.remark') }}</h1>
          <span>{{ display(sale?.remark) }}</span>
        </div>
        <!-- 创建日期：展示为 YYYY-MM-DD 20260919 新增 -->
        <div class="info-item">
          <h1>{{ $t('pages.sale.createDate') }}</h1>
          <span>{{ sale?.createDate ? formatDate(sale.createDate) : display(sale?.createDate) }}</span>
        </div>
      </div>
    </t-card>
    <!-- 该墓穴存在下葬记录时展示只读下葬信息卡片：下葬记录可能多条，改用表格列表展示 20260912 修改 -->
    <t-card v-if="buried && buried.length" :title="$t('pages.buried.buriedInfoTitle')" :bordered="false">
      <t-table
        row-key="idBuried"
        table-layout="fixed"
        bordered
        size="small"
        :max-height="240"
        :style="detailTableStyle"
        :data="buriedRows"
        :columns="buriedColumns"
      />
    </t-card>
    <!-- 该墓位存在管理费收款记录时展示只读管理费收款信息卡片：收款记录可能多条，列表样式与下葬信息一致 20260912 新增 -->
    <t-card v-if="adminfees && adminfees.length" :title="$t('pages.adminfee.detailTitle')" :bordered="false">
      <t-table
        row-key="idAdminfee"
        table-layout="fixed"
        bordered
        size="small"
        :max-height="240"
        :style="detailTableStyle"
        :data="adminfeeRows"
        :columns="adminfeeColumns"
      />
    </t-card>
    <!-- 该墓位存在联系人记录时展示只读联系人卡片：联系人记录可能多条，列表样式与收款信息一致 20260912 新增 -->
    <t-card v-if="contacts && contacts.length" :title="$t('pages.contacts.detailTitle')" :bordered="false">
      <t-table
        row-key="idContacts"
        table-layout="fixed"
        bordered
        size="small"
        :max-height="240"
        :style="detailTableStyle"
        :data="contactsRows"
        :columns="contactsColumns"
      />
    </t-card>
  </div>
</template>
<script lang="ts">
export default {
  name: 'RoomDetail',
};
</script>
<script setup lang="ts">
import dayjs from 'dayjs';
import { RollbackIcon } from 'tdesign-icons-vue-next';
import type { PrimaryTableCol, TableRowData } from 'tdesign-vue-next';
import { computed } from 'vue';

import type { AdminfeeModel } from '@/api/model/adminfeeModel';
import type { BuriedModel } from '@/api/model/buriedModel';
import type { ContactsModel } from '@/api/model/contactsModel';
import type { RoomModel } from '@/api/model/roomModel';
import type { ReserveModel } from '@/api/reserve';
import type { SaleModel } from '@/api/sale';
import { i18n } from '@/locales';
import { formatDate } from '@/utils/date';
import { formatPrice } from '@/utils/format';

// 墓穴详情统一组件：墓区销售页与墓区预定页共用，展示完全相同的信息 20260907 新增,
const props = defineProps<{
  // 单条墓位数据，null 表示尚未加载
  room: RoomModel | null;
  // 该墓穴当前活动预定记录，null 表示无有效预定，不展示预定信息卡片
  reserve: ReserveModel | null;
  // 该墓穴当前活动销售记录，null 表示无有效销售，不展示销售信息卡片
  sale: SaleModel | null;
  // 该墓穴的下葬记录（可能多条），null/未传表示无下葬记录，不展示下葬信息卡片 20260912 修改
  buried?: BuriedModel[];
  // 该墓位的管理费收款记录（可能多条），null/未传表示无收款记录，不展示管理费收款信息卡片 20260912 新增
  adminfees?: AdminfeeModel[];
  // 该墓位的联系人记录（可能多条），null/未传表示无联系人记录，不展示联系人卡片 20260912 新增
  contacts?: ContactsModel[];
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const translate = (key: string) => String((i18n.global as any).t(key));

// 下葬/收款/联系人三张详情列表统一固定总宽（即各表列宽总和）；
// t-table 默认宽 100% 会被卡片宽度拉伸，固定宽度后三表渲染宽度完全一致，窄容器下退回 100% 避免溢出 20260912 修改
const DETAIL_TABLE_WIDTH = 1104;
const detailTableStyle = { width: `${DETAIL_TABLE_WIDTH}px`, maxWidth: '100%' };

// 字段值为 null/空时统一展示“未填写” 20260907 新增,
const display = (value: string | number | null | undefined): string => {
  if (value === null || value === undefined) return translate('operate.notFilled');
  const str = String(value).trim();
  return str === '' ? translate('operate.notFilled') : str;
};

// 以 i18n key 存储的字段（墓穴类型/各状态）先判空再翻译，空则展示“未填写” 20260907 新增,
const displayKey = (key: string | null | undefined): string => {
  if (key === null || key === undefined || String(key).trim() === '') return translate('operate.notFilled');
  return translate(String(key));
};

// 墓穴信息字段：区域/园区/排号/序号/编号/墓穴类型/规格/安葬者/单价/管理费结束日期/预定状态/销售状态/下葬状态/迁出状态，
// 与墓区设置页详情标准一致（不含修复状态） 20260912 修改 20260916 加迁出状态 20260917 去购买人,
const detailData = computed<{ name: string; value: string }[]>(() => {
  const { room } = props;
  if (!room) return [];
  return [
    // 区域：详情第一字段展示 20260912 新增
    { name: translate('pages.room.region'), value: display(room.region) },
    { name: translate('pages.room.park'), value: display(room.park) },
    { name: translate('pages.room.yNum'), value: display(room.yNum) },
    { name: translate('pages.room.xNum'), value: display(room.xNum) },
    // 墓区编号：墓区设置/销售/预定/下葬/联系/管理费/销售查询页详情统一展示 20260912 新增
    { name: translate('pages.room.xyNumber'), value: display(room.xyNumber) },
    { name: translate('pages.room.roomType'), value: displayKey(room.roomType) },
    { name: translate('pages.room.specs'), value: display(room.specs) },
    // 购买人不再展示：销售信息卡片已有付款人字段，避免重复 20260917 移除；安葬者保留 20260912 新增
    { name: translate('pages.room.deceased'), value: display(room.deceased) },
    { name: translate('pages.room.price'), value: display(formatPrice(room.price)) },
    // 管理费结束日期：后端在下葬/收款事务中维护，详情统一展示并格式化为 YYYY-MM-DD 20260912 新增
    { name: translate('pages.room.endDate'), value: display(formatDate(room.endDate)) },
    { name: translate('pages.room.reserveStatus'), value: displayKey(room.reserveStatus) },
    { name: translate('pages.room.saleStatus'), value: displayKey(room.saleStatus) },
    { name: translate('pages.room.intoStatus'), value: displayKey(room.intoStatus) },
    // 迁出状态：库表新增字段，详情统一展示，旧数据 NULL 展示“未填写” 20260916 新增
    { name: translate('pages.room.transferOutStatus'), value: displayKey(room.transferOutStatus) },
  ];
});

const handleClose = () => {
  emit('close');
};

// 下葬记录列表列定义：序号/安葬者/安葬者身份证号/下葬日期/联系人/联系人电话/备注/经办人/创建日期，
// 各列左对齐；列宽 64/240/160/110/110/130/90/90/110，总宽 1104 与其它两表统一 20260912 修改
const buriedColumns = computed<PrimaryTableCol<TableRowData>[]>(() => [
  { colKey: 'serial-number', title: translate('pages.buried.index'), width: 50, align: 'left' },
  // 安葬者列宽 240：容纳约 15 个中文字符，与收款金额+缴费年限两列合计上下对齐 20260912 修改
  { colKey: 'deceased', title: translate('pages.buried.deceased'), width: 240, align: 'left', ellipsis: true },
  // 安葬者身份证号列：位于安葬者右侧，与开始日期列上下对齐 20260912 新增
  {
    colKey: 'deceasedIDCard',
    title: translate('pages.buried.deceasedIDCard'),
    width: 160,
    align: 'left',
    ellipsis: true,
  },
  // 下葬日期列：与结束日期列上下对齐 20260912 修改
  { colKey: 'burialDate', title: translate('pages.buried.burialDate'), width: 110, align: 'left', ellipsis: true },
  // 联系人列：与付款人列上下对齐 20260912 修改
  { colKey: 'contacts', title: translate('pages.buried.contacts'), width: 110, align: 'left', ellipsis: true },
  // 联系人电话列：与付款人电话列上下对齐 20260912 修改
  {
    colKey: 'contactsphone',
    title: translate('pages.buried.contactsPhone'),
    width: 130,
    align: 'left',
    ellipsis: true,
  },
  // 备注列：与收款信息表格备注列上下对齐（同宽同位置） 20260912 修改
  { colKey: 'remark', title: translate('pages.buried.remark'), width: 90, align: 'left', ellipsis: true },
  // 经办人列：与收款信息表格经办人列上下对齐（同宽同位置） 20260912 新增
  { colKey: 'operator', title: translate('pages.buried.operator'), width: 90, align: 'left', ellipsis: true },
  // 创建日期列：与收款信息表格创建日期列上下对齐（同宽同位置） 20260912 新增
  { colKey: 'createDate', title: translate('pages.buried.createDate'), width: 110, align: 'left', ellipsis: true },
]);

// 下葬记录展示数据：按下葬日期正序（升序）排列，空值统一展示“未填写” 20260912 修改
const buriedRows = computed(() =>
  [...(props.buried ?? [])]
    .sort((left, right) => {
      const leftTime = dayjs(left.burialDate);
      const rightTime = dayjs(right.burialDate);
      if (leftTime.isValid() && rightTime.isValid()) return leftTime.valueOf() - rightTime.valueOf();
      // 日期无效的记录排在末尾，保持相对顺序 20260912 新增
      if (leftTime.isValid()) return -1;
      if (rightTime.isValid()) return 1;
      return 0;
    })
    .map((row) => ({
      idBuried: row.idBuried,
      deceased: display(row.deceased),
      deceasedIDCard: display(row.deceasedIDCard),
      burialDate: display(formatDate(row.burialDate)),
      contacts: display(row.contacts),
      contactsphone: display(row.contactsphone),
      remark: display(row.remark),
      operator: display(row.operator),
      createDate: display(formatDate(row.createDate)),
    })),
);

// 管理费收款记录列表列定义：序号/收款金额/缴费年限/开始日期/结束日期/付款人/付款人电话/备注/经办人/创建日期，
// 各列左对齐；列宽 64/130+110/160/110/110/110/130/90/90/110，总宽 1104 与其它两表统一 20260912 修改
const adminfeeColumns = computed<PrimaryTableCol<TableRowData>[]>(() => [
  { colKey: 'serial-number', title: translate('pages.adminfee.index'), width: 50, align: 'left' },
  // 收款金额列：与缴费年限列合计同安葬者列上下对齐 20260912 修改
  { colKey: 'payAmount', title: translate('pages.adminfee.payAmount'), width: 130, align: 'left', ellipsis: true },
  { colKey: 'termYears', title: translate('pages.adminfee.termYears'), width: 110, align: 'left', ellipsis: true },
  // 开始日期列：与安葬者身份证号列上下对齐 20260912 修改
  { colKey: 'startDate', title: translate('pages.adminfee.startDate'), width: 160, align: 'left', ellipsis: true },
  // 结束日期列：与下葬日期列上下对齐 20260912 修改
  { colKey: 'endDate', title: translate('pages.adminfee.endDate'), width: 110, align: 'left', ellipsis: true },
  // 付款人列：与联系人列上下对齐 20260912 修改
  { colKey: 'payer', title: translate('pages.adminfee.payer'), width: 110, align: 'left', ellipsis: true },
  // 付款人电话列：与联系人电话列上下对齐 20260912 修改
  { colKey: 'payePrhone', title: translate('pages.adminfee.payePrhone'), width: 130, align: 'left', ellipsis: true },
  // 备注列：与下葬信息表格备注列上下对齐（同宽同位置） 20260912 修改
  { colKey: 'remark', title: translate('pages.adminfee.remark'), width: 90, align: 'left', ellipsis: true },
  // 经办人列：与下葬信息表格经办人列上下对齐（同宽同位置） 20260912 新增
  { colKey: 'operator', title: translate('pages.adminfee.operator'), width: 90, align: 'left', ellipsis: true },
  // 创建日期列：与下葬信息表格创建日期列上下对齐（同宽同位置） 20260912 新增
  { colKey: 'createDate', title: translate('pages.adminfee.createDate'), width: 110, align: 'left', ellipsis: true },
]);

// 管理费收款记录展示数据：按开始日期正序（升序）排列，收款金额千分位、空值统一展示“未填写” 20260912 新增
const adminfeeRows = computed(() =>
  [...(props.adminfees ?? [])]
    .sort((left, right) => {
      const leftTime = dayjs(left.startDate);
      const rightTime = dayjs(right.startDate);
      if (leftTime.isValid() && rightTime.isValid()) return leftTime.valueOf() - rightTime.valueOf();
      // 日期无效的记录排在末尾，保持相对顺序 20260912 新增
      if (leftTime.isValid()) return -1;
      if (rightTime.isValid()) return 1;
      return 0;
    })
    .map((row) => ({
      idAdminfee: row.idAdminfee,
      payAmount:
        row.payAmount === null || row.payAmount === undefined ? display(row.payAmount) : formatPrice(row.payAmount),
      termYears: display(row.termYears),
      startDate: display(formatDate(row.startDate)),
      endDate: display(formatDate(row.endDate)),
      payer: display(row.payer),
      payePrhone: display(row.payePrhone),
      remark: display(row.remark),
      operator: display(row.operator),
      createDate: display(formatDate(row.createDate)),
    })),
);

// 联系人记录列表列定义：序号/联系人/联系人电话/身份证号/备注，
// 各列左对齐；列宽 64/240/250/250/300，总宽 1104 与其它两表统一 20260912 修改
const contactsColumns = computed<PrimaryTableCol<TableRowData>[]>(() => [
  { colKey: 'serial-number', title: translate('pages.contacts.index'), width: 50, align: 'left' },
  { colKey: 'contacts', title: translate('pages.contacts.contacts'), width: 240, align: 'left', ellipsis: true },
  {
    colKey: 'contactsPhone',
    title: translate('pages.contacts.contactsPhone'),
    width: 270,
    align: 'left',
    ellipsis: true,
  },
  {
    colKey: 'contactsIDCard',
    title: translate('pages.contacts.contactsIDCard'),
    width: 240,
    align: 'left',
    ellipsis: true,
  },
  { colKey: 'remark', title: translate('pages.contacts.remark'), width: 290, align: 'left', ellipsis: true },
]);

// 联系人记录展示数据：保持后端返回顺序（idContacts DESC，最新在前），空值统一展示“未填写” 20260912 新增
const contactsRows = computed(() =>
  [...(props.contacts ?? [])].map((row) => ({
    idContacts: row.idContacts,
    contacts: display(row.contacts),
    contactsPhone: display(row.contactsPhone),
    contactsIDCard: display(row.contactsIDCard),
    remark: display(row.remark),
  })),
);
</script>
<style lang="less" scoped>
.detail-base {
  // 容器外观与墓区设置页新建/修改页 form-basic-container 一致：白底圆角，内容水平居中、宽度固定 20260907 新增 20260914 参考新建/修改页样式
  display: flex;
  flex-direction: column;
  align-items: center;
  background-color: var(--td-bg-color-container);
  border-radius: var(--td-radius-medium) var(--td-radius-medium) 0 0;
  padding: var(--td-comp-paddingTB-xxl) var(--td-comp-paddingLR-xxl) 80px var(--td-comp-paddingLR-xxl);
  gap: var(--td-comp-margin-l);

  @media (max-width: @screen-sm-max) {
    padding: var(--td-comp-paddingTB-xl) var(--td-comp-paddingLR-xl) 80px var(--td-comp-paddingLR-xl);
  }

  :deep(.t-card) {
    padding: var(--td-comp-paddingTB-xxl) var(--td-comp-paddingLR-xxl);
    // 卡片固定宽度 = 详情表格列宽总和 1104 + 左右内边距 ×2，
    // 内容宽度不随屏幕变宽而拉伸；窄屏退回 100% 避免溢出 20260914 新增
    width: calc(1104px + var(--td-comp-paddingLR-xxl) * 2);
    max-width: 100%;
  }

  :deep(.t-card__header) {
    padding: 0;
    margin-bottom: var(--td-comp-margin-m);
  }

  :deep(.t-card__body) {
    padding: 0;
  }

  :deep(.t-card__title) {
    font: var(--td-font-title-large);
    font-weight: 400;
  }

  // 下葬/收款/联系人三张详情列表展示列竖线：TDesign 默认仅水平分隔线，
  // 列之间竖线需自定义（表头与表体单元格加右边框），末列不画右边框 20260912 新增
  :deep(.t-table th),
  :deep(.t-table td) {
    border-right: 1px solid var(--td-border-level-1-color);
  }

  :deep(.t-table th:last-child),
  :deep(.t-table td:last-child) {
    border-right: none;
  }
}

.info-block {
  column-count: 2;

  .info-item {
    padding-top: var(--td-comp-margin-m);
    display: flex;
    color: var(--td-text-color-primary);

    h1 {
      width: 160px;
      font: var(--td-font-body-medium);
      color: var(--td-text-color-secondary);
      font-weight: normal;
      text-align: left;

      @media (max-width: @screen-sm-max) {
        width: 80px;
      }

      @media (min-width: @screen-md-min) and (max-width: @screen-md-max) {
        width: 120px;
      }
    }

    span {
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
      margin-left: var(--td-comp-margin-xxl);
    }
  }
}
</style>

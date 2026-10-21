import { MessagePlugin } from 'tdesign-vue-next';
import { ref } from 'vue';

import { getAdminfeeList } from '@/api/adminfee';
import { getBuriedList } from '@/api/buried';
import { getContactsList } from '@/api/contacts';
import type { AdminfeeModel } from '@/api/model/adminfeeModel';
import type { BuriedModel } from '@/api/model/buriedModel';
import type { ContactsModel } from '@/api/model/contactsModel';
import type { RoomModel } from '@/api/model/roomModel';
import type { ReserveModel } from '@/api/reserve';
import { getReserveByRoom } from '@/api/reserve';
import { getIdList } from '@/api/room';
import type { SaleModel } from '@/api/sale';
import { getSaleByRoom } from '@/api/sale';
import type { TransferOutModel } from '@/api/transferOut';
import { getTransferOutListByIdRoom } from '@/api/transferOut';
import { logError } from '@/utils/logger';

/**
 * 共用详情页数据 hook：墓区系统 10 个业务页（6 卡片页 + 4 查询页）统一使用
 * room-detail 组件展示详情，各页原逐字重复的 6 个状态 + 拉取 + 清空逻辑收敛于此，
 * 保证任一页面打开同一墓位的详情卡片集合完全一致（历史遗漏教训见下）。
 * 20260914 从 10 页抽取
 */
// 7 类详情卡片的可读名称（顺序与并行拉取的 7 个请求逐一对应）:局部失败时用于告知用户缺了哪几类， 20261021 二轮 P1-3 新增,
const DETAIL_SECTION_LABELS = ['墓位信息', '预定记录', '销售记录', '下葬记录', '管理费记录', '联系人记录', '迁出记录'];

export const useRoomDetail = () => {
  // 单条墓位数据，null 表示尚未加载
  const detailRoom = ref<RoomModel | null>(null);
  // 该墓位当前活动预定记录，null 表示无有效预定
  const detailReserve = ref<ReserveModel | null>(null);
  // 该墓位当前活动销售记录，null 表示无有效销售
  const detailSale = ref<SaleModel | null>(null);
  // 该墓位的下葬记录（可能多条），全量传入由详情组件表格展示
  const detailBuried = ref<BuriedModel[]>([]);
  // 该墓位的管理费收款记录（可能多条）
  const detailAdminfees = ref<AdminfeeModel[]>([]);
  // 该墓位的联系人记录（可能多条）
  const detailContacts = ref<ContactsModel[]>([]);
  // 该墓位最新的迁出记录（可能多条，详情按单条展示最新一条），null/未传表示无迁出记录，不展示迁出信息卡片 20261005 新增
  const detailTransferOut = ref<TransferOutModel | null>(null);

  // 拉取单条墓位与活动预定/销售记录、下葬/收款/联系人/迁出记录列表。
  // 7 类数据逐类都要拉,任一遗漏会导致该页详情卡片与其他页不一致(历史遗漏教训见上)
  // 单路失败不再让整体详情打不开(审查修复 20261021 二轮 P1-3):原 Promise.all 只要一路 403/超时
  // 即整体 reject,调用方的 catch 使详情视图根本不出现且只剩控制台报错,表现为“点详情没反应”;
  // 现按逐项降级处理:失败的辅助卡片按空集合展示,其余照常,集中提示一次缺了哪几类, 20261021 修改,
  const loadDetail = async (idRoom: number) => {
    // 7 类数据互不依赖,并行拉取:详情打开耗时从“串行 7 次之和”降为“最慢一次”
    const settled = await Promise.allSettled([
      getIdList(idRoom),
      getReserveByRoom(idRoom),
      getSaleByRoom(idRoom),
      getBuriedList(idRoom),
      getAdminfeeList(idRoom),
      getContactsList(idRoom),
      getTransferOutListByIdRoom(idRoom),
    ]);
    // 墓位主记录是详情的前提:它失败时不降级(降级只会打开一个空白详情),沿用原行为向上抛,由页面提示,
    if (settled[0].status === 'rejected') {
      throw settled[0].reason;
    }
    const listOf = <T>(result: PromiseSettledResult<{ list?: T[] }>): T[] =>
      result.status === 'fulfilled' ? (result.value?.list ?? []) : [];
    const roomList = listOf<RoomModel>(settled[0]);
    const reserveList = listOf<ReserveModel>(settled[1]);
    const saleList = listOf<SaleModel>(settled[2]);
    const buriedList = listOf<BuriedModel>(settled[3]);
    const adminfeeList = listOf<AdminfeeModel>(settled[4]);
    const contactsList = listOf<ContactsModel>(settled[5]);
    const transferOutList = listOf<TransferOutModel>(settled[6]);
    detailRoom.value = roomList.length > 0 ? roomList[0] : null;
    detailReserve.value = reserveList.length > 0 ? reserveList[0] : null;
    detailSale.value = saleList.length > 0 ? saleList[0] : null;
    detailBuried.value = buriedList;
    detailAdminfees.value = adminfeeList;
    detailContacts.value = contactsList;
    detailTransferOut.value = transferOutList.length > 0 ? transferOutList[0] : null;

    // 失败原因写控制台日志(便于排障)同时让用户看见(与全站“失败不只写控制台”口径一致 20261021),
    const failedLabels = DETAIL_SECTION_LABELS.filter((_, index) => index > 0 && settled[index].status === 'rejected');
    settled.forEach((result, index) => {
      if (result.status === 'rejected' && index > 0) {
        logError(result.reason);
      }
    });
    if (failedLabels.length > 0) {
      MessagePlugin.warning(`详情局部数据加载失败：${failedLabels.join('、')}`);
    }
    return failedLabels;
  };

  // 详情关闭：清空全部详情数据，视图切换由各页自行处理
  const clearDetail = () => {
    detailRoom.value = null;
    detailReserve.value = null;
    detailSale.value = null;
    detailBuried.value = [];
    detailAdminfees.value = [];
    detailContacts.value = [];
    detailTransferOut.value = null;
  };

  return {
    detailRoom,
    detailReserve,
    detailSale,
    detailBuried,
    detailAdminfees,
    detailContacts,
    detailTransferOut,
    loadDetail,
    clearDetail,
  };
};

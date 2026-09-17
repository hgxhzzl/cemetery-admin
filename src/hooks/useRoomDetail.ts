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

/**
 * 共用详情页数据 hook：墓区系统 10 个业务页（6 卡片页 + 4 查询页）统一使用
 * room-detail 组件展示详情，各页原逐字重复的 6 个状态 + 拉取 + 清空逻辑收敛于此，
 * 保证任一页面打开同一墓位的详情卡片集合完全一致（历史遗漏教训见下）。
 * 20260914 从 10 页抽取
 */
export const useRoomDetail = () => {
  // 单条墓位数据，null 表示尚未加载
  const detailRoom = ref<RoomModel | null>(null);
  // 该墓穴当前活动预定记录，null 表示无有效预定
  const detailReserve = ref<ReserveModel | null>(null);
  // 该墓穴当前活动销售记录，null 表示无有效销售
  const detailSale = ref<SaleModel | null>(null);
  // 该墓穴的下葬记录（可能多条），全量传入由详情组件表格展示
  const detailBuried = ref<BuriedModel[]>([]);
  // 该墓位的管理费收款记录（可能多条）
  const detailAdminfees = ref<AdminfeeModel[]>([]);
  // 该墓位的联系人记录（可能多条）
  const detailContacts = ref<ContactsModel[]>([]);

  // 拉取单条墓位与活动预定/销售记录、下葬/收款/联系人记录列表。
  // 6 类数据必须全部拉取，任一遗漏会导致该页详情卡片与其他页不一致
  const loadDetail = async (idRoom: number) => {
    // 6 类数据互不依赖，Promise.all 并行拉取：详情打开耗时从“串行 6 次之和”降为“最慢一次”
    const [
      { list },
      { list: reserveList },
      { list: saleList },
      { list: buriedList },
      { list: adminfeeList },
      { list: contactsList },
    ] = await Promise.all([
      getIdList(idRoom),
      getReserveByRoom(idRoom),
      getSaleByRoom(idRoom),
      getBuriedList(idRoom),
      getAdminfeeList(idRoom),
      getContactsList(idRoom),
    ]);
    detailRoom.value = list && list.length > 0 ? list[0] : null;
    detailReserve.value = reserveList && reserveList.length > 0 ? reserveList[0] : null;
    detailSale.value = saleList && saleList.length > 0 ? saleList[0] : null;
    detailBuried.value = buriedList;
    detailAdminfees.value = adminfeeList;
    detailContacts.value = contactsList;
  };

  // 详情关闭：清空全部详情数据，视图切换由各页自行处理
  const clearDetail = () => {
    detailRoom.value = null;
    detailReserve.value = null;
    detailSale.value = null;
    detailBuried.value = [];
    detailAdminfees.value = [];
    detailContacts.value = [];
  };

  return {
    detailRoom,
    detailReserve,
    detailSale,
    detailBuried,
    detailAdminfees,
    detailContacts,
    loadDetail,
    clearDetail,
  };
};

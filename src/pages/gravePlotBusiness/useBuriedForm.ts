// ============================================================
// 下葬形态（数据表 buried）记录列表与三视图导航逻辑：自 index.vue 拆出（四轮 P2-3 巨石拆分 20261022）
// 口径参照 useCertificateForm / useContactsForm，但只抽「记录列表 + 单选切换/回填 + 列表/新增/修改视图导航 + 提交后停留刷新」。
// 关键区别：下葬与预定/销售共用同一份 formBusinessData 与同一条 submitCore 提交主流程（按 isBuriedMode 选表、联动 buried），
// 并非独立表独立提交，故字段编辑与提交校验仍留页面共享逻辑、不并入本模块，保持行为与原内联完全一致。
// 记录列表数据由页面共享的 fillBusinessForm(idRoom,'buried') 写入（本模块持有 buriedRecords 并返回，页面复用同一 ref）。
// ============================================================
import type { Ref } from 'vue';
import { ref } from 'vue';

import type { GravePlotBusinessFormType, GravePlotBusinessModel } from '@/api/gravePlotBusiness';
import { formatDate } from '@/utils/date';

import type { INITIAL_BUSINESS_DATA, INITIAL_ROOM_DATA } from './constants';
import type { BuriedEditMode } from './useCertificateForm';

type RoomFormData = typeof INITIAL_ROOM_DATA;
type BusinessFormData = typeof INITIAL_BUSINESS_DATA;

/**
 * 下葬形态记录选择与视图导航：记录列表、按选中记录回填业务表单、新增/修改/取消视图切换、提交后刷新停留。
 * 依赖当前墓位/业务表单、下葬子视图态及页面共享的记录加载/重置函数，由页面注入以保持单向数据流。
 */
export const useBuriedForm = (deps: {
  // 当前墓位信息：重置/刷新按当前墓位 idRoom 进行
  formRoomData: Ref<RoomFormData>;
  // 业务登记表单（下葬字段随记录回填/重置写回此共享表单，提交仍走页面 submitCore）
  formBusinessData: Ref<BusinessFormData>;
  // 下葬形态子视图态：list/add/modify/certificate（certificate 由 useCertificateForm 使用同一 ref）
  buriedEditMode: Ref<BuriedEditMode>;
  // 卡片列表刷新（提交/删除成功后刷新墓位卡片）
  getRoomData: () => Promise<unknown>;
  // 页面共享的活动业务记录加载与回填（type='buried' 时同时写 buriedRecords 列表）
  fillBusinessForm: (idRoom: number, type?: GravePlotBusinessFormType) => Promise<void>;
  // 页面共享的业务登记表单重置
  resetBusinessForm: (idRoom?: number) => void;
}) => {
  const { formRoomData, formBusinessData, buriedEditMode, getRoomData, fillBusinessForm, resetBusinessForm } = deps;

  // 该墓位全部活动下葬记录（倒序最新在前）：列表视图表格数据，页面 fillBusinessForm(…, 'buried') 亦写此列表 20260923 新增
  const buriedRecords = ref<GravePlotBusinessModel[]>([]);

  // 用选中的下葬记录回填表单（记录表格单选切换时），修改对象随之切换，保留墓位信息与其他形态字段不重置
  const fillBuriedFormRecord = (record: GravePlotBusinessModel) => {
    formBusinessData.value = {
      ...formBusinessData.value,
      idBusiness: record.idBuried ?? record.idBusiness,
      idRoom: record.idRoom,
      deceased: record.deceased ?? '',
      deceasedIDCard: record.deceasedIDCard ?? '',
      // 死亡日期：下葬形态虽无该控件，仍需随记录回填，避免提交时把已有日期抹空 20261011 新增,
      deathDate: formatDate(record.deathDate ?? ''),
      burialDate: record.burialDate ?? '',
      // 逝者关系：随下葬记录回填（同安葬者字段）20260925 新增,
      deceasedRelation: record.deceasedRelation ?? '',
      // 联系人三字段：buried 表列 contactsphone 全小写
      contacts: record.contacts ?? '',
      contactsphone: record.contactsphone ?? '',
      contactsIDCard: record.contactsIDCard ?? '',
      remark: record.remark ?? '',
    };
  };

  // 操作列“修改”：用该下葬记录回填表单并进入修改视图（无列表，其余与下葬页一致，数据带入）20260923 新增 20260924 修改
  const onModifyBuriedRecord = (record: GravePlotBusinessModel) => {
    fillBuriedFormRecord(record);
    buriedEditMode.value = 'modify';
  };

  // 取消（下葬形态）：新增/修改视图下退出并回填最新记录（回到含列表的下葬页）20260924 修改
  const onCancelBuried = () => {
    buriedEditMode.value = 'list';
    const record = buriedRecords.value[0];
    if (record) {
      fillBuriedFormRecord(record);
    }
  };

  // 取消（下葬形态）：重置表单为空表单保持当前墓位，不返回列表（同下葬页 onReset）
  const onResetBuried = () => {
    resetBusinessForm(formRoomData.value.idRoom);
    // 下葬形态无金额字段，保持实收金额为空（表单已转新建）
    formBusinessData.value.realPriceString = '';
  };

  // 表头“新增”：进入下葬新增视图（空表单，无列表，其余与下葬页一致），保持当前墓位 20260924 修改
  const handleClickBuriedAdd = () => {
    buriedEditMode.value = 'add';
    onResetBuried();
  };

  // 下葬形态新增/修改/删除成功后：刷新卡片与记录列表并回到列表视图（默认回填最新记录），
  // 连续操作无需重新进入；点“返回”才回墓位业务列表页 20260924 修改
  const refreshBuriedStay = async () => {
    await getRoomData();
    buriedEditMode.value = 'list';
    await fillBusinessForm(formRoomData.value.idRoom, 'buried');
  };

  return {
    buriedRecords,
    fillBuriedFormRecord,
    onModifyBuriedRecord,
    onCancelBuried,
    onResetBuried,
    handleClickBuriedAdd,
    refreshBuriedStay,
  };
};

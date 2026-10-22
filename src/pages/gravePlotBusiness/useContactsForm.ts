// ============================================================
// 联系人形态（墓位联系人，数据表 contacts）视图逻辑：自 index.vue 拆出，页面只保留模板与表单容器（四轮 P2-3 巨石拆分 20261022）
// 交互参照安葬证设置拆出口径（useCertificateForm）：新建/修改由 idContacts 是否为 0 区分，
// 三视图 list/add/modify 态与墓位信息、卡片刷新等页面级状态由 deps 注入，保持单向数据流；行为与原内联完全一致。
// 注：联系人「选择」页（下葬形态回填入口）仍留页面，与本页共享同一份 contactsRecords。
// ============================================================
import { MessagePlugin } from 'tdesign-vue-next';
import type { Ref } from 'vue';
import { ref } from 'vue';

import type { GravePlotBusinessContactsModel } from '@/api/gravePlotBusiness';
import {
  getGravePlotBusinessContacts,
  insertGravePlotBusiness,
  updateGravePlotBusiness,
} from '@/api/gravePlotBusiness';
import { translate } from '@/locales';
import { extractServerError } from '@/utils/apiError';
import { logError } from '@/utils/logger';

import type { ContactsFormData, INITIAL_BUSINESS_DATA, INITIAL_ROOM_DATA } from './constants';

// 联系人形态子视图态：list=列表视图（墓位信息+联系人列表）/ add=新增联系人（空表单）/ modify=修改联系人（数据带入）
// 20260924 新增 20261022 类型随逻辑一并抽出（同 useCertificateForm 的 BuriedEditMode 口径）
export type ContactsEditMode = 'list' | 'add' | 'modify';

type RoomFormData = typeof INITIAL_ROOM_DATA;
type BusinessFormData = typeof INITIAL_BUSINESS_DATA;

/**
 * 联系人形态表单：记录列表拉取/回填、新增/修改/取消视图切换、电话数字过滤、提交校验与保存。
 * 依赖当前墓位表单数据、业务登记表单（提交取 idRoom）、视图态与卡片刷新函数，由页面注入以保持单向数据流。
 */
export const useContactsForm = (deps: {
  // 当前墓位信息：新增保持当前墓位、提交后刷新列表按当前墓位重查
  formRoomData: Ref<RoomFormData>;
  // 业务登记表单：提交联系人记录复用其 idRoom（口径与原 submitCore 业务分支一致）
  formBusinessData: Ref<BusinessFormData>;
  // 联系人形态子视图态：进入新增/修改视图与提交/取消回列表均由本逻辑置位
  contactsEditMode: Ref<ContactsEditMode>;
  // 卡片列表刷新（提交/删除成功后刷新墓位卡片）
  getRoomData: () => Promise<unknown>;
}) => {
  const { formRoomData, formBusinessData, contactsEditMode, getRoomData } = deps;

  // 联系人编辑表单数据（contacts 表字段，独立于业务登记表单）
  const formContactsData = ref<ContactsFormData>({
    idContacts: 0,
    idRoom: 0,
    contacts: '',
    contactsPhone: '',
    contactsIDCard: '',
  });

  // 联系人记录列表：列表视图表格与「选择」页共用同一份数据（与原实现一致）
  const contactsRecords = ref<GravePlotBusinessContactsModel[]>([]);

  // 拉取该墓位活动联系人记录列表（自有 contacts-list 接口，倒序最新在前）20260924 新增
  const loadContactsRecords = async (idRoom: number) => {
    try {
      const { list } = await getGravePlotBusinessContacts(idRoom);
      contactsRecords.value = list ?? [];
    } catch (e) {
      logError(e);
      // 失败必须让用户看见:此前只写控制台,界面表现为“点了没反应”(审查修复 20261021 P2),
      MessagePlugin.error(extractServerError(e) || translate('operate.listLoadFailedPrompt'));
    }
  };

  // 联系人新增/修改/删除成功后：刷新卡片与联系人列表并回到列表视图，连续操作无需重新进入 20260924 新增
  const refreshContactsStay = async () => {
    await getRoomData();
    contactsEditMode.value = 'list';
    await loadContactsRecords(formRoomData.value.idRoom);
  };

  // 用联系人记录回填编辑表单（contacts 表字段）
  const fillContactsFormRecord = (record: GravePlotBusinessContactsModel) => {
    formContactsData.value = {
      idContacts: record.idContacts,
      idRoom: record.idRoom,
      contacts: record.contacts ?? '',
      contactsPhone: record.contactsPhone ?? '',
      contactsIDCard: record.contactsIDCard ?? '',
    };
  };

  // 操作列“修改”：回填该联系人记录并进入修改视图（无列表，数据带入）
  const onModifyContactsRecord = (record: GravePlotBusinessContactsModel) => {
    fillContactsFormRecord(record);
    contactsEditMode.value = 'modify';
  };

  // 表头“新增”：清空联系人表单并进入新增视图（无列表），保持当前墓位
  const handleClickContactsAdd = () => {
    formContactsData.value = {
      idContacts: 0,
      idRoom: formRoomData.value.idRoom,
      contacts: '',
      contactsPhone: '',
      contactsIDCard: '',
    };
    contactsEditMode.value = 'add';
  };

  // 取消（联系人新增/修改视图）：退出并回到列表视图（含联系人列表）
  const onCancelContacts = () => {
    contactsEditMode.value = 'list';
  };

  // 联系人电话仅允许数字、最长 11 位：输入时过滤非数字字符并截断 20261017 新增 20261022 随逻辑迁入
  const onContactsPhoneChange = (value: string | number) => {
    formContactsData.value.contactsPhone = String(value ?? '')
      .replace(/\D/g, '')
      .slice(0, 11);
  };

  // 联系人形态新增/修改视图提交：校验联系人/电话必填与电话 11 位数字，保存 contacts 表记录
  // （新建/修改由 idContacts 是否为 0 区分），成功后停留本页刷新联系人列表 20260924 新增 20261022 自 submitCore 迁入
  const saveContacts = async () => {
    const { idRoom } = formBusinessData.value;
    const { idContacts, contacts, contactsPhone, contactsIDCard } = formContactsData.value;
    if (contacts === undefined || contacts.trim() === '') {
      return MessagePlugin.warning(translate('pages.gravePlotBusiness.contactsRequiredPlaceholder'));
    }
    // 联系人电话调整为必填（联系人形态新增/修改）：空值拦截，占位与提示同键 20261005 新增
    if (contactsPhone === undefined || contactsPhone.trim() === '') {
      return MessagePlugin.warning(translate('pages.gravePlotBusiness.contactsPhoneRequiredPlaceholder'));
    }
    // 联系人电话必须为 11 位数字（空值已在上方拦截），不足 11 位提交时提示 20261017 新增
    if (!/^\d{11}$/.test(contactsPhone.trim())) {
      return MessagePlugin.warning(translate('pages.gravePlotBusiness.contactsPhoneLengthPlaceholder'));
    }
    const contactsPayload = {
      idRoom,
      type: 'contacts' as const,
      contacts: contacts.trim(),
      contactsPhone: contactsPhone.trim(),
      contactsIDCard: contactsIDCard.trim(),
    };
    try {
      if (idContacts === 0) {
        await insertGravePlotBusiness(contactsPayload);
        MessagePlugin.success(translate('operate.createdSuccessPrompt'));
      } else {
        await updateGravePlotBusiness({ ...contactsPayload, idContacts });
        MessagePlugin.success(translate('operate.modifySuccessPrompt'));
      }
      await refreshContactsStay();
    } catch (e) {
      logError(e);
      MessagePlugin.error(
        idContacts === 0 ? translate('operate.createdFailedPrompt') : translate('operate.modifyFailedPrompt'),
      );
    }
  };

  return {
    formContactsData,
    contactsRecords,
    loadContactsRecords,
    refreshContactsStay,
    onModifyContactsRecord,
    handleClickContactsAdd,
    onCancelContacts,
    onContactsPhoneChange,
    saveContacts,
  };
};

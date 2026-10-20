// ============================================================
// 安葬证设置（数据表 burial_cert）视图逻辑：自 index.vue 拆出，页面只保留模板与表单容器 20261019 拆分
// 交互参照墓位销售方式（新建/修改由 idBusiness=idCert 是否为 0 区分），只读写 burial_cert 本表不联动其它业务表 20260927 新增
// ============================================================
import { MessagePlugin } from 'tdesign-vue-next';
import type { InjectionKey, Ref } from 'vue';
import { ref } from 'vue';

import type {
  GravePlotBusinessCertModel,
  GravePlotBusinessFormType,
  ListGravePlotBusinessCertResult,
} from '@/api/gravePlotBusiness';
import { getGravePlotBusinessByRoom, insertGravePlotBusiness, updateGravePlotBusiness } from '@/api/gravePlotBusiness';
import { translate } from '@/locales';
import { logError } from '@/utils/logger';

import type { INITIAL_ROOM_DATA } from './constants';
import { INITIAL_CERT_DATA } from './constants';

// 下葬形态内的子视图态：列表 / 新增 / 修改 / 安葬证设置 20260923 新增 20261019 类型随逻辑一并抽出
export type BuriedEditMode = 'list' | 'add' | 'modify' | 'certificate';

// 安葬证设置表单数据（burial_cert 表字段）：idBusiness 承载主键 idCert，0 为新建 20260927 新增
export type CertFormData = typeof INITIAL_CERT_DATA;

// 安葬证设置表单数据注入键：供拆出的证书表单子视图（CertificateFormView）经 inject 共享页面 formCertData，
// 保持页面持有状态的单向数据流（子视图仅渲染/编辑，提交/返回仍留页面与 useCertificateForm）20261020 P2 S2 拆分
export const certificateFormDataKey: InjectionKey<Ref<CertFormData>> = Symbol('gravePlotBusinessFormCertData');

// 提交数据排除创建/修改日期（后端审计自动写入），type=certificate 后端据此落 burial_cert 表；
// 等分转为 smallint 数值（未选中转 null）20260927 新增 20260928 修改
type CertSubmitData = Omit<CertFormData, 'equalDivision'> & {
  equalDivision: number | null;
  type?: GravePlotBusinessFormType;
};

type RoomFormData = typeof INITIAL_ROOM_DATA;

/**
 * 安葬证设置表单：进入视图（按墓位查记录回填 + 关联业务默认值）、提交后停留刷新、保存记录。
 * 依赖当前墓位表单数据与下葬子视图态，由页面注入以保持单向数据流。
 */
export const useCertificateForm = (deps: {
  // 当前墓位信息：证件编号/持证人两个只读字段始终跟当前墓位值，不随记录回填
  formRoomData: Ref<RoomFormData>;
  // 下葬形态子视图态：进入安葬证设置视图时置为 'certificate'
  buriedEditMode: Ref<BuriedEditMode>;
}) => {
  const { formRoomData, buriedEditMode } = deps;

  // 安葬证设置表单数据（独立于业务登记表单）
  const formCertData = ref<CertFormData>({ ...INITIAL_CERT_DATA });

  // 用安葬证设置记录回填表单（查询返回记录，含主键 idBusiness=idCert）
  const fillCertFormRecord = (record: GravePlotBusinessCertModel, idRoom: number) => {
    // 等分回填：库中 smallint 可空，空值回落默认一分（单选框默认选中一分，空串已不会出现）20260928 修改
    const equalDivision =
      record.equalDivision === null || record.equalDivision === undefined ? '1' : String(record.equalDivision);
    formCertData.value = {
      idBusiness: record.idBusiness,
      idRoom,
      serialNo: record.serialNo ?? '',
      certHolder: record.certHolder ?? '',
      certHolderPhone: record.certHolderPhone ?? '',
      deceasedRelation: record.deceasedRelation ?? '',
      burialDate: record.burialDate ?? '',
      jointBurialDate: record.jointBurialDate ?? '',
      deceasedA: record.deceasedA ?? '',
      deceasedB: record.deceasedB ?? '',
      equalDivision,
      deceasedC: record.deceasedC ?? '',
      deceasedD: record.deceasedD ?? '',
      workplace: record.workplace ?? '',
      workPhone: record.workPhone ?? '',
      homeAddress: record.homeAddress ?? '',
    };
  };

  // 只读字段同步墓位信息：编号取 room.serialNo（原 cardno）、持证人取 room.buyer，两个输入框只读不可改，
  // 有记录回填后也覆盖为当前墓位值（墓位购墓人/编号变更时安葬证设置跟随最新值）20260928 新增 20261003 cardno→serialNo
  const syncCertReadonlyFromRoom = () => {
    formCertData.value.serialNo = String(formRoomData.value.serialNo ?? '').trim();
    formCertData.value.certHolder = String(formRoomData.value.buyer ?? '').trim();
  };

  // 安葬证设置默认值从关联业务表带出（仅空字段预填，已保存记录的值优先）：
  // 持证人电话取 sale 表付款人电话（idRoom 条件）；逝者关系/下葬日期/安葬者A取销售开单联动的
  // 下葬记录（buried.idSale 与销售单匹配，倒序取最新）；查询失败不阻断进入表单 20260928 新增
  const syncCertDefaultsFromRelated = async () => {
    const idRoom = formRoomData.value.idRoom;
    try {
      const saleRes = await getGravePlotBusinessByRoom(idRoom, 'sale');
      const sale = saleRes.list?.[0];
      if (sale && (formCertData.value.certHolderPhone ?? '').trim() === '') {
        formCertData.value.certHolderPhone = String(sale.payerPhone ?? '').trim();
      }
      const buriedRes = await getGravePlotBusinessByRoom(idRoom, 'buried');
      // 销售联动的下葬记录：优先与当前销售单 idSale 匹配，无销售单时取任一 idSale 有值的最新记录
      const linked =
        (buriedRes.list ?? []).find((item) => sale && item.idSale === sale.idBusiness) ??
        (buriedRes.list ?? []).find((item) => item.idSale != null);
      if (linked) {
        if ((formCertData.value.deceasedRelation ?? '').trim() === '') {
          formCertData.value.deceasedRelation = String(linked.deceasedRelation ?? '').trim();
        }
        if (!formCertData.value.burialDate) {
          formCertData.value.burialDate = linked.burialDate ?? '';
        }
        if ((formCertData.value.deceasedA ?? '').trim() === '') {
          formCertData.value.deceasedA = String(linked.deceased ?? '').trim();
        }
      }
    } catch (e) {
      logError(e);
    }
  };

  // 按当前墓位重查 burial_cert 活动记录（倒序取最新一条）回填，无记录则空表单新建，
  // 并覆盖只读字段：进入视图与提交后停留本视图复用同一段流程 20260927 新增 20261019 两处重复合并
  const loadCertRecord = async () => {
    const idRoom = formRoomData.value.idRoom;
    formCertData.value = { ...INITIAL_CERT_DATA, idRoom };
    try {
      const { list } = await getGravePlotBusinessByRoom<ListGravePlotBusinessCertResult>(idRoom, 'certificate');
      if (list && list.length > 0) {
        fillCertFormRecord(list[0], idRoom);
      }
    } catch (e) {
      logError(e);
    }
    syncCertReadonlyFromRoom();
  };

  // 表头“证件”：进入安葬证设置视图——记录回填 + 关联业务默认值带出，
  // 表单字段/提交/取消/返回交互同下葬新增/修改视图（参照墓位销售方式），仅读写 burial_cert 本表不联动 20260927 修改
  const openCertificateView = async () => {
    await loadCertRecord();
    await syncCertDefaultsFromRelated();
    buriedEditMode.value = 'certificate';
  };

  // 安葬证设置提交成功后：重查记录回填并停留本视图（连续调整无需重新进入）；点“返回”才回下葬列表视图 20260927 新增
  const refreshCertStay = async () => {
    await loadCertRecord();
  };

  // 保存安葬证设置记录（burial_cert 表：持证人必填，新建/修改由 idBusiness(=idCert) 是否为 0 区分），
  // 成功后停留本视图刷新回填 20260927 新增 20261019 自页面提交主流程迁入
  const saveCertificate = async () => {
    const { idBusiness, certHolder, certHolderPhone } = formCertData.value;
    if (certHolder === undefined || certHolder.trim() === '') {
      MessagePlugin.warning(translate('pages.gravePlotBusiness.certHolderPlaceholder'));
      return;
    }
    // 等分落 burial_cert.equalDivision（smallint）：选中值转数值（默认一分，异常空串兜底转 null）20260928 修改
    const equalDivisionRaw = formCertData.value.equalDivision;
    const certPayload: CertSubmitData = {
      ...formCertData.value,
      equalDivision: equalDivisionRaw === '' ? null : Number(equalDivisionRaw),
      certHolder: certHolder.trim(),
      certHolderPhone: certHolderPhone.trim(),
      type: 'certificate',
    };
    try {
      if (idBusiness === 0) {
        await insertGravePlotBusiness(certPayload);
        MessagePlugin.success(translate('operate.createdSuccessPrompt'));
      } else {
        await updateGravePlotBusiness(certPayload);
        MessagePlugin.success(translate('operate.modifySuccessPrompt'));
      }
      await refreshCertStay();
    } catch (e) {
      logError(e);
      MessagePlugin.error(
        idBusiness === 0 ? translate('operate.createdFailedPrompt') : translate('operate.modifyFailedPrompt'),
      );
    }
  };

  return { formCertData, openCertificateView, refreshCertStay, saveCertificate };
};

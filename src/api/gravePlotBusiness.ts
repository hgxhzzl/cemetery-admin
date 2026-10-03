import { request } from '@/utils/request';

import type { RoomModel } from './model/roomModel';

const Api = {
  queryGravePlotBusiness: '/gravePlotBusiness-query',
  queryGravePlotBusinessContacts: '/gravePlotBusiness-query/contacts-list',
  deleteGravePlotBusiness: '/gravePlotBusiness-delete',
  insertGravePlotBusiness: '/gravePlotBusiness-save/insert',
  updateGravePlotBusiness: '/gravePlotBusiness-save/update',
};

// 墓位业务页墓位行：room 表字段 + 预定人（活动预定记录 liaison 联查，无预定为空）20260923 新增
export interface GravePlotBusinessRoomRow extends RoomModel {
  reserver: string;
}

export interface ListGravePlotBusinessRoomResult {
  list: GravePlotBusinessRoomRow[];
}

// 查询墓位列表(带预定人)：本页独立接口，不复用 room/canSale 20260923 新增
export function getGravePlotBusinessRoomList(park: string, region: string) {
  return request.get<ListGravePlotBusinessRoomResult>({
    url: `${Api.queryGravePlotBusiness}/room-list?park=${park}&region=${region}`,
  });
}

// 墓位业务记录数据模型（数据表 graveplotbusiness，与墓位销售完全独立）20260923 新增
export interface GravePlotBusinessModel {
  idBusiness: number;
  idRoom: number;
  // 下葬形态记录主键（SELECT * 返回 buried 表原字段，记录选择表格 row-key 用）20260923 新增
  idBuried?: number;
  // 关联销售单主键：有值表示该下葬记录由销售开单联动生成，下葬页不可修改/删除 20260925 新增
  idSale?: number;
  operator: string;
  realPrice: number;
  payer: string;
  payerPhone: string;
  remark: string;
  payerIDCard: string;
  payee: string;
  serialNo: string;
  // 安葬者三字段：销售形态随开单同步 buried 表；下葬形态直接读写 buried 表（联查回填）20260923 新增/修改
  deceased?: string;
  burialDate?: string;
  deceasedIDCard?: string;
  // 逝者关系：仅销售形态录入，保存到 buried.deceasedRelation 20260924 新增
  deceasedRelation?: string;
  // 下葬形态联系人三字段（buried 表列名，contactsphone 全小写）20260923 新增
  contacts?: string;
  contactsphone?: string;
  contactsIDCard?: string;
  // 联系人形态：contacts 表主键与电话列（contactsPhone 大写 P，区别于 buried 表 contactsphone）20260924 新增
  idContacts?: number;
  contactsPhone?: string;
  isDeleted: number;
  modifyDate: string;
  createDate: string;
}

export interface ListGravePlotBusinessResult {
  list: GravePlotBusinessModel[];
}

// 安葬证设置记录数据模型（数据表 burial_cert：编号/持证人/电话/逝者关系/下葬与合葬日期/安葬者A-D/工作单位/单位电话/住址）20260927 新增
export interface GravePlotBusinessCertModel {
  // 主键 idCert，查询时别名 idBusiness 供前端判定新建/修改
  idBusiness: number;
  idRoom: number;
  // 安葬证编号（varchar6，同销售页编号字段）
  serialNo: string;
  // 持证人/持证人电话
  certHolder: string;
  certHolderPhone: string;
  // 逝者关系
  deceasedRelation: string;
  // 下葬日期/合葬日期
  burialDate: string;
  jointBurialDate: string;
  // 安葬者A-D（burial_cert 表多安葬者列）
  deceasedA: string;
  deceasedB: string;
  deceasedC: string;
  deceasedD: string;
  // 等分（安葬者B分位单选：1一分/2二分/3三分，smallint 可空）20260928 新增
  equalDivision: number | null;
  // 工作单位/单位电话/住址
  workplace: string;
  workPhone: string;
  homeAddress: string;
  isDeleted: number;
  operator: string;
  modifyDate: string;
  createDate: string;
}

export interface ListGravePlotBusinessCertResult {
  list: GravePlotBusinessCertModel[];
}

// 新增接口（type 标识形态，后端据此选表：contacts 形态落 contacts 表、certificate 形态落 burial_cert 表）20260923 新增 20260924 修改 20260927 修改
export function insertGravePlotBusiness(
  data: Partial<GravePlotBusinessModel & GravePlotBusinessCertModel> & { type?: GravePlotBusinessFormType },
) {
  return request.post({
    url: Api.insertGravePlotBusiness,
    data,
  });
}

// 修改墓位业务接口（type=contacts 按 idContacts 更新 contacts 表记录；type=certificate 按 idCert 更新 burial_cert 表记录）20260923 新增 20260924 修改 20260927 修改
export function updateGravePlotBusiness(
  data: Partial<GravePlotBusinessModel & GravePlotBusinessCertModel> & { type?: GravePlotBusinessFormType },
) {
  return request.post({
    url: Api.updateGravePlotBusiness,
    data,
  });
}

// 业务形态：代码独立但数据表复用原有表——sale 落 sale 表、reserve 落 reserve 表、buried 落 buried 表、contacts 落 contacts 表、certificate 落 burial_cert 表（安葬证设置）、remark 直接更新 room.remark（墓位备注）、默认 graveplotbusiness 表 20260923 修改 20260924 修改 20260927 修改 20261002 修改
export type GravePlotBusinessFormType = 'sale' | 'reserve' | 'buried' | 'contacts' | 'certificate' | 'remark';

// 按墓位查询当前活动业务记录，用于修改回填（type 决定查哪张数据表，主键统一别名 idBusiness；certificate 查 burial_cert 表）
// 泛型 T 默认业务记录列表，certificate 形态由调用方显式指定 Cert 列表，避免联合类型回填不匹配 20260923 新增 20260927 修改
export function getGravePlotBusinessByRoom<
  T extends ListGravePlotBusinessResult | ListGravePlotBusinessCertResult = ListGravePlotBusinessResult,
>(idRoom: number, type?: GravePlotBusinessFormType) {
  const query = `idRoom=${idRoom}${type ? `&type=${type}` : ''}`;
  return request.get<T>({
    url: `${Api.queryGravePlotBusiness}/get-by-room?${query}`,
  });
}

// 下葬形态联系人选择页数据模型（contacts 表字段，代码独立不复用 contacts 模块接口）20260923 新增
export interface GravePlotBusinessContactsModel {
  idContacts: number;
  idRoom: number;
  contacts: string;
  // 联系人电话，contacts 表列名 contactsPhone
  contactsPhone: string;
  contactsIDCard: string;
}

export interface ListGravePlotBusinessContactsResult {
  list: GravePlotBusinessContactsModel[];
}

// 按墓位查询全部活动联系人记录（下葬形态联系人“选择”按钮用，倒序最新在前）20260923 新增
export function getGravePlotBusinessContacts(idRoom: number) {
  return request.get<ListGravePlotBusinessContactsResult>({
    url: `${Api.queryGravePlotBusinessContacts}?idRoom=${idRoom}`,
  });
}

// 删除墓位业务接口：业务形态按 idRoom 软删本业务表记录；下葬形态(type=buried)按 idBuried 删单条下葬记录；
// 联系人形态(type=contacts)按 idContacts 删单条联系人记录 20260923 修改 20260924 修改
export function deleteGravePlotBusiness(params: {
  idRoom: number;
  type?: 'buried' | 'contacts';
  idBuried?: number;
  idContacts?: number;
}) {
  const query = `idRoom=${params.idRoom}${params.type ? `&type=${params.type}` : ''}${params.idBuried !== undefined ? `&idBuried=${params.idBuried}` : ''}${params.idContacts !== undefined ? `&idContacts=${params.idContacts}` : ''}`;
  return request.get<ListGravePlotBusinessResult>({
    url: `${Api.deleteGravePlotBusiness}?${query}`,
  });
}

// RoomCardList 通用卡片列表组件的配置类型（墓位业务族：buried/reserve/contacts 复用）20261020 P2 #6
import type { RoomModel } from '@/api/model/roomModel';

// 卡片信息行取值方式：text 原样、truncate 超7字截断+tooltip、price 千分位、date 日期格式化、
// i18n 取值为语言包键（如 roomType，渲染 $t(值)，供墓区设置页正文复展示墓型文案 20261020 P2 S1b）
export type RoomCardFormat = 'text' | 'truncate' | 'price' | 'date' | 'i18n';

// 卡片信息行描述：label 走 i18n 键，field 取 row 上的字段名（收紧为 keyof RoomModel，拼错编译期即报错 20261020 P2 C3），
// format 决定取値/展示口径；labelAction/labelDisabled 供墓位业务页将标题渲染为可点击链接（业务登记入口）20261020 P2 S2
export interface RoomCardMetaField {
  labelKey: string;
  field: keyof RoomModel;
  format?: RoomCardFormat;
  // 标题渲染为 t-link 并上抛 action(labelAction, row)（缺省为普通文本标题）
  labelAction?: string;
  // 标题链接禁用条件（如未销售置灰不可点），仅 labelAction 存在时生效
  labelDisabled?: (row: RoomModel) => boolean;
}

// 卡片操作行链接描述：name 为事件标识（父页据此分发），labelKey 文案键，theme 同 t-link，
// visible 为该操作对当前墓位的显示条件（缺省恒显示）
export interface RoomCardAction {
  name: string;
  labelKey: string;
  theme?: 'primary' | 'danger' | 'warning' | 'success' | 'default';
  visible?: (row: RoomModel) => boolean;
}

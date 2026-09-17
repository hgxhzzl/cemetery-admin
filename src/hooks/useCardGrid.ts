import type { Ref } from 'vue';
import { computed, ref } from 'vue';

import { translate } from '@/locales';

// 字符串/数字转数字，非数字归 0（排号/列号比较用）
const toNumber = (value: number | string) => {
  const parsed = Number(value);
  return Number.isNaN(parsed) ? 0 : parsed;
};

// 卡片行条目仅依赖排号/列号，各页行数据类型（RoomModel/BuriedRoomRow 等）按泛型传入
interface CardRowItem {
  yNum: number | string;
  xNum: number | string;
}

// 占位卡与非占位卡的判别联合：模板 v-if="card.placeholder"/v-else 下 vue-tsc 可收窄 row 非空
// （占位卡 row 为 null，非占位卡 row 为行数据）
type CardCellOf<T extends CardRowItem> =
  { xNum: number; placeholder: false; row: T } | { xNum: number; placeholder: true; row: null };

// 卡片行回调参数：模板直接传行数据；历史回调存在包一层 { row } 的写法，兼容两种形态 20260917 类型化
export type CardRowArg<T> = T & { row?: T };

/**
 * 墓位卡片网格 hook：6 个卡片列表页（room/sale/buried/reserve/adminfee/contacts）统一使用。
 * 各页原逐字重复的缩放控制、按排分组补位、记录数文案逻辑收敛于此。
 * 20260914 从 6 页抽取
 */
export const useCardGrid = <T extends CardRowItem>(list: Ref<T[]>) => {
  // 卡片列表缩放比例，放大/缩小图标每次增减10%，限制在0.5～2倍之间
  const zoom = ref(1);
  const handleZoomIn = () => {
    zoom.value = Math.min(2, Math.round((zoom.value + 0.1) * 10) / 10);
  };
  const handleZoomOut = () => {
    zoom.value = Math.max(0.5, Math.round((zoom.value - 0.1) * 10) / 10);
  };

  // 按排号分组、按列号补齐占位卡，形成二维卡片布局
  const cardRows = computed(() => {
    const groupedRows = new Map<number, T[]>();

    list.value.forEach((item) => {
      const yNum = toNumber(item.yNum);
      const rows = groupedRows.get(yNum) ?? [];
      rows.push(item);
      groupedRows.set(yNum, rows);
    });

    const globalMaxXNum = list.value.reduce((max, item) => {
      return Math.max(max, toNumber(item.xNum));
    }, 0);

    return Array.from(groupedRows.entries())
      .sort(([left], [right]) => left - right)
      .map(([yNum, rows]) => {
        const rowMap = new Map<number, T>();

        rows
          .slice()
          .sort((left, right) => toNumber(left.xNum) - toNumber(right.xNum))
          .forEach((item) => {
            rowMap.set(toNumber(item.xNum), item);
          });

        // placeholder 与 row 构成判别联合：模板 v-if="card.placeholder"/v-else 下 vue-tsc 可收窄 row 非空
        const cards: CardCellOf<T>[] = [];
        for (let xNum = 1; xNum <= globalMaxXNum; xNum += 1) {
          const row = rowMap.get(xNum);
          cards.push(row ? { xNum, placeholder: false, row } : { xNum, placeholder: true, row: null });
        }

        return {
          yNum,
          cards,
        };
      });
  });

  // 记录数文案随筛选结果实时更新
  const totalText = computed(() => `${translate('operate.total')}${list.value.length}${translate('operate.records')}`);

  return {
    zoom,
    handleZoomIn,
    handleZoomOut,
    cardRows,
    totalText,
  };
};

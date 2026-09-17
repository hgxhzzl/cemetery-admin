import type { Ref } from 'vue';
import { computed, ref } from 'vue';

import type { ListParkModel, SelectModel } from '@/api/model/parkModel';
import { getParkList, getRegionList } from '@/api/park';
import { logError } from '@/utils/logger';

/** 卡片页筛选表单最小字段集：hook 只读写 region/park/yNum，各页表单可携带更多业务字段 */
export interface ParkFilterForm {
  region: string;
  park: string;
  yNum: string;
}

/** 卡片页墓位行最小约束：区域/园区/排号用于查询后前端二次过滤 */
export interface ParkRoomRow {
  region: string;
  park: string;
  yNum: string;
}

/**
 * 卡片页筛选 hook：墓区 6 个卡片页（墓区设置/销售/下葬/预定/管理费/联系）原逐字重复的
 * 区域/园区下拉加载、园区随区域联动过滤、排号去重生成、查询后前端二次过滤收敛于此，
 * 各页仅需传入本业务可查询墓位的接口（getRoomList / getCanSaleList）。
 * 20260914 从 6 页抽取
 */
export const useParkRoomFilter = <T extends ParkRoomRow>(
  formfindData: Ref<ParkFilterForm>,
  fetchRooms: (park: string, region: string) => Promise<{ list: T[] }>,
) => {
  // 区域/园区下拉数据，挂载时各拉取一次
  const dataRegionList = ref<SelectModel[]>([]);
  const dataParkList = ref<ListParkModel[]>([]);
  // 查询返回的全量数据与筛选后的展示数据
  const dataRoomList = ref<T[]>([]);
  const searchRoomList = ref<T[]>([]);
  // 是否已执行过查询，初始未查询时不展示列表区及暂无数据提示
  const hasQueried = ref(false);

  const getSelectedRegionLabel = (regionValue: string | number) => {
    const selectedRegion = dataRegionList.value.find((item) => item.value === regionValue);
    return selectedRegion?.label ?? regionValue;
  };

  // 园区下拉随所选区域联动过滤
  const availableParkList = computed(() => {
    const { region } = formfindData.value;
    if (!region) {
      return dataParkList.value;
    }
    const regionLabel = getSelectedRegionLabel(region);
    return dataParkList.value.filter((item) => item.region === regionLabel || item.region === region);
  });

  const getDefaultFilterPark = () => availableParkList.value[0]?.value ?? '';

  const applyDefaultFilterPark = () => {
    if (!formfindData.value.park) {
      formfindData.value.park = getDefaultFilterPark();
    }
  };

  // 排号下拉由当前查询结果去重生成
  const yNumList = computed(() => {
    const seen = new Set<string>();
    return dataRoomList.value
      .filter((item) => {
        if (seen.has(item.yNum)) {
          return false;
        }
        seen.add(item.yNum);
        return true;
      })
      .map((item) => ({ value: item.yNum, label: `${item.yNum} 排` }));
  });

  const getRegionData = async () => {
    try {
      const { list } = await getRegionList();
      dataRegionList.value = list;
    } catch (e) {
      logError(e);
    }
  };

  const getParkData = async () => {
    try {
      const { list } = await getParkList();
      dataParkList.value = list;
      applyDefaultFilterPark();
    } catch (e) {
      logError(e);
    }
  };

  // 下拉变化时按区域/园区/排号在前端二次过滤，无需重新请求
  const onSelectChange = () => {
    if (dataRoomList.value.length > 0) {
      searchRoomList.value = dataRoomList.value;
      const { region, yNum, park } = formfindData.value;
      if (region !== '' && region !== undefined) {
        const regionLabel = getSelectedRegionLabel(region);
        searchRoomList.value = searchRoomList.value.filter(
          (item) => item.region === regionLabel || item.region === region,
        );
      }
      if (yNum !== '' && yNum !== undefined) {
        searchRoomList.value = searchRoomList.value.filter((item) => item.yNum === yNum);
      }
      if (park !== '' && park !== undefined) {
        searchRoomList.value = searchRoomList.value.filter((item) => item.park === park);
      }
    }
  };

  // 按园区+区域请求墓位列表，加载完成后才置 hasQueried，避免先闪现“暂无数据”再切换为卡片
  const getRoomData = async () => {
    try {
      const { list } = await fetchRooms(formfindData.value.park || '', formfindData.value.region || '');
      dataRoomList.value = list;
      hasQueried.value = true;
      onSelectChange();
    } catch (e) {
      logError(e);
    }
  };

  const onSubmit = () => {
    getRoomData();
  };

  return {
    dataRegionList,
    dataParkList,
    dataRoomList,
    searchRoomList,
    hasQueried,
    getSelectedRegionLabel,
    availableParkList,
    getDefaultFilterPark,
    applyDefaultFilterPark,
    yNumList,
    getRegionData,
    getParkData,
    onSelectChange,
    getRoomData,
    onSubmit,
  };
};

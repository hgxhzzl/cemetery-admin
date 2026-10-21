import { MessagePlugin } from 'tdesign-vue-next';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getAdminfeeList } from '@/api/adminfee';
import { getBuriedList } from '@/api/buried';
import { getContactsList } from '@/api/contacts';
import { getReserveByRoom } from '@/api/reserve';
import { getIdList } from '@/api/room';
import { getSaleByRoom } from '@/api/sale';
import { getTransferOutListByIdRoom } from '@/api/transferOut';
import { useRoomDetail } from '@/hooks/useRoomDetail';

// 详情 7 路取数按模块逐个 mock，切断 api → request/store/router 的模块链，使 hook 可在 node 环境直接导入
vi.mock('@/api/room', () => ({ getIdList: vi.fn() }));
vi.mock('@/api/reserve', () => ({ getReserveByRoom: vi.fn() }));
vi.mock('@/api/sale', () => ({ getSaleByRoom: vi.fn() }));
vi.mock('@/api/buried', () => ({ getBuriedList: vi.fn() }));
vi.mock('@/api/adminfee', () => ({ getAdminfeeList: vi.fn() }));
vi.mock('@/api/contacts', () => ({ getContactsList: vi.fn() }));
vi.mock('@/api/transferOut', () => ({ getTransferOutListByIdRoom: vi.fn() }));
vi.mock('@/utils/logger', () => ({ logError: vi.fn() }));
vi.mock('tdesign-vue-next', () => ({ MessagePlugin: { warning: vi.fn(), error: vi.fn() } }));

// 各路的正常返回行（只给 hook 会用到的最小字段）
const okRows = () => {
  vi.mocked(getIdList).mockResolvedValue({ list: [{ idRoom: 1, roomNo: 'A-01' }] } as never);
  vi.mocked(getReserveByRoom).mockResolvedValue({ list: [{ idReserve: 5 }] } as never);
  vi.mocked(getSaleByRoom).mockResolvedValue({ list: [{ idSale: 7 }] } as never);
  vi.mocked(getBuriedList).mockResolvedValue({ list: [{ idBuried: 3 }] } as never);
  vi.mocked(getAdminfeeList).mockResolvedValue({ list: [{ idAdminfee: 2 }] } as never);
  vi.mocked(getContactsList).mockResolvedValue({ list: [{ idContacts: 9 }] } as never);
  vi.mocked(getTransferOutListByIdRoom).mockResolvedValue({ list: [{ idTransfer: 4 }] } as never);
};

describe('useRoomDetail: 单路失败按卡片降级（审查修复 20261021 二轮 P1-3）', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    okRows();
  });

  it('7 路全部成功时不弹提示且各卡片数据齐备', async () => {
    const { loadDetail, detailRoom, detailTransferOut, detailContacts } = useRoomDetail();
    const failed = await loadDetail(1);

    expect(failed).toEqual([]);
    expect(detailRoom.value?.idRoom).toBe(1);
    expect(detailContacts.value).toHaveLength(1);
    expect(detailTransferOut.value).toBeTruthy();
    expect(vi.mocked(MessagePlugin.warning)).not.toHaveBeenCalled();
  });

  it('迁出这一路 403 时详情仍能打开，只提示缺了迁出记录', async () => {
    // 后端详情放行收窄前，只开通部分墓位菜单的操作员会在这一路拿到 403，
    // 旧写法 Promise.all 一遇失败即整体放弃，表现为“点详情没反应”
    vi.mocked(getTransferOutListByIdRoom).mockRejectedValue({ message: '无权限' });
    const { loadDetail, detailRoom, detailBuried, detailTransferOut } = useRoomDetail();
    const failed = await loadDetail(1);

    expect(failed).toEqual(['迁出记录']);
    expect(detailRoom.value?.idRoom).toBe(1);
    expect(detailBuried.value).toHaveLength(1);
    expect(detailTransferOut.value).toBeNull();
    expect(MessagePlugin.warning).toHaveBeenCalledWith(expect.stringContaining('迁出记录'));
  });

  it('墓位主记录失败不降级（否则只会打开一个空白详情），原样抛出交页面提示', async () => {
    vi.mocked(getIdList).mockRejectedValue(new Error('network down'));
    const { loadDetail } = useRoomDetail();

    await expect(loadDetail(1)).rejects.toThrow('network down');
    expect(MessagePlugin.warning).not.toHaveBeenCalled();
  });

  it('多路同时失败时提示串列出全部缺失卡片', async () => {
    vi.mocked(getContactsList).mockRejectedValue({ message: 'boom' });
    vi.mocked(getAdminfeeList).mockRejectedValue({ message: 'boom' });
    const { loadDetail } = useRoomDetail();
    const failed = await loadDetail(1);

    expect(failed).toEqual(['管理费记录', '联系人记录']);
    expect(MessagePlugin.warning).toHaveBeenCalledWith(expect.stringContaining('管理费记录、联系人记录'));
  });
});

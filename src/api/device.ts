import type { DeviceFingerprint } from '@/utils/device';
import { request } from '@/utils/request';

const Api = {
  bindDevice: '/device/bind',
  deviceList: '/device/list',
  disableDevice: '/device/disable',
};

// 设备白名单登记(后端仅平台管理员 isAccount=1 可操作):把当前电脑哈希写入白名单
export function bindDevice(data: DeviceFingerprint) {
  return request.post<{ code: number; message: string }>({
    url: Api.bindDevice,
    data,
  });
}

// 设备白名单列表:管理员运维查看
export function getDeviceList() {
  return request.post({
    url: Api.deviceList,
  });
}

// 设备停用:旧电脑淘汰时下线
export function disableDevice(deviceHash: string) {
  return request.post({
    url: Api.disableDevice,
    data: { deviceHash },
  });
}

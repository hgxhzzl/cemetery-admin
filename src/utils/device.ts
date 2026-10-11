// 设备指纹获取:登录页从本机设备 Agent(127.0.0.1:19700)读取设备哈希 20260924 新增,
// Agent 未安装/未运行时返回 null,登录请求不带 deviceHash 由后端拒绝(仅管理员豁免),
export interface DeviceFingerprint {
  deviceHash: string;
  deviceName: string;
}

// Agent 只监听本机回环地址;超时 3 秒:Agent 启动时会预热指纹,正常应答在几十毫秒内,
// 留 3 秒只为了兼容开机初期进程调度繁忙 / 杀软首次扫描 PowerShell 的慢路径,同时不至于长时间挂住登录提交 20261010 修改,
export async function getDeviceInfo(): Promise<DeviceFingerprint | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3000);
    const resp = await fetch('http://127.0.0.1:19700/device-info', { signal: controller.signal });
    clearTimeout(timer);
    if (!resp.ok) return null;
    const data = (await resp.json()) as DeviceFingerprint;
    return /^[0-9a-f]{64}$/.test(data.deviceHash) ? data : null;
  } catch {
    // Agent 未安装/未运行/超时,均视为本机无法提供设备指纹
    return null;
  }
}

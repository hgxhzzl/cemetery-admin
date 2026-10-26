// 设备指纹获取:登录页从本机设备 Agent(127.0.0.1:19700)读取设备哈希 20260924 新增,
// Agent 未安装/未运行时返回 null,登录请求不带 deviceHash 由后端拒绝(仅管理员豁免),
import { logError } from '@/utils/logger';

export interface DeviceFingerprint {
  deviceHash: string;
  deviceName: string;
}

// 从响应体读“设备服务不可用”的具体原因并盖章到控制台:页面只弹一句“未检测到本机设备服务”时,
// 无法区分“没装 Agent”“Agent 在跑但拒绝了当前页面来源(403)”“指纹格式不对”三种情形,
// 排障时先看控制台这行即可定位 20261026 新增,
// 最近一次失败的原因(只给排障提示用):现场无法开控制台时,把这行直接拼到弹窗里,
// 一眼区分「超时/连不上(Failed to fetch)」与「Agent 拒绝(HTTP 403)」两类完全不同的问题 20261026 新增,
let lastDeviceErrorText = '';

export function getLastDeviceErrorText(): string {
  return lastDeviceErrorText;
}

// Agent 只监听本机回环地址;超时 3 秒:Agent 启动时会预热指纹,正常应答在几十毫秒内,
// 留 3 秒只为了兼容开机初期进程调度繁忙 / 杀软首次扫描 PowerShell 的慢路径,同时不至于长时间挂住登录提交 20261010 修改,
export async function getDeviceInfo(): Promise<DeviceFingerprint | null> {
  lastDeviceErrorText = '';
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3000);
    const resp = await fetch('http://127.0.0.1:19700/device-info', { signal: controller.signal });
    clearTimeout(timer);
    if (!resp.ok) {
      // 403:Agent 在跑但当前页面来源(Origin)不在允许名单;404/其它:请求落到别的服务或 Agent 版本不匹配
      logError('[device] Agent 拒绝请求', resp.status, window.location.origin);
      lastDeviceErrorText = `Agent HTTP ${resp.status}`;
      return null;
    }
    const data = (await resp.json()) as DeviceFingerprint;
    if (!/^[0-9a-f]{64}$/.test(data.deviceHash)) {
      logError('[device] Agent 返回的 deviceHash 不合法', data);
      lastDeviceErrorText = 'Agent hash invalid';
      return null;
    }
    return data;
  } catch (e) {
    // Agent 未安装/未运行/超时,均视为本机无法提供设备指纹
    logError('[device] 无法连接本机 Agent(未安装/未运行/超时)', e);
    // AbortError 是前端 3 秒超时(Agent 收到但答慢了);其余多为 Fetch 层面被拦/未装,沿用错误名与消息
    lastDeviceErrorText = e instanceof Error ? `${e.name}: ${e.message}` : String(e);
    // HTTP 公网页面请求本机回环会被浏览器直接拦掉:本地网络访问权限只对安全上下文开放,
    // HTTP 页面连授权弹窗都弹不出来;现场看到这个前缀就能确定不是 Agent 没装,而是访问方式/浏览器策略问题,
    // 需改用 HTTPS,或由设备 Agent 安装包写入浏览器企业策略放行当前站点 20261026,
    if (!window.isSecureContext) {
      lastDeviceErrorText = `insecure-context, ${lastDeviceErrorText}`;
    }
    return null;
  }
}

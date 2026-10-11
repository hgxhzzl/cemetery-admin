// 设备指纹 Agent:登录页通过 http://127.0.0.1:19700/device-info 获取本机设备哈希 20260924 新增,
// deviceHash = SHA256(硬盘序列号|主板序列号|MachineGuid),物理序列号为主,防止软件层伪造设备身份,
// 安全:仅监听 127.0.0.1(外部网络不可达) + Origin 白名单(防其他网站探测),
const http = require('node:http');
const os = require('node:os');
const crypto = require('node:crypto');
const { exec } = require('node:child_process');

const PORT = 19700;
// 允许访问本服务的站点 Origin:开发 Vite(3002) 与生产域名,部署时按实际地址调整,
const ALLOWED_ORIGINS = [
  'http://localhost:3002',
  'http://127.0.0.1:3002',
  // 生产站点 Origin:腾讯云轻量服务器直 IP 访问 20260925 部署,
  'http://124.221.213.247',
];

// 执行命令并取输出:wmic 输出为 UTF-16LE,被 node 按 UTF-8 解码后会残留大量 NUL 字符;
// PowerShell/CIM 输出为普通文本。统一剥 NUL 与 BOM 即可兼容两者,
// 不再做 Buffer utf16le 二次转码(会把正常的 PowerShell 输出解成乱码) 20261010 修改,
function run(cmd) {
  return new Promise((resolve) => {
    exec(cmd, { windowsHide: true }, (err, stdout) => {
      if (err) return resolve('');
      // 去 NUL 采用 split/join 而非正则:ESLint no-control-regex 不允许正则字面量含控制字符
      const text = String(stdout || '')
        .split('\u0000')
        .join('')
        .replace(/^\uFEFF/, '');
      resolve(text);
    });
  });
}

// 从 CIM(PowerShell) 输出中提取序列号:无列名标题行,直接取第一条非空值;
// 多块硬盘时按 Win32_DiskDrive 返回顺序取第一块(顺序由 DeviceID 决定,同机稳定) 20261010 新增,
function pickCimSerial(output) {
  const lines = String(output)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  return lines[0] || '';
}

// 从 wmic 输出中提取序列号:跳过标题行,取第一条非空值(仅作老系统兜底)
function pickSerial(wmicOutput) {
  const lines = String(wmicOutput)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  // wmic 输出第一行是列名(如 SerialNumber),数据从第二行起
  if (lines.length >= 2) return lines[1];
  return '';
}

// 读取硬件序列号:优先 Get-CimInstance —— Windows 11 25H2 起 wmic 已从系统移除,继续依赖会拿到 NO-DISK/NO-BOARD;
// CIM 取不到时回退 wmic,兼容仍带 wmic 的老系统 20261010 修复,
async function readSerial(cimClass, wmicClass) {
  const psCmd = `powershell -NoProfile -NonInteractive -Command "(Get-CimInstance -ClassName ${cimClass}).SerialNumber"`;
  const fromCim = pickCimSerial(await run(psCmd));
  if (fromCim) return fromCim;
  return pickSerial(await run(`wmic ${wmicClass} get serialnumber`));
}

// 采集硬件指纹:硬盘序列号 + 主板序列号 + MachineGuid(任一缺失仍可计算,稳定性由三项组合保证)
async function collectFingerprint() {
  const disk = (await readSerial('Win32_DiskDrive', 'diskdrive')) || 'NO-DISK';
  const board = (await readSerial('Win32_BaseBoard', 'baseboard')) || 'NO-BOARD';
  const guidRaw = await run('reg query HKLM\\SOFTWARE\\Microsoft\\Cryptography /v MachineGuid');
  const guidMatch = String(guidRaw).match(/MachineGuid\s+REG_SZ\s+(\S+)/i);
  const guid = (guidMatch && guidMatch[1]) || 'NO-GUID';
  const deviceHash = crypto.createHash('sha256').update([disk, board, guid].join('|')).digest('hex');
  return { deviceHash, deviceName: os.hostname() };
}

// 缓存指纹:硬件信息不变,首次采集后常驻内存,避免每次登录都跑 wmic
let cachedFingerprint = null;

async function getFingerprint() {
  if (!cachedFingerprint) cachedFingerprint = await collectFingerprint();
  return cachedFingerprint;
}

const server = http.createServer(async (req, res) => {
  const origin = req.headers.origin || '';
  const corsHeader = ALLOWED_ORIGINS.includes(origin) ? origin : '';
  // CORS 预检
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': corsHeader || ALLOWED_ORIGINS[0],
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    return res.end();
  }
  if (req.url !== '/device-info' || req.method !== 'GET') {
    res.writeHead(404);
    return res.end();
  }
  // Origin 白名单:非授权站点一律 403,不暴露设备信息
  if (!ALLOWED_ORIGINS.includes(origin)) {
    res.writeHead(403);
    return res.end();
  }
  try {
    const fingerprint = await getFingerprint();
    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': origin,
    });
    res.end(JSON.stringify(fingerprint));
  } catch (err) {
    console.error('[device-agent] fingerprint error:', err.message);
    res.writeHead(500, { 'Access-Control-Allow-Origin': origin });
    res.end(JSON.stringify({ error: 'fingerprint error' }));
  }
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`[device-agent] listening on http://127.0.0.1:${PORT}`);
  // 启动即预热指纹:首次采集要起两次 PowerShell 调 CIM,冷启动可达秒级;
  // 而登录页请求超时只有 2 秒,开机后第一个用户登录很容易撞上超时被误判为"未安装 Agent";
  // 提前算好写入缓存,让首个请求直接命中 20261010 修复,
  getFingerprint().catch(() => {});
});

// 端口被占(已有实例在跑)时直接退出,避免报错弹窗
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.log('[device-agent] already running, exit');
    process.exit(0);
  }
  throw err;
});

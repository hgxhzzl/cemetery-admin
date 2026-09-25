// 设备指纹 Agent:登录页通过 http://127.0.0.1:19700/device-info 获取本机设备哈希 20260924 新增,
// deviceHash = SHA256(硬盘序列号|主板序列号|MachineGuid),物理序列号为主,防止软件层伪造设备身份,
// 安全:仅监听 127.0.0.1(外部网络不可达) + Origin 白名单(防其他网站探测),
const http = require('node:http');
const os = require('node:os');
const crypto = require('node:crypto');
const { Buffer } = require('node:buffer');
const { exec } = require('node:child_process');

const PORT = 19700;
// 允许访问本服务的站点 Origin:开发 Vite(3002) 与生产域名,部署时按实际地址调整,
const ALLOWED_ORIGINS = [
  'http://localhost:3002',
  'http://127.0.0.1:3002',
  // 生产站点 Origin:腾讯云轻量服务器直 IP 访问 20260925 部署,
  'http://124.221.213.247',
];

// 执行命令并取输出(wmic 默认输出 UTF-16LE,统一按 UTF-16 解码再容错 ASCII)
function run(cmd) {
  return new Promise((resolve) => {
    exec(cmd, { windowsHide: true }, (err, stdout) => {
      if (err) return resolve('');
      const text = Buffer.from(stdout, 'utf16le').toString('utf8');
      resolve(text || stdout || '');
    });
  });
}

// 从 wmic 输出中提取序列号:跳过标题行,取第一条非空值
function pickSerial(wmicOutput) {
  const lines = String(wmicOutput)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  // wmic 输出第一行是列名(如 SerialNumber),数据从第二行起
  if (lines.length >= 2) return lines[1];
  return '';
}

// 采集硬件指纹:硬盘序列号 + 主板序列号 + MachineGuid(任一缺失仍可计算,稳定性由三项组合保证)
async function collectFingerprint() {
  const diskRaw = await run('wmic diskdrive get serialnumber');
  const boardRaw = await run('wmic baseboard get serialnumber');
  const guidRaw = await run('reg query HKLM\\SOFTWARE\\Microsoft\\Cryptography /v MachineGuid');
  const disk = pickSerial(diskRaw) || 'NO-DISK';
  const board = pickSerial(boardRaw) || 'NO-BOARD';
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
});

// 端口被占(已有实例在跑)时直接退出,避免报错弹窗
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.log('[device-agent] already running, exit');
    process.exit(0);
  }
  throw err;
});

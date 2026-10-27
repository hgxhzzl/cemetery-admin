// 设备指纹 Agent:登录页通过 http://127.0.0.1:19700/device-info 获取本机设备哈希 20260924 新增,
// deviceHash = SHA256(硬盘序列号|主板序列号|MachineGuid),物理序列号为主,防止软件层伪造设备身份,
// 安全:仅监听 127.0.0.1(外部网络不可达) + Origin 白名单(防其他网站探测),
// 20261026 修复:原白名单是三条完整 Origin 字面量,端口一变(Vite 3002 被占自动换端口)或换用内网 IP 访问
// 就命中 403,前端把非 2xx 统一当成“未检测到设备服务”,无法登记本机,
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');
const { exec } = require('node:child_process');

// 端口可由环境变量覆盖:计划任务固定用默认 19700,仅便于在开发机另起一份实例做联调/回归验证,
const PORT = Number(process.env.DEVICE_AGENT_PORT) || 19700;
// 允许访问本服务的页面来源(Origin)判定口径:
// 1) 本机回环任意端口:http://localhost|127.0.0.1:port —— 开发服务端口可能因占用漂移,
//    且 localhost/127.0.0.1 只可能是本机页面,放行不扩大攻击面;
// 2) 私网地址任意端口:http://10.x|172.16-31.x|192.168.x:port —— 现场终端/打印电脑直连内网服务,
//    公网站点的 Origin 不可能落在私网段,同样不扩大攻击面;
// 3) 内置生产站点 host(协议与端口不限):直 IP 部署 20260925 部署;
// 4) 同目录 device-agent.origins.json 追加的精确 Origin 或 host(换域名/HTTPS 时无需改代码)。
// 正则内一律用非捕获组(只做校验不取值,捕获组会被规则判为无用),
const LOOPBACK_ORIGIN = /^http:\/\/(?:localhost|127\.0\.0\.1)(?::\d{1,5})?$/i;
const PRIVATE_ORIGIN =
  /^http:\/\/(?:10(?:\.\d{1,3}){3}|172\.(?:1[6-9]|2\d|3[01])(?:\.\d{1,3}){2}|192\.168(?:\.\d{1,3}){2})(?::\d{1,5})?$/;
const ALLOWED_HOSTS = ['124.221.213.247'];

// 可选配置文件:数组形式 ['http://a.example.com','https://b.example.com:8443'] 或 { origins: [...] },
// 条目可以是完整 origin(精确匹配)也可以是 host(匹配任意协议/端口);读不到/格式错即忽略,不影响内置口径,
function loadExtraOrigins() {
  const file = path.join(__dirname, 'device-agent.origins.json');
  try {
    const parsed = JSON.parse(fs.readFileSync(file, 'utf8'));
    const list = Array.isArray(parsed) ? parsed : parsed && Array.isArray(parsed.origins) ? parsed.origins : [];
    return list.map((item) => String(item).trim()).filter(Boolean);
  } catch {
    return [];
  }
}
const EXTRA_ORIGINS = loadExtraOrigins();

// 运行事件记录:计划任务以 SYSTEM 运行、标准输出无终端可看,访问与自退原因只落这个文件。
// 除拒绝外也记成功访问:排查“页面报未检测到设备服务”时,日志有无新行直接区分
// 「请求根本没到达 Agent(浏览器侧拦/页面未调用)」与「到达并 200(问题在前端解析)」;
// 频次极低(登录页与登记各一次),超上限时清空重写,不做多文件轮转 20261026,
const LOG_PATH = path.join(__dirname, 'device-agent.log');
const LOG_MAX_BYTES = 256 * 1024;

function appendLog(line) {
  try {
    try {
      if (fs.statSync(LOG_PATH).size > LOG_MAX_BYTES) {
        fs.writeFileSync(LOG_PATH, '');
      }
    } catch {
      // 文件尚不存在时忽略
    }
    fs.appendFileSync(LOG_PATH, `[${new Date().toISOString()}] ${line}\n`, 'utf8');
  } catch {
    // 日志写失败不得影响主体行为
  }
}

function logDenied(origin, reason) {
  appendLog(`deny origin="${origin}" ${reason}`);
}

function isAllowedOrigin(origin) {
  // 无 Origin:浏览器地址栏直接打开(自检用)、本地程序/命令行调用。
  // 不能算作“放行外部网站”:浏览器发起的跳源 GET/POST 一定带 Origin 头(或 Origin: null),
  // 不带 Origin 的标签类请求(如 img)本就无从读取响应体,不会泄露指纹 20261026 补充,
  if (!origin) return true;
  if (EXTRA_ORIGINS.includes(origin)) return true;
  if (LOOPBACK_ORIGIN.test(origin) || PRIVATE_ORIGIN.test(origin)) return true;
  try {
    const url = new URL(origin);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return false;
    if (ALLOWED_HOSTS.includes(url.hostname)) return true;
    return EXTRA_ORIGINS.some((item) => item === url.host || item === url.hostname);
  } catch {
    return false;
  }
}

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
  const allowed = isAllowedOrigin(origin);
  // CORS 预检:未授权来源直接 403(此前回退到白名单首项,预检看似通过、真正 GET 才被挡,排查时更迷惑),
  if (req.method === 'OPTIONS') {
    if (!allowed) {
      logDenied(origin, 'preflight');
      res.writeHead(403);
      return res.end();
    }
    const preflightHeaders = {
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };
    // 无 Origin(地址标自检、命令行调用等非跨源场景)不设 ACAO:空值头对浏览器无意义,省得响应头出现空来源,
    if (origin) {
      preflightHeaders['Access-Control-Allow-Origin'] = origin;
    }
    // 浏览器私有网络访问(PNA)/本地网络访问预检会带这个请求头,服务端须显式同意,
    // 否则请求被浏览器拦在门外、连 GET 都不会发出 20261026 补充,
    if (String(req.headers['access-control-request-private-network'] || '').toLowerCase() === 'true') {
      preflightHeaders['Access-Control-Allow-Private-Network'] = 'true';
    }
    res.writeHead(204, preflightHeaders);
    return res.end();
  }
  if (req.url !== '/device-info' || req.method !== 'GET') {
    res.writeHead(404);
    return res.end();
  }
  // Origin 白名单:非授权站点一律 403,不暴露设备信息
  if (!allowed) {
    logDenied(origin, 'get');
    res.writeHead(403);
    return res.end();
  }
  try {
    const fingerprint = await getFingerprint();
    appendLog(`ok origin="${origin || '-'}"`);
    const responseHeaders = { 'Content-Type': 'application/json' };
    if (origin) {
      responseHeaders['Access-Control-Allow-Origin'] = origin;
    }
    res.writeHead(200, responseHeaders);
    res.end(JSON.stringify(fingerprint));
  } catch (err) {
    console.error('[device-agent] fingerprint error:', err.message);
    res.writeHead(500, origin ? { 'Access-Control-Allow-Origin': origin } : {});
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

// 端口被占时退出前留一行排查线索(旧 Agent 没被结束时新实例装了新代码却不生效),
// 但 keepalive 任务每 5 分钟都会拉起一个撞端口的新进程,逐条记日志纯是噪音:
// 同一天只记第一条,其余静默退出 20261027 降噪,
function logExitOncePerDay(port) {
  const today = new Date().toISOString().slice(0, 10);
  try {
    const tail = fs.readFileSync(LOG_PATH, 'utf8').slice(-2048);
    const lines = tail.split('\n').filter((line) => line.includes('already in use'));
    const last = lines[lines.length - 1] || '';
    if (last.startsWith(`[${today}`)) return;
  } catch {
    // 日志文件尚不存在时视为今天未记录
  }
  appendLog(`exit: port ${port} already in use, another agent instance is serving requests`);
}

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    logExitOncePerDay(PORT);
    process.exit(0);
  }
  throw err;
});

#!/bin/bash
# 后端部署：覆盖变更文件 → kill 实际运行路径 PID 让 PM2 自动拉起 → 验证进程与日志 → 清理（含自删）
set -e
mkdir -p /tmp/deploy-api
tar -xzf /tmp/api-update.tar.gz -C /tmp/deploy-api
cp -r /tmp/deploy-api/. /www/wwwroot/cemetery-api/
PID=$(ps -eo pid,cmd | grep 'node /www/wwwroot/cemetery-api/index.js' | grep -v grep | awk '{print $1}')
if [ -n "$PID" ]; then
  kill -9 "$PID"
  echo "killed old pid $PID"
else
  echo "WARN: no running api process found"
fi
sleep 6
echo "=== 新进程 ==="
ps -eo pid,lstart,cmd | grep 'node /www/wwwroot/cemetery-api/index.js' | grep -v grep
echo "=== 最新日志 ==="
tail -n 3 /www/wwwlogs/pm2/cemetery-api-out.log
rm -rf /tmp/deploy-api /tmp/api-update.tar.gz
rm -f /tmp/deploy-api.sh
echo "API DEPLOY DONE"

#!/bin/bash
# 前端部署：解压 → 新旧目录互换 → nginx reload → 清理（含自删）
set -e
mkdir -p /tmp/deploy-fe
tar -xzf /tmp/dist-deploy.tar.gz -C /tmp/deploy-fe
mv /www/wwwroot/cemetery-admin/dist /www/wwwroot/cemetery-admin/dist.old
mv /tmp/deploy-fe/dist /www/wwwroot/cemetery-admin/dist
nginx -t && systemctl reload nginx
echo "=== index.html 引用 ==="
grep -o 'index-[A-Za-z0-9_-]*\.js' /www/wwwroot/cemetery-admin/dist/index.html | head -1
rm -rf /www/wwwroot/cemetery-admin/dist.old /tmp/deploy-fe /tmp/dist-deploy.tar.gz
rm -f /tmp/deploy-frontend.sh
echo "FRONTEND DEPLOY DONE"

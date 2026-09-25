@echo off
rem 设备指纹 Agent 卸载脚本:停止并删除 Windows 服务 20260924 新增,
chcp 65001 >nul
set SERVICE_NAME=CemeteryDeviceAgent

sc stop %SERVICE_NAME% >nul 2>&1
sc delete %SERVICE_NAME%
echo [成功] 设备指纹服务已卸载
pause

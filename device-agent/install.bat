@echo off
rem Device fingerprint agent installer wrapper: elevates, then runs install.ps1.
rem ASCII-only on purpose: cmd decodes this file with the current console codepage (GBK on
rem zh-CN Windows), so non-ASCII text before any "chcp" can corrupt parsing and make the
rem script die silently. All real logic now lives in install.ps1. 20261010
setlocal
set "PS1=%~dp0install.ps1"

net session >nul 2>&1
if errorlevel 1 (
    echo Requesting administrator rights, please click Yes on the UAC dialog...
    powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Process powershell -ArgumentList '-NoProfile','-ExecutionPolicy','Bypass','-File','%PS1%' -Verb RunAs"
    exit /b
)

powershell -NoProfile -ExecutionPolicy Bypass -File "%PS1%"
exit /b %ERRORLEVEL%

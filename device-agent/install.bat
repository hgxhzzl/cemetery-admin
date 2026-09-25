@echo off
rem 设备指纹 Agent 安装脚本:注册 Windows 服务(开机自启+崩溃自动重启) 20260924 新增,
rem 用法:以管理员身份运行 install.bat(右键"以管理员身份运行"),
chcp 65001 >nul
setlocal

rem 服务名与安装目录(脚本所在目录,Agent 需与 install.bat 放同一目录)
set SERVICE_NAME=CemeteryDeviceAgent
set AGENT_DIR=%~dp0
rem Agent 完整路径去掉末尾反斜杠的引号处理
set AGENT_PATH=%AGENT_DIR%device-agent.cjs

rem 定位 node.exe:优先 PATH,找不到则提示
where node >nul 2>&1
if errorlevel 1 (
    echo [错误] 未找到 node,请先安装 Node.js:https://nodejs.org/
    pause
    exit /b 1
)
for /f "delims=" %%i in ('where node') do set NODE_PATH=%%i

if not exist "%AGENT_PATH%" (
    echo [错误] 未找到 %AGENT_PATH%
    pause
    exit /b 1
)

rem 已安装则先删除重装(支持重复执行升级脚本内容)
sc stop %SERVICE_NAME% >nul 2>&1
sc delete %SERVICE_NAME% >nul 2>&1

rem 创建服务:开机自启(boot|system 均可启动)
sc create %SERVICE_NAME% binPath= "\"%NODE_PATH%\" \"%AGENT_PATH%\"" start= auto DisplayName= "Cemetery Device Agent"
if errorlevel 1 (
    echo [错误] 服务创建失败,请确认以管理员身份运行
    pause
    exit /b 1
)

rem 崩溃自动重启:失败后 5 秒重启,连续失败 3 次内均重启(防员工误杀/进程崩溃)
sc failure %SERVICE_NAME% reset= 86400 actions= restart/5000/restart/5000/restart/5000
sc description %SERVICE_NAME% "墓区系统登录设备指纹服务,停止后本机无法登录后台系统"

rem 启动服务
sc start %SERVICE_NAME%

echo.
echo [成功] 设备指纹服务已安装并启动(开机自启+崩溃自动重启)
echo        如杀毒软件拦截,请将本目录与 node.exe 加入信任区
pause

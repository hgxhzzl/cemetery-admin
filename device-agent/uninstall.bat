@echo off
rem Device fingerprint agent uninstaller: removes both scheduled tasks plus old service leftovers.
rem ASCII-only, see the note in install.bat. 20261010
setlocal

net session >nul 2>&1
if errorlevel 1 (
    echo Requesting administrator rights, please click Yes on the UAC dialog...
    powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Process '%~f0' -Verb RunAs"
    exit /b
)

rem End running instances before deleting the task definitions.
rem Do NOT use "taskkill /im node.exe": that would kill every node process on this machine.
schtasks /end /tn CemeteryDeviceAgent >nul 2>&1
schtasks /end /tn CemeteryDeviceAgentKeepAlive >nul 2>&1
schtasks /delete /tn CemeteryDeviceAgent /f
schtasks /delete /tn CemeteryDeviceAgentKeepAlive /f

rem Clean leftovers of the old service-based design.
sc stop CemeteryDeviceAgent >nul 2>&1
sc delete CemeteryDeviceAgent >nul 2>&1

echo Done. This PC no longer provides a device fingerprint, so logins from it will be rejected.
pause

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

rem Remove the browser local-network exemption written by install.ps1. Only the values
rem this installer owns are deleted; anything else under the policy key is untouched.
rem List policies live in a subkey with numbered values, while the older revision of the
rem installer wrote a MultiString value of the same name - remove both forms.
rem Closing/reopening the browser is required for the change to take effect. 20261026
for %%K in ("HKLM\SOFTWARE\Policies\Google\Chrome" "HKLM\SOFTWARE\Policies\Microsoft\Edge") do (
    for %%V in (InsecurePrivateNetworkRequestsAllowedForUrls LocalNetworkAccessAllowedForUrls LocalNetworkAllowedForUrls LoopbackNetworkAllowedForUrls) do (
        reg delete %%K /v %%V /f >nul 2>&1
        reg delete "%%~K\%%V" /f >nul 2>&1
    )
    reg delete %%K /v InsecurePrivateNetworkRequestsAllowed /f >nul 2>&1
    reg delete %%K /v LocalNetworkAccessRestrictionsTemporaryOptOut /f >nul 2>&1
)

rem Drop the site's private CA from the machine trust store, otherwise the PC keeps trusting
rem certificates signed by a CA that is no longer managed. 20261026
powershell -NoProfile -ExecutionPolicy Bypass -Command "Get-ChildItem Cert:\LocalMachine\Root | Where-Object { $_.Subject -like '*CN=Cemetery Internal Root CA*' } | Remove-Item -Force" >nul 2>&1

echo Done. This PC no longer provides a device fingerprint, so logins from it will be rejected.
echo Browser policies and the site CA were removed; restart Chrome/Edge to apply.
pause

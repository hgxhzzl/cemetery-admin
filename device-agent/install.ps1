# Device fingerprint agent installer. Registers two SYSTEM scheduled tasks instead of a
# Windows service: node.exe does not implement the SCM control protocol, so `sc create`
# always leaves the service stuck and error 1053 kills it before port 19700 is ever bound.
# Keep this file ASCII-only: Windows PowerShell 5.1 decodes a .ps1 as ANSI(GBK) unless a
# UTF-8 BOM is present, and non-ASCII text there can corrupt parsing. 20261010
$ErrorActionPreference = 'Continue'

$TaskName      = 'CemeteryDeviceAgent'
$KeepAliveName = 'CemeteryDeviceAgentKeepAlive'
$AgentPath     = Join-Path $PSScriptRoot 'device-agent.cjs'
$LogPath       = Join-Path $PSScriptRoot 'install.log'

$installStarted = Get-Date
Set-Content -LiteralPath $LogPath -Value ('install started ' + $installStarted) -Encoding UTF8

function Log([string]$Message) {
    $line = '{0}  {1}' -f (Get-Date -Format 'HH:mm:ss'), $Message
    Write-Host $line
    Add-Content -LiteralPath $LogPath -Value $line -Encoding UTF8
}

$isAdmin = (New-Object Security.Principal.WindowsPrincipal(
    [Security.Principal.WindowsIdentity]::GetCurrent())
).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
Log ('elevated   : ' + $isAdmin)
if (-not $isAdmin) {
    Log 'NOT ELEVATED - schtasks with /ru SYSTEM will be rejected. Use install.bat (it auto-elevates).'
    Read-Host 'Press Enter to close'
    exit 1
}

$node = (Get-Command node.exe -ErrorAction SilentlyContinue | Select-Object -First 1).Source
if (-not $node) { $node = (Get-Command node -ErrorAction SilentlyContinue | Select-Object -First 1).Source }
Log ('node       : ' + $node)
Log ('agent      : ' + $AgentPath + '  exists=' + (Test-Path -LiteralPath $AgentPath))
if (-not $node -or -not (Test-Path -LiteralPath $AgentPath)) {
    Log 'MISSING PREREQUISITE - install Node.js from https://nodejs.org/ and keep the agent next to this script.'
    Read-Host 'Press Enter to close'
    exit 1
}

# Clean up leftovers from the previous service-based design and from earlier task versions.
# Merge stderr inside cmd rather than with PowerShell "2>&1": a missing service/task is normal
# here, and native stderr records were surfaced as NativeCommandError, making the log look
# like the install itself had failed. 20261010
Log '--- cleanup ("not found" below is normal on a fresh machine) ---'
foreach ($m in @('stop', 'delete')) {
    (cmd /c "sc.exe $m $TaskName 2>&1" | Out-String).Trim() | ForEach-Object { Log ('  sc ' + $m + ': ' + $_) }
}
foreach ($t in @($TaskName, $KeepAliveName)) {
    (cmd /c "schtasks.exe /delete /tn $t /f 2>&1" | Out-String).Trim() | ForEach-Object { Log ('  task delete: ' + $_) }
}

# Free port 19700 before registering: deleting a scheduled task does NOT kill an instance that is
# already running, and such an orphan keeps serving the OLD origin whitelist forever. The fresh
# instance then hits EADDRINUSE and exits silently, so the installer would otherwise "succeed"
# while the browser keeps talking to stale code. 20261026
Log '--- free port 19700 ---'
foreach ($round in 1..10) {
    $conns = Get-NetTCPConnection -LocalPort 19700 -State Listen -ErrorAction SilentlyContinue
    if (-not $conns) { break }
    foreach ($hp in ($conns | ForEach-Object { $_.OwningProcess } | Sort-Object -Unique)) {
        try {
            $proc = Get-CimInstance -ClassName Win32_Process -Filter ("ProcessId=$hp")
            $procName = if ($proc) { $proc.Name } else { 'unknown' }
            $procCmd = if ($proc) { $proc.CommandLine } else { '' }
            Log ('  stop pid=' + $hp + ' name=' + $procName + ' cmd=' + $procCmd)
            Stop-Process -Id $hp -Force -ErrorAction Stop
        } catch {
            Log ('  stop pid=' + $hp + ' FAILED: ' + $_.Exception.Message)
        }
    }
    Start-Sleep -Seconds 1
}
$stillHolding = Get-NetTCPConnection -LocalPort 19700 -State Listen -ErrorAction SilentlyContinue
if ($stillHolding) {
    Log ('  WARNING: port 19700 still held by pid=' + (($stillHolding | ForEach-Object { $_.OwningProcess }) -join ','))
} else {
    Log '  port 19700 free'
}

$action    = New-ScheduledTaskAction -Execute $node -Argument ('"' + $AgentPath + '"') -WorkingDirectory $PSScriptRoot
$principal = New-ScheduledTaskPrincipal -UserId 'SYSTEM' -LogonType ServiceAccount -RunLevel Highest
$settings  = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries `
    -Hidden -ExecutionTimeLimit ([TimeSpan]::Zero) -MultipleInstances IgnoreNew

Log '--- task 1: run at boot ---'
try {
    Register-ScheduledTask -TaskName $TaskName -Action $action -Principal $principal `
        -Trigger (New-ScheduledTaskTrigger -AtStartup) -Settings $settings -Force `
        -Description 'Cemetery management device fingerprint agent (loopback 127.0.0.1:19700)' | Out-Null
    Log '  registered OK'
} catch {
    Log ('  FAILED: ' + $_.Exception.Message)
}

Log '--- task 2: keep alive every 5 min ---'
try {
    $keepTrigger = New-ScheduledTaskTrigger -Once -At (Get-Date) `
        -RepetitionInterval (New-TimeSpan -Minutes 5) -RepetitionDuration (New-TimeSpan -Days 3650)
    Register-ScheduledTask -TaskName $KeepAliveName -Action $action -Principal $principal `
        -Trigger $keepTrigger -Settings $settings -Force `
        -Description 'Revives the device fingerprint agent if it was killed or crashed' | Out-Null
    Log '  registered OK'
} catch {
    Log ('  FAILED: ' + $_.Exception.Message)
}

# --- browser policy: let the production HTTP page reach this loopback agent ---
# Chrome/Edge 138+ gate requests from a public HTTP page to 127.0.0.1 behind Local
# Network Access, and an HTTP page can never show the permission prompt, so the only
# client-side fix is an enterprise policy on this PC. The site is served over plain
# HTTP on a public IP (no domain/HTTPS yet), hence the installer writes the exemption.
# Only the listed origins are exempted; every other site stays blocked. 20261026
$BuiltinOrigins = @('http://124.221.213.247')
$OriginsFile = Join-Path $PSScriptRoot 'device-agent.origins.json'

function Get-PolicyOriginList {
    $list = New-Object System.Collections.ArrayList
    foreach ($item in $BuiltinOrigins) { [void]$list.Add($item) }
    if (Test-Path -LiteralPath $OriginsFile) {
        try {
            $parsed = (Get-Content -LiteralPath $OriginsFile -Raw) | ConvertFrom-Json
            $items = @()
            if ($parsed -is [System.Array]) { $items = $parsed }
            elseif ($parsed.origins) { $items = @($parsed.origins) }
            foreach ($item in $items) {
                $text = ([string]$item).Trim()
                if (-not $text) { continue }
                if ($text -match '^https?://') {
                    [void]$list.Add($text.TrimEnd('/'))
                } else {
                    # Bare host: the agent matches it for any scheme, but a browser URL
                    # list needs an explicit scheme, so cover both. 20261026
                    $hostText = $text.TrimEnd('/')
                    [void]$list.Add('http://' + $hostText)
                    [void]$list.Add('https://' + $hostText)
                }
            }
        } catch {
            Log ('  origins file ignored: ' + $_.Exception.Message)
        }
    }
    return @($list | Select-Object -Unique)
}

function Ensure-RegistryKey([string]$Path) {
    if (Test-Path -LiteralPath $Path) { return }
    $parent = Split-Path -Path $Path -Parent
    if ($parent) { Ensure-RegistryKey $parent }
    New-Item -Path $Path -Force | Out-Null
}

# Merge instead of overwrite: a domain policy or another installer may already list
# other origins, and dropping them would silently break unrelated software.
function Set-OriginPolicy([string]$KeyPath, [string]$ValueName, [string[]]$Origins) {
    $current = @()
    try {
        $existing = Get-ItemProperty -Path $KeyPath -Name $ValueName -ErrorAction Stop
        $current = @($existing.$ValueName)
    } catch {
        $current = @()
    }
    $merged = @($current + $Origins | Where-Object { $_ } | Select-Object -Unique)
    New-ItemProperty -Path $KeyPath -Name $ValueName -PropertyType MultiString `
        -Value ([string[]]$merged) -Force | Out-Null
}

$policyOrigins = Get-PolicyOriginList
Log '--- browser policy (local network access exemption) ---'
Log ('  origins: ' + ($policyOrigins -join ', '))
$policyKeys = @(
    @{ Name = 'Chrome'; Path = 'HKLM:\SOFTWARE\Policies\Google\Chrome' },
    @{ Name = 'Edge';   Path = 'HKLM:\SOFTWARE\Policies\Microsoft\Edge' }
)
foreach ($key in $policyKeys) {
    try {
        Ensure-RegistryKey $key.Path
        # InsecurePrivateNetworkRequestsAllowedForUrls is the list an HTTP page obeys
        # (legacy PNA path); the LocalNetworkAccess* values cover Chromium builds that
        # already route loopback through the newer permission model. 20261026
        Set-OriginPolicy $key.Path 'InsecurePrivateNetworkRequestsAllowedForUrls' $policyOrigins
        Set-OriginPolicy $key.Path 'LocalNetworkAccessAllowedForUrls' $policyOrigins
        New-ItemProperty -Path $key.Path -Name 'LocalNetworkAccessRestrictionsTemporaryOptOut' `
            -PropertyType DWord -Value 1 -Force | Out-Null
        Log ('  ' + $key.Name + ': policy written to ' + $key.Path)
    } catch {
        Log ('  ' + $key.Name + ': FAILED: ' + $_.Exception.Message)
    }
}
Log '  NOTE: close every Chrome/Edge window and reopen the browser for the policy to load.'

Log '--- start now ---'
try {
    Start-ScheduledTask -TaskName $TaskName
    Log '  started'
} catch {
    Log ('  FAILED: ' + $_.Exception.Message)
}

Log '--- verify ---'
Start-Sleep -Seconds 6
$listening = Get-NetTCPConnection -LocalPort 19700 -State Listen -ErrorAction SilentlyContinue
Log ('  port 19700 listening : ' + [bool]$listening)
# Report the owner of the listening process: it must be SYSTEM, otherwise the agent was started
# by an interactive test run and will die when that window closes. 20261010
# GetOwner is a WMI method, not a property of a CimInstance, so it has to go through Invoke-CimMethod. 20261026
if ($listening) {
    $ownerPid = ($listening | Select-Object -First 1).OwningProcess
    $ownerProc = Get-CimInstance -ClassName Win32_Process -Filter ("ProcessId=$ownerPid")
    $ownerText = 'unknown'
    if ($ownerProc) {
        try {
            $owner = Invoke-CimMethod -InputObject $ownerProc -MethodName GetOwner
            $ownerText = $owner.Domain + '\' + $owner.User
        } catch {
            $ownerText = 'unavailable (' + $_.Exception.Message + ')'
        }
    }
    Log ('  listener pid=' + $ownerPid + ' owner=' + $ownerText)
    # The verify step above can be "happy" with a stale instance: protocol what was actually started.
    if ($ownerProc) {
        Log ('  listener started=' + $ownerProc.CreationDate + ' cmd=' + $ownerProc.CommandLine)
        if ($ownerProc.CreationDate -lt $installStarted) {
            Log '  WARNING: listener predates this install run - the new agent did NOT take over port 19700'
        }
    }
}
try {
    $resp = Invoke-WebRequest -Uri 'http://127.0.0.1:19700/device-info' `
        -Headers @{ Origin = 'http://localhost:3002' } -UseBasicParsing -TimeoutSec 15
    Log ('  HTTP ' + $resp.StatusCode + '  body=' + $resp.Content)
} catch {
    if ($_.Exception.Response) {
        Log ('  HTTP ' + [int]$_.Exception.Response.StatusCode + ' (403 means the Origin is not whitelisted, service is alive)')
    } else {
        Log ('  FAILED: ' + $_.Exception.Message)
    }
}

Log ('done. log kept at ' + $LogPath)
Read-Host 'Press Enter to close'

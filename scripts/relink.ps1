# scripts/relink.ps1 — (re-)establish wrapper-to-forge-deploy file links.
#
# Idempotent. Safe to run any time. Removes any existing wrapper-side
# copy/link/junction for the targeted paths and re-points them at the
# forge-deploy canonical copy.
#
# Targets:
#   docker-compose.{dev,demo,cohost,export}.yml — hard-linked
#   tools\                                       — junction
#
# docker-compose.yml is INTENTIONALLY not touched: its relative paths
# (./forge-ui) differ from forge-deploy's (../forge-ui) and the
# wrapper-local copy is the right thing for wrapper-cwd invocations.

$ErrorActionPreference = "Stop"

$REPO_DIR = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$DEPLOY_DIR = Join-Path $REPO_DIR 'forge-deploy'
$OVERLAYS = @('docker-compose.dev.yml', 'docker-compose.demo.yml', 'docker-compose.cohost.yml', 'docker-compose.export.yml')

if (-not (Test-Path $DEPLOY_DIR)) {
    Write-Host "forge-deploy\ not present at $DEPLOY_DIR — clone it first (see bootstrap.ps1)"
    exit 1
}

Write-Host "Re-establishing wrapper links to forge-deploy\:"

foreach ($f in $OVERLAYS) {
    $deployPath = Join-Path $DEPLOY_DIR $f
    $wrapperPath = Join-Path $REPO_DIR $f
    if (Test-Path $deployPath) {
        if (Test-Path $wrapperPath) { Remove-Item -Force $wrapperPath }
        New-Item -ItemType HardLink -Path $wrapperPath -Value $deployPath -Force | Out-Null
        Write-Host "  ${f}: hard-link"
    }
}

$deployTools = Join-Path $DEPLOY_DIR 'tools'
$wrapperTools = Join-Path $REPO_DIR 'tools'
if (Test-Path $deployTools) {
    if (Test-Path $wrapperTools) { Remove-Item -Recurse -Force $wrapperTools }
    New-Item -ItemType Junction -Path $wrapperTools -Value $deployTools | Out-Null
    Write-Host "  tools\: junction"
}

Write-Host ""
Write-Host "Done. Verify with: powershell.exe -File scripts\check-overlay-parity.ps1"

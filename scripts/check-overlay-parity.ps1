# scripts/check-overlay-parity.ps1 — detect drift between the wrapper's
# overlay compose files and forge-deploy\'s canonical copies.
#
# The four files (docker-compose.{dev,demo,cohost,export}.yml) should be
# byte-identical because they're hard-linked. If they've drifted (editor
# atomic-save broke the inode share, manual edit on one side, etc.), this
# script flags it.
#
# Exit codes:
#   0  all four files match across wrapper and forge-deploy\
#   1  drift detected (at least one file differs)
#   2  forge-deploy\ not present (can't compare)

$ErrorActionPreference = "Stop"

$REPO_DIR = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$DEPLOY_DIR = Join-Path $REPO_DIR 'forge-deploy'
$OVERLAYS = @('docker-compose.dev.yml', 'docker-compose.demo.yml', 'docker-compose.cohost.yml', 'docker-compose.export.yml')

if (-not (Test-Path $DEPLOY_DIR)) {
    Write-Host "forge-deploy\ not present at $DEPLOY_DIR — cannot check parity"
    exit 2
}

Write-Host "Overlay parity check (wrapper vs forge-deploy\):"

$drift = $false
foreach ($f in $OVERLAYS) {
    $wrapPath = Join-Path $REPO_DIR $f
    $deployPath = Join-Path $DEPLOY_DIR $f
    $wrapHash = if (Test-Path $wrapPath)   { (Get-FileHash $wrapPath   -Algorithm SHA256).Hash } else { $null }
    $deployHash = if (Test-Path $deployPath) { (Get-FileHash $deployPath -Algorithm SHA256).Hash } else { $null }
    if (-not $wrapHash) {
        Write-Host "  ${f}: MISSING from wrapper"
        $drift = $true
    } elseif (-not $deployHash) {
        Write-Host "  ${f}: MISSING from forge-deploy"
        $drift = $true
    } elseif ($wrapHash -ne $deployHash) {
        Write-Host "  ${f}: DRIFT"
        Write-Host "    wrapper:      $wrapHash"
        Write-Host "    forge-deploy: $deployHash"
        $drift = $true
    } else {
        Write-Host "  ${f}: ok"
    }
}

if ($drift) {
    Write-Host ""
    Write-Host "Drift detected. To repair:"
    Write-Host "  1. Identify the authoritative copy (usually forge-deploy\)."
    Write-Host "  2. Copy the authoritative content over the divergent side, OR"
    Write-Host "  3. Run: powershell.exe -File scripts\relink.ps1"
    Write-Host "     (re-establishes hard-links from forge-deploy\ — destructive on the wrapper side)"
    exit 1
}

Write-Host ""
Write-Host "All four overlay files match. Hard-links intact."

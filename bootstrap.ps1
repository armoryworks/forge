# bootstrap.ps1 - clone all forge sibling repos as children of this one.
#
# Run from inside the forge\ wrapper directory after a fresh clone.
# Idempotent: skips repos that already exist; runs `git pull` instead.
# Also (re-)establishes hard-links + a junction so the wrapper's compose
# overlays and tools\ track the canonical copies in forge-deploy\.

$ErrorActionPreference = "Stop"

$OWNER = "armoryworks"
$SIBLINGS = @("forge-ui", "forge-api", "forge-deploy", "forge-test", "forge-voice")

# Siblings clone INTO this wrapper (matches docker-compose.yml ./forge-ui
# build contexts and the .gitignore /forge-*/ entries).
$REPO_DIR = (Resolve-Path .).Path

Write-Host "Bootstrapping forge siblings into: $REPO_DIR"
Write-Host ""

foreach ($repo in $SIBLINGS) {
    $target = Join-Path $REPO_DIR $repo
    if (Test-Path (Join-Path $target ".git")) {
        Write-Host "  ${repo}: already cloned, pulling latest"
        Push-Location $target
        try { git pull --ff-only } catch { Write-Host "    (skipped - local changes?)" }
        Pop-Location
    } else {
        Write-Host "  ${repo}: cloning"
        git clone "https://github.com/$OWNER/$repo.git" $target
    }
}

# --- Establish compose overlay hard-links + tools\ junction ---
#
# The four overlay compose files (dev/demo/cohost/export) are byte-identical
# to forge-deploy's copies and live in both places. Hard-linking them gives
# one underlying inode, so edits in either repo propagate. docker-compose.yml
# is deliberately NOT linked - its relative build contexts (./forge-ui) differ
# from forge-deploy's (../forge-ui), so the wrapper keeps an independent copy.

$DEPLOY_DIR = Join-Path $REPO_DIR "forge-deploy"
$OVERLAYS = @("docker-compose.dev.yml", "docker-compose.demo.yml", "docker-compose.cohost.yml", "docker-compose.export.yml")

if (-not (Test-Path $DEPLOY_DIR)) {
    Write-Host ""
    Write-Host "warning: forge-deploy not present - skipping link establishment"
} else {
    Write-Host ""
    Write-Host "Establishing wrapper links to forge-deploy\:"

    foreach ($f in $OVERLAYS) {
        $deployPath = Join-Path $DEPLOY_DIR $f
        $wrapperPath = Join-Path $REPO_DIR $f
        if (Test-Path $deployPath) {
            if (Test-Path $wrapperPath) { Remove-Item -Force $wrapperPath }
            New-Item -ItemType HardLink -Path $wrapperPath -Value $deployPath -Force | Out-Null
            Write-Host "  ${f}: hard-link"
        }
    }

    $deployTools = Join-Path $DEPLOY_DIR "tools"
    $wrapperTools = Join-Path $REPO_DIR "tools"
    if (Test-Path $deployTools) {
        if (Test-Path $wrapperTools) { Remove-Item -Recurse -Force $wrapperTools }
        New-Item -ItemType Junction -Path $wrapperTools -Value $deployTools | Out-Null
        Write-Host "  tools\: junction"
    }
}

Write-Host ""
Write-Host "Done. Sibling layout:"
Get-ChildItem -Directory -Path $REPO_DIR -Filter "forge-*" | Select-Object -ExpandProperty FullName
Write-Host ""
Write-Host "Next: cd forge-deploy ; .\setup.ps1"

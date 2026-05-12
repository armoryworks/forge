# bootstrap.ps1 — clone all forge sibling repos as children of this one,
# then (re-)establish the wrapper-side hard-links and junction to
# forge-deploy\.
#
# Run from inside the forge\ wrapper directory after a fresh clone.
# Idempotent: skips repos that already exist; runs `git pull` instead.

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
        try { git pull --ff-only } catch { Write-Host "    (skipped — local changes?)" }
        Pop-Location
    } else {
        Write-Host "  ${repo}: cloning"
        git clone "https://github.com/$OWNER/$repo.git" $target
    }
}

Write-Host ""
$relinkPath = Join-Path $REPO_DIR 'scripts\relink.ps1'
if (Test-Path $relinkPath) {
    & $relinkPath
} else {
    Write-Host "warning: scripts\relink.ps1 missing — skipping link establishment"
}

Write-Host ""
Write-Host "Done. Sibling layout:"
Get-ChildItem -Directory -Path $REPO_DIR -Filter "forge-*" | Select-Object -ExpandProperty FullName
Write-Host ""
Write-Host "Next: cd forge-deploy ; .\setup.ps1"

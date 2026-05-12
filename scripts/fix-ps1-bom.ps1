# scripts/fix-ps1-bom.ps1 — prepend a UTF-8 BOM to any wrapper-tracked
# .ps1 file that's missing one.
#
# Why this exists: the obvious-looking "fix" via Get-Content -Raw |
# Set-Content -Encoding UTF8 will silently CORRUPT non-ASCII content
# on Windows PowerShell 5. Get-Content defaults to the system code
# page (Windows-1252), which decodes UTF-8 bytes like E2 80 94 (an
# em-dash) as three separate Win-1252 chars (â € "), then Set-Content
# re-encodes those wrong chars as UTF-8 — producing 8 bytes of
# mojibake where 3 should have been.
#
# This script avoids that pitfall entirely by working at the byte
# level: ReadAllBytes -> prepend BOM bytes -> WriteAllBytes. No string
# decoding step means no encoding ambiguity.
#
# Idempotent: files that already start with EF BB BF are left alone.

$ErrorActionPreference = "Stop"

$REPO_DIR = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
Set-Location $REPO_DIR

Write-Host "Checking wrapper-tracked .ps1 files for BOM:"

$files = @(& git ls-files "*.ps1")
if ($files.Count -eq 0) {
    Write-Host "  (no tracked .ps1 files)"
    exit 0
}

$bomBytes = [byte[]](0xEF, 0xBB, 0xBF)
$fixed = 0

foreach ($f in $files) {
    $p = Join-Path $REPO_DIR $f
    $bytes = [System.IO.File]::ReadAllBytes($p)
    if ($bytes.Length -ge 3 -and $bytes[0] -eq 0xEF -and $bytes[1] -eq 0xBB -and $bytes[2] -eq 0xBF) {
        Write-Host "  ${f}: already has BOM"
    } else {
        [System.IO.File]::WriteAllBytes($p, $bomBytes + $bytes)
        Write-Host "  ${f}: BOM prepended"
        $fixed++
    }
}

Write-Host ""
if ($fixed -gt 0) {
    Write-Host "Fixed $fixed file(s). Verify with: bash scripts/check-ps1-bom.sh"
} else {
    Write-Host "Nothing to fix — all files already have BOM."
}

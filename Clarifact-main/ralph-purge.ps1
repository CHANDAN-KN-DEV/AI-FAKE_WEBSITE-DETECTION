Write-Host "Ralph Loop: Initiating Clarifact Auto-Purge..." -ForegroundColor Cyan

# 1. SCAN AND DELETE
Write-Host "Identifying and deleting orphans..." -ForegroundColor Yellow
npx knip --fix --allow-remove-files --fix-type files,exports,types

# 3. VERIFY
Write-Host "Verifying Webapp build..." -ForegroundColor Cyan
Set-Location frontend
npm run build

if ($LASTEXITCODE -eq 0) {
    Write-Host "SUCCESS: Your webapp is lean and the build passed." -ForegroundColor Green
} else {
    Write-Host "ERROR: The purge broke the build. Use 'git restore .' to undo." -ForegroundColor Red
}
Set-Location ..
# Publish to GitHub Pages
# Automatically move to the script's directory
Set-Location $PSScriptRoot

$commitMessage = Read-Host "Enter update message (default: Session Update)"
if ([string]::IsNullOrWhiteSpace($commitMessage)) {
    $commitMessage = "Session Update"
}

Write-Host "Adding files..."
git add .

Write-Host "Committing..."
git commit -m "$commitMessage"

Write-Host "Pushing to GitHub..."
git push origin main

Write-Host "Done! Your dashboard should update shortly."
Pause

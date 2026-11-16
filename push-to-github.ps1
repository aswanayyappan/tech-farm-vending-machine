$git = "C:\Users\Nithesh\.mingit\cmd\git.exe"
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "Pushing SDDS Tech Farm Vending Machine to GitHub" -ForegroundColor Green
Write-Host "Remote: https://github.com/aswanayyappan/tech-farm-vending-machine" -ForegroundColor White
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""
& $git push -u origin main

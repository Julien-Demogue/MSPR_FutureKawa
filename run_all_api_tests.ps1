$rootPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $rootPath

Set-Location .\backend_country
npm run test

Set-Location $rootPath

Set-Location .\backend_head_office
npm run test
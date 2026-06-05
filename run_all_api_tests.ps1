$rootPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $rootPath

Set-Location .\backend_country
npm run test
npm run test:e2e

Set-Location $rootPath

Set-Location .\backend_head_office
npm run test
npm run test:e2e
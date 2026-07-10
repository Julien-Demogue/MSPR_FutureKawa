$rootPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $rootPath

Set-Location .\backend_country
npm install --silent
npm run test # Execute units and integration tests for backend_country

Set-Location $rootPath

Set-Location .\backend_head_office
npm install --silent
npm run test # Execute units and integration tests for backend_head_office

Set-Location .\frontend\app_head_office
npm install --silent
npx playwright test
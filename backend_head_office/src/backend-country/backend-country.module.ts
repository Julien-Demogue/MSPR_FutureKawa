import { Module } from '@nestjs/common';
import { BackendCountryCountriesController } from './backend-country-countries.controller';
import { BackendCountryAlertsController } from './backend-country-alerts.controller';
import { BackendCountryBatchesController } from './backend-country-batches.controller';
import { BackendCountryFarmsController } from './backend-country-farms.controller';
import { BackendCountryStatementsController } from './backend-country-statements.controller';
import { BackendCountryStatusesController } from './backend-country-statuses.controller';
import { BackendCountryWarehousesController } from './backend-country-warehouses.controller';

@Module({
  controllers: [
    BackendCountryCountriesController,
    BackendCountryAlertsController,
    BackendCountryBatchesController,
    BackendCountryFarmsController,
    BackendCountryStatementsController,
    BackendCountryStatusesController,
    BackendCountryWarehousesController
  ]
})
export class BackendCountryModule {

}

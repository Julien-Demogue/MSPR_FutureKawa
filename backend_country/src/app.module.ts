import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CountriesModule } from './countries/countries.module';
import { Country } from './countries/country.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FarmsModule } from './farms/farms.module';
import { Farm } from './farms/farm.entity';
import { WarehousesModule } from './warehouses/warehouses.module';
import { Warehouse } from './warehouses/warehouse.entity';
import { BatchesModule } from './batches/batches.module';
import { Batch } from './batches/batch.entity';
import { StatusesModule } from './statuses/statuses.module';
import { Status } from './statuses/status.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'root',
      password: 'root',
      database: 'FutureKawa_Brasil',
      entities: [Country, Farm, Warehouse, Batch, Status],
      synchronize: true,
    }),
    CountriesModule,
    FarmsModule,
    WarehousesModule,
    BatchesModule,
    StatusesModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }

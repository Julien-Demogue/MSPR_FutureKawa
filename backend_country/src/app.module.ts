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

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'root',
      password: 'root',
      database: 'FutureKawa_Brasil',
      entities: [Country, Farm, Warehouse],
      synchronize: true,
    }),
    CountriesModule,
    FarmsModule,
    WarehousesModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }

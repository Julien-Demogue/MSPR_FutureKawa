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
import { StatementsModule } from './statements/statements.module';
import { Statement } from './statements/statement.entity';
import { AlertsModule } from './alerts/alerts.module';
import { Alert } from './alerts/alert.entity';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST ?? 'localhost',
      port: parseInt(process.env.DB_PORT ?? '3306', 10),
      username: process.env.DB_USER ?? 'root',
      password: process.env.DB_PASSWORD ?? 'root',
      database: process.env.DB_NAME ?? 'FutureKawa_Brasil',
      entities: [Country, Farm, Warehouse, Batch, Status, Statement, Alert],
      synchronize: true,
    }),
    CountriesModule,
    FarmsModule,
    WarehousesModule,
    BatchesModule,
    StatusesModule,
    StatementsModule,
    AlertsModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }

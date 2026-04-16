import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CountriesModule } from './countries/countries.module';
import { Country } from './countries/country.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FarmsModule } from './farms/farms.module';
import { Farm } from './farms/farm.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'root',
      password: 'root',
      database: 'FutureKawa_Brasil',
      entities: [Country, Farm],
      synchronize: true,
    }),
    CountriesModule,
    FarmsModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }

import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CountriesController } from './countries/countries.controller';
import { CountriesService } from './countries/countries.service';
import { CountriesModule } from './countries/countries.module';
import { Country } from './countries/country.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'root',
      password: 'root',
      database: 'FutureKawa_Brasil',
      entities: [Country],
      synchronize: true,
    }),
    CountriesModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

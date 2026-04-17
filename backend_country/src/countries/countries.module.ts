import { Module } from '@nestjs/common';
import { Country } from './country.entity';
import { CountriesService } from './countries.service';
import { CountriesController } from './countries.controller';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
    imports: [TypeOrmModule.forFeature([Country])],
    providers: [CountriesService],
    controllers: [CountriesController],
    exports: [CountriesService]
})
export class CountriesModule { }

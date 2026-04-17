import { Module } from '@nestjs/common';
import { Farm } from './farm.entity';
import { FarmsService } from './farms.service';
import { FarmsController } from './farms.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CountriesModule } from '../countries/countries.module';

@Module({
    imports: [TypeOrmModule.forFeature([Farm]), CountriesModule],
    providers: [FarmsService],
    controllers: [FarmsController],
    exports: [FarmsService]
})
export class FarmsModule { }
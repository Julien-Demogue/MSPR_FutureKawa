import { Module } from '@nestjs/common';
import { WarehousesService } from './warehouses.service';
import { WarehousesController } from './warehouses.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Warehouse } from './warehouse.entity';
import { FarmsModule } from '../farms/farms.module';

@Module({
  imports: [TypeOrmModule.forFeature([Warehouse]), FarmsModule],
  providers: [WarehousesService],
  controllers: [WarehousesController],
  exports: [WarehousesService]
})
export class WarehousesModule { }

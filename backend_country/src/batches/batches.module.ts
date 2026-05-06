import { Module } from '@nestjs/common';
import { BatchesService } from './batches.service';
import { BatchesController } from './batches.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Batch } from './batch.entity';
import { WarehousesModule } from '../warehouses/warehouses.module';

@Module({
  imports: [TypeOrmModule.forFeature([Batch]), WarehousesModule],
  providers: [BatchesService],
  controllers: [BatchesController],
  exports: [BatchesService]
})
export class BatchesModule { }

import { forwardRef, Module } from '@nestjs/common';
import { BatchesService } from './batches.service';
import { BatchesController } from './batches.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Batch } from './batch.entity';
import { WarehousesModule } from '../warehouses/warehouses.module';
import { StatusesModule } from '../statuses/statuses.module';

@Module({
  imports: [TypeOrmModule.forFeature([Batch]), WarehousesModule, forwardRef(() => StatusesModule)],
  providers: [BatchesService],
  controllers: [BatchesController],
  exports: [BatchesService]
})
export class BatchesModule { }

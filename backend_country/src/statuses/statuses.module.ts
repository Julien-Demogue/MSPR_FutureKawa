import { Module } from '@nestjs/common';
import { StatusesService } from './statuses.service';
import { StatusesController } from './statuses.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Status } from './status.entity';
import { BatchesModule } from '../batches/batches.module';

@Module({
  imports: [TypeOrmModule.forFeature([Status]), BatchesModule],
  providers: [StatusesService],
  controllers: [StatusesController],
  exports: [StatusesService]
})
export class StatusesModule { }

import { Module } from '@nestjs/common';
import { StatementsService } from './statements.service';
import { StatementsController } from './statements.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Statement } from './statement.entity';
import { WarehousesModule } from '../warehouses/warehouses.module';

@Module({
  imports: [TypeOrmModule.forFeature([Statement]), WarehousesModule],
  providers: [StatementsService],
  controllers: [StatementsController],
  exports: [StatementsService]
})
export class StatementsModule { }

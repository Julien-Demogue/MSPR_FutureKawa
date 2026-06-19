import { forwardRef, Module } from '@nestjs/common';
import { StatementsService } from './statements.service';
import { StatementsController } from './statements.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Statement } from './statement.entity';
import { WarehousesModule } from '../warehouses/warehouses.module';
import { AlertsModule } from '../alerts/alerts.module';
import { StatusesModule } from '../statuses/statuses.module';

@Module({
  imports: [TypeOrmModule.forFeature([Statement]), WarehousesModule, forwardRef(() => AlertsModule), StatusesModule],
  providers: [StatementsService],
  controllers: [StatementsController],
  exports: [StatementsService]
})
export class StatementsModule { }

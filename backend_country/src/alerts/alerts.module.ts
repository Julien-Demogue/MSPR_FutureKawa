import { Module } from '@nestjs/common';
import { AlertsService } from './alerts.service';
import { AlertsController } from './alerts.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Alert } from './alert.entity';
import { StatusesModule } from '../statuses/statuses.module';
import { StatementsModule } from '../statements/statements.module';

@Module({
  imports: [TypeOrmModule.forFeature([Alert]), StatusesModule, StatementsModule],
  providers: [AlertsService],
  controllers: [AlertsController],
  exports: [AlertsService]
})
export class AlertsModule { }

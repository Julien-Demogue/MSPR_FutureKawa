import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { EventPattern } from '@nestjs/microservices/decorators/event-pattern.decorator';
import { Payload } from '@nestjs/microservices/decorators/payload.decorator';
import { StatementsService } from './statements/statements.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService, private statementsService: StatementsService) { }

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @EventPattern('temperature')
  handleTemperatureUpdate(@Payload() data: any) {
    console.log('New MQTT message received :', data);
    try {
      this.statementsService.create({
        value: Number(data),
        type: 'TEMPERATURE',
        id_warehouse: 1 // For now we only have one warehouse
      });
    }
    catch (error) {
      console.error('Error creating statement:', error);
    }
  }

  @EventPattern('humidity')
  handleHumidityUpdate(@Payload() data: any) {
    console.log('New MQTT message received :', data);
    try {
      this.statementsService.create({
        value: Number(data),
        type: 'HUMIDITY',
        id_warehouse: 1 // For now we only have one warehouse
      });
    }
    catch (error) {
      console.error('Error creating statement:', error);
    }
  }
}

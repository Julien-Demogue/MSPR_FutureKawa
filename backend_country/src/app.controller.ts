import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { EventPattern } from '@nestjs/microservices/decorators/event-pattern.decorator';
import { Payload } from '@nestjs/microservices/decorators/payload.decorator';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
  
  // Écoute le topic 'capteurs/temperature'
  @EventPattern('capteurs/temperature')
  handleTemperatureUpdate(@Payload() data: any) {
    console.log('Nouveau message MQTT reçu :', data);
    // Logique de traitement ici
  }
}

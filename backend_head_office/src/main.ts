import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: (process.env.FRONT_URL ?? 'http://localhost:5000').replace(/\/+$/, ''),
    credentials: true
  });
  app.use(cookieParser());

  const config = new DocumentBuilder()
    .setTitle('FutureKawa - Backend Head Office')
    .setVersion('1.0')
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('doc', app, documentFactory);

  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();

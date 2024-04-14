import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as process from 'node:process';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('GIIN Dynamic Blocks API')
    .setDescription('API Dynamic Blocks description')
    .setVersion('0.1.0')
    .addTag('API')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  // TODO: Mirar de reducirlo a solo x dominio para el frontend y que use un paramto del fichero .env
  app.enableCors();

  await app.listen(process.env.PORT || 4000);
}

bootstrap();

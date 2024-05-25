import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as process from 'node:process';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { resolve, join } from 'path';
import { writeFileSync, createWriteStream } from 'fs';
import { get } from 'http';

async function bootstrap() {
  const app: NestExpressApplication = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('GIIN Dynamic Blocks API')
    .setDescription('API Dynamic Blocks description')
    .setVersion('1.0.0')
    .addTag('API')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document, {
    // customfavIcon: 'favicon.ico',
  });

  // TODO: Mirar de reducirlo a solo x dominio para el frontend y que use un paramto del fichero .env
  app.enableCors();

  app.useStaticAssets(join(__dirname, '..', '..', 'public'));

  const port = process.env.PORT || 4000;
  await app.listen(port);

  // // get the swagger json file (if app is running in development mode)
  // if (process.env.NODE_ENV === 'development') {
  //   // write swagger ui files
  //   const serverUrl = `http://0.0.0.0:${port}`;
  //   get(`${serverUrl}/swagger/swagger-ui-bundle.js`, function (response) {
  //     response.pipe(createWriteStream('public/swagger-ui-bundle.js'));
  //     console.log(
  //       `Swagger UI bundle file written to: '/public/swagger-ui-bundle.js'`,
  //     );
  //   });
  //
  //   get(`${serverUrl}/swagger/swagger-ui-init.js`, function (response) {
  //     response.pipe(createWriteStream('public/swagger-ui-init.js'));
  //     console.log(
  //       `Swagger UI init file written to: '/public/swagger-ui-init.js'`,
  //     );
  //   });
  //
  //   get(
  //     `${serverUrl}/swagger/swagger-ui-standalone-preset.js`,
  //     function (response) {
  //       response.pipe(
  //         createWriteStream('public/swagger-ui-standalone-preset.js'),
  //       );
  //       console.log(
  //         `Swagger UI standalone preset file written to: '/public/swagger-ui-standalone-preset.js'`,
  //       );
  //     },
  //   );
  //
  //   get(`${serverUrl}/swagger/swagger-ui.css`, function (response) {
  //     response.pipe(createWriteStream('public/swagger-ui.css'));
  //     console.log(
  //       `Swagger UI css file written to: '/public/swagger-ui.css'`,
  //     );
  //   });
  // }
}

bootstrap();

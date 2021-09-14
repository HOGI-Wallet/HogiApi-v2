import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from './config/config.service';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
// import cors from 'cors';
import { config } from 'aws-sdk';
// import { json } from 'body-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // app.use(json({ limit: '50mb' }));
  /**
   * App cors settings
   */
  app.enableCors();
  // const options = {
  //   origin: ['http://localhost:3000'],
  //   methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  //   preflightContinue: false,
  //   optionsSuccessStatus: 204,
  //   credentials: true,
  // };
  // app.use(cors(options));

  /**
   * Global validaiton pipes
   */
  app.useGlobalPipes(new ValidationPipe());

  /**
   * Swagger documentation settings
   */

  const swaggerConfig = new DocumentBuilder()
    .setTitle('CryptoKara - API Docs')
    .setDescription(
      'Swagger apis for managing wallets on different blockchains.',
    )
    .addBearerAuth({ type: 'http', bearerFormat: 'JWT', scheme: 'bearer' })
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);

  /**
   * Importing config module (.env and other settings)
   */
  const configService: ConfigService = app.get(ConfigService);

  /***
   * AWS SDK Config
   */
  config.update({
    accessKeyId: configService.awsAccessKey,
    secretAccessKey: configService.awsSeceretKey,
    region: configService.awsRegion,
  });

  await app.listen(
    configService.port,
    () => `server started on ${configService.port}`,
  );
}
bootstrap();

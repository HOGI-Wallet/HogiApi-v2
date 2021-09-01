import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from './config/config.service';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
// import cors from 'cors';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
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

  const config: ConfigService = app.get(ConfigService);
  await app.listen(config.port, () => `server started on ${config.port}`);
}
bootstrap();

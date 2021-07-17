import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from './config/config.service';
// import cors from 'cors';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();

  const config: ConfigService = app.get(ConfigService);

  // const options = {
  //   origin: ['http://localhost:3000'],
  //   methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  //   preflightContinue: false,
  //   optionsSuccessStatus: 204,
  //   credentials: true,
  // };
  // app.use(cors(options));

  // global validation pipe
  app.useGlobalPipes(new ValidationPipe());

  await app.listen(config.port, () => `server started on ${config.port}`);
}
bootstrap();

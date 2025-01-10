import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { WinstonModule } from 'nest-winston';
import { winstonInstance } from './config/winston.config';
import { HttpExceptionFilter } from './helpers';
import * as cookieParser from 'cookie-parser';
import { LoggingInterceptor } from './logging.interceptor';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: WinstonModule.createLogger({
      instance: winstonInstance,
    }),
  });

  app.useGlobalInterceptors(new LoggingInterceptor());

  const config = app.get(ConfigService);

  app.use(cookieParser());
  app.useGlobalPipes(new ValidationPipe({ transform: true }));
  app.useGlobalFilters(new HttpExceptionFilter());

  const port = config.get('app').appPort;
  const env = config.get('app').environment;

  if (env === 'development') {
    app.enableCors({
      origin: (_, callback) => {
        callback(null, true);
      },
      credentials: true,
    });
  }

  await app.listen(port);

  console.log(`Application environment: ${env}`);
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();

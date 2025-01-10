import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { CalenderModule } from './calender/calender.module';
import { ConfigModule } from '@nestjs/config';
import appConfig from './config/env/app.config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { GoogleApiModule } from './google-api/google-api.module';
import { CacheModule } from '@nestjs/cache-manager';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', '..', 'client', 'build_web'),
      renderPath: '*', //  ensures all routes are redirected to index.html
    }),
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      load: [appConfig],
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: process.env.NODE_ENV === 'development' ? 40 : 30,
      },
    ]),
    CacheModule.register({ isGlobal: true }),
    AuthModule,
    CalenderModule,
    GoogleApiModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}

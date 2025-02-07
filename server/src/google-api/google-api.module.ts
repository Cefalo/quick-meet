import { Module, Scope, Logger, Inject } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { REQUEST } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import appConfig from 'src/config/env/app.config';
import { GoogleApiMockService } from './google-api-mock.service';
import { GoogleApiService } from './google-api.service';
import { Cache } from 'cache-manager';
import { CACHE_MANAGER, CacheModule } from '@nestjs/cache-manager';

@Module({
  imports: [
    CacheModule.register({
      isGlobal: true,
    }),
  ],
  providers: [
    {
      provide: 'GoogleApiService',
      inject: [REQUEST, JwtService, appConfig.KEY, CACHE_MANAGER],
      scope: Scope.REQUEST,
      // service provider
      useFactory: (request: Request, jwtService: JwtService, config: ConfigType<typeof appConfig>, logger: Logger, cacheManager: Cache) => {
        const useMock = request.headers['x-mock-api'] === 'true';
        return useMock ? new GoogleApiMockService(jwtService, cacheManager) : new GoogleApiService(config, logger);
      },
    },
    JwtService,
  ],
  exports: ['GoogleApiService'],
})
export class GoogleApiModule {}

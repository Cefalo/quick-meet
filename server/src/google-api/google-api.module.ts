import { Module, Scope, Logger } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { REQUEST } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import appConfig from 'src/config/env/app.config';
import { GoogleApiMockService } from './google-api-mock.service';
import { GoogleApiService } from './google-api.service';

@Module({
  providers: [
    {
      provide: 'GoogleApiService',
      inject: [REQUEST, JwtService, appConfig.KEY],
      scope: Scope.REQUEST,
      // service provider
      useFactory: (request: Request, jwtService: JwtService, config: ConfigType<typeof appConfig>, logger: Logger) => {
        const useMock = request.headers['x-mock-api'] === 'true';
        return useMock ? new GoogleApiMockService(jwtService, config) : new GoogleApiService(config, logger);
      },
    },
    JwtService,
  ],
  exports: ['GoogleApiService'],
})
export class GoogleApiModule {}

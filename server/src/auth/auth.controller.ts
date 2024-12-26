import { ApiResponse, LoginResponse } from '@quickmeet/shared';
import { Body, Controller, Get, Headers, Inject, Post, Res, UseGuards, UseInterceptors } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from './auth.guard';
import { _OAuth2Client } from './decorators';
import { createResponse } from 'src/helpers/payload.util';
import { Response, type CookieOptions } from 'express';
import { OAuthInterceptor } from 'src/auth/oauth.interceptor';
import type { OAuth2Client } from 'google-auth-library';
import appConfig from 'src/config/env/app.config';
import type { ConfigType } from '@nestjs/config';

@Controller()
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    @Inject(appConfig.KEY) private config: ConfigType<typeof appConfig>,
  ) {}

  @Post('/oauth2callback')
  async oAuthCallback(
    @Body('code') code: string,
    @Headers('x-redirect-url') redirectUrl: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<ApiResponse<LoginResponse>> {
    const { jwt, refreshToken } = await this.authService.login(code, redirectUrl);

    const cookieOptions: CookieOptions = this.authService.getCookieOptions();
    res.cookie('refreshToken', refreshToken, cookieOptions);

    return createResponse({ accessToken: jwt });
  }

  @UseGuards(AuthGuard)
  @UseInterceptors(OAuthInterceptor)
  @Post('/logout')
  async logout(@_OAuth2Client() client: OAuth2Client, @Res({ passthrough: true }) res: Response): Promise<ApiResponse<boolean>> {
    res.clearCookie('refreshToken');
    return await this.authService.logout(client);
  }

  @UseGuards(AuthGuard)
  @Get('/session')
  validateSession(): Promise<ApiResponse<boolean>> {
    return this.authService.validateSession();
  }
}

import { ApiResponse, LoginResponse } from '@quickmeet/shared';
import { Body, Controller, Get, Headers, Post, Res, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from './auth.guard';
import { _OAuth2Client } from './decorators';
import { createResponse } from 'src/helpers/payload.util';
import type { Response } from 'express';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('/oauth2callback')
  async oAuthCallback(
    @Body('code') code: string,
    @Headers('x-redirect-url') redirectUrl: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<ApiResponse<LoginResponse>> {
    const { jwt, refreshToken } = await this.authService.login(code, redirectUrl);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      path: '/',
      maxAge: 30 * 24 * 60 * 60 * 1000, // (e.g., 30 days)
    });

    return createResponse({ accessToken: jwt });
  }

  @UseGuards(AuthGuard)
  @Post('/logout')
  async logout(): Promise<ApiResponse<boolean>> {
    return await this.authService.logout();
  }

  @UseGuards(AuthGuard)
  @Get('/session')
  validateSession(): Promise<ApiResponse<boolean>> {
    return this.authService.validateSession();
  }
}

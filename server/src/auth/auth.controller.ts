import { ApiResponse, LoginResponse } from '@quickmeet/shared';
import { Body, Controller, Get, Headers, Post, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from './auth.guard';
import { _OAuth2Client } from './decorators';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('/oauth2callback')
  async oAuthCallback(@Body('code') code: string, @Headers('x-redirect-url') redirectUrl: string): Promise<ApiResponse<LoginResponse>> {
    return await this.authService.login(code, redirectUrl);
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

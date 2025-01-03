import { ApiResponse, LoginResponse } from '@quickmeet/shared';
import { Body, Controller, Get, Post, Req, Res, UseGuards, UseInterceptors } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from './auth.guard';
import { _OAuth2Client } from './decorators';
import { createResponse } from 'src/helpers/payload.util';
import { Response, CookieOptions, Request } from 'express';
import { OAuthInterceptor } from 'src/auth/oauth.interceptor';
import { OAuth2Client } from 'google-auth-library';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('/oauth2callback')
  async oAuthCallback(@Body('code') code: string, @Res({ passthrough: true }) res: Response): Promise<ApiResponse<LoginResponse>> {
    const { jwt, refreshToken } = await this.authService.login(code);

    const cookieOptions: CookieOptions = this.authService.getCookieOptions();
    refreshToken && res.cookie('refreshToken', refreshToken, cookieOptions);

    return createResponse({ accessToken: jwt });
  }

  @UseGuards(AuthGuard)
  @UseInterceptors(OAuthInterceptor)
  @Post('/logout')
  async logout(@_OAuth2Client() client: OAuth2Client, @Res({ passthrough: true }) res: Response): Promise<ApiResponse<boolean>> {
    res.clearCookie('refreshToken');
    const status = await this.authService.logout(client);

    return createResponse(status);
  }

  @Get('/oauth-url')
  getOAuthUrl(): ApiResponse<string> {
    const url = this.authService.getOAuthUrl();

    return createResponse(url);
  }

  @Get('/refresh-token')
  async refreshAppToken(@Req() req: Request): Promise<ApiResponse<string>> {
    const refreshToken: string | undefined = req.cookies.refreshToken;
    const appToken = await this.authService.refreshAppToken(refreshToken);

    return createResponse(appToken);
  }
}

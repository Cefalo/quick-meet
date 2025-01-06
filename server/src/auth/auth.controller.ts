import { ApiResponse, LoginResponse } from '@quickmeet/shared';
import { Body, Controller, Get, Post, Req, Res, UseGuards, UseInterceptors } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from './auth.guard';
import { _OAuth2Client } from './decorators';
import { createResponse } from 'src/helpers/payload.util';
import { Response, CookieOptions, Request } from 'express';
import { RequestInterceptor } from './request.interceptor';
import { OAuth2Client } from 'google-auth-library';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('/oauth2/callback')
  async oAuthCallback(@Body('code') code: string, @Res({ passthrough: true }) res: Response): Promise<ApiResponse<LoginResponse>> {
    const { jwt, refreshToken } = await this.authService.login(code);

    if (refreshToken) {
      const cookieOptions: CookieOptions = this.authService.getCookieOptions();
      res.cookie('refreshToken', refreshToken, cookieOptions);
    }

    const cookieOptions: CookieOptions = this.authService.getCookieOptions(false, 1 * 60 * 60 * 1000); // 1h expiry time
    res.cookie('accessToken', jwt, cookieOptions);

    return createResponse({ accessToken: jwt });
  }

  @UseGuards(AuthGuard)
  @UseInterceptors(RequestInterceptor)
  @Post('/logout')
  async logout(@_OAuth2Client() client: OAuth2Client, @Res({ passthrough: true }) res: Response): Promise<ApiResponse<boolean>> {
    res.clearCookie('refreshToken');
    res.clearCookie('accessToken');

    const status = await this.authService.logout(client);
    return createResponse(status);
  }

  @Get('/oauth2/url')
  getOAuthUrl(): ApiResponse<string> {
    const url = this.authService.getOAuthUrl();

    return createResponse(url);
  }

  @Get('/token/refresh')
  async refreshAppToken(@Req() req: Request, @Res({ passthrough: true }) res: Response): Promise<ApiResponse<string>> {
    const refreshToken: string | undefined = req.cookies.refreshToken;
    const appToken = await this.authService.refreshAppToken(refreshToken);

    const cookieOptions: CookieOptions = this.authService.getCookieOptions(false, 60 * 60 * 1000);
    res.cookie('accessToken', appToken, cookieOptions);

    return createResponse(appToken);
  }
}

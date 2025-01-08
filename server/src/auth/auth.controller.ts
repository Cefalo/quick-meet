import { ApiResponse } from '@quickmeet/shared';
import { Body, Controller, Get, Inject, Post, Req, Res, Logger, Query } from '@nestjs/common';
import { AuthService } from './auth.service';
import { _OAuth2Client } from './decorators';
import { createResponse } from 'src/helpers/payload.util';
import { Response, CookieOptions, Request } from 'express';
import { GoogleApiService } from 'src/google-api/google-api.service';
import { _Request } from './interfaces';
import { toMs } from 'src/helpers/helper.util';
import { EncryptionService } from './encryption.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private encryptionService: EncryptionService,
    @Inject('GoogleApiService') private readonly googleApiService: GoogleApiService,
    private logger: Logger,
  ) {}

  @Post('/oauth2/callback')
  async oAuthCallback(@Body('code') code: string, @Res({ passthrough: true }) res: Response): Promise<ApiResponse<Boolean>> {
    const { accessToken, refreshToken, hd, iv, email } = await this.authService.login(code);

    if (refreshToken && iv) {
      this.setCookie(res, 'refreshToken', refreshToken);
      this.setCookie(res, 'iv', iv);
    }

    this.setCookie(res, 'accessToken', accessToken, toMs('1h'));
    this.setCookie(res, 'hd', hd);
    this.setCookie(res, 'email', email);

    this.logger.log(`OAuth flow completed for user ${email} with accessToken ${accessToken} and refreshToken ${refreshToken}`);
    return createResponse(true);
  }

  @Post('/logout')
  async logout(@Req() req: _Request, @Res({ passthrough: true }) res: Response): Promise<ApiResponse<boolean>> {
    const client = this.googleApiService.getOAuthClient();
    client.setCredentials({ access_token: req.cookies.accessToken });

    res.clearCookie('refreshToken');
    res.clearCookie('accessToken');
    res.clearCookie('hd');
    res.clearCookie('iv');
    res.clearCookie('email');

    const status = await this.authService.logout(client);
    return createResponse(status);
  }

  @Get('/oauth2/url')
  getOAuthUrl(@Query('client') client: 'chrome' | 'web'): ApiResponse<string> {
    const url = this.googleApiService.getOAuthUrl(client);

    return createResponse(url);
  }

  @Get('/token/refresh')
  async refreshAppToken(@Req() req: Request, @Res({ passthrough: true }) res: Response): Promise<ApiResponse<string>> {
    const refreshToken = await this.encryptionService.decrypt(req.cookies.refreshToken, req.cookies.iv);
    const accessToken = await this.authService.refreshAppToken(refreshToken);

    this.setCookie(res, 'accessToken', accessToken, toMs('1h'));

    return createResponse(accessToken);
  }

  private setCookie(res: Response, name: string, value: string, maxAge: number = toMs('30d')): void {
    const cookieOptions: CookieOptions = this.authService.getCookieOptions(maxAge);
    res.cookie(name, value, cookieOptions);
  }
}

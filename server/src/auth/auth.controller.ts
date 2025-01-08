import { ApiResponse } from '@quickmeet/shared';
import { Body, Controller, Get, Inject, Post, Req, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { _OAuth2Client } from './decorators';
import { createResponse } from 'src/helpers/payload.util';
import { Response, CookieOptions, Request } from 'express';
import { GoogleApiService } from 'src/google-api/google-api.service';
import { _Request } from './interfaces';
import { toMs } from 'src/helpers/helper.util';
import { EncryptionService } from './encryption.service';
import appConfig from 'src/config/env/app.config';
import { ConfigType } from '@nestjs/config';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private encryptionService: EncryptionService,
    @Inject(appConfig.KEY) private config: ConfigType<typeof appConfig>,
    @Inject('GoogleApiService') private readonly googleApiService: GoogleApiService,
  ) {}

  @Post('/oauth2/callback')
  async oAuthCallback(@Body('code') code: string, @Req() req: _Request, @Res({ passthrough: true }) res: Response): Promise<ApiResponse<Boolean>> {
    const appEnvironment = (req.headers['x-app-environment'] as 'web' | 'chrome') || 'web';

    const oauthRedirectUrl = this.getOauthRedirectUrl(appEnvironment);
    const { accessToken, refreshToken, hd, iv, email } = await this.authService.login(code, oauthRedirectUrl);

    if (refreshToken && iv) {
      this.setCookie(res, 'refreshToken', refreshToken);
      this.setCookie(res, 'iv', iv);
    }

    this.setCookie(res, 'accessToken', accessToken, toMs('1h'));
    this.setCookie(res, 'hd', hd);
    this.setCookie(res, 'email', email);

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
  getOAuthUrl(@Req() req: _Request): ApiResponse<string> {
    const appEnvironment = (req.headers['x-app-environment'] as 'web' | 'chrome') || 'web';
    const oauthRedirectUrl = this.getOauthRedirectUrl(appEnvironment);

    const url = this.googleApiService.getOAuthUrl(oauthRedirectUrl);

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

  private getOauthRedirectUrl(appEnvironment: string) {
    return appEnvironment === 'chrome' ? `https://${this.config.chromeExtensionId}.chromiumapp.org/index.html/oauthcallback` : this.config.oAuthRedirectUrl;
  }
}

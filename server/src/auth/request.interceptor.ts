import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Inject } from '@nestjs/common';
import { Observable } from 'rxjs';
import { _Request } from './interfaces';
import { GoogleApiService } from 'src/google-api/google-api.service';
import appConfig from 'src/config/env/app.config';
import { ConfigType } from '@nestjs/config';
/**
 * must be used after AuthGuard so that the req.accessToken is populated
 */
@Injectable()
export class RequestInterceptor implements NestInterceptor {
  constructor(
    @Inject('GoogleApiService') private readonly googleApiService: GoogleApiService,
    @Inject(appConfig.KEY) private config: ConfigType<typeof appConfig>,
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler<any>): Promise<Observable<any>> {
    const request: _Request = context.switchToHttp().getRequest();
    const accessToken = request.accessToken;

    this.setOAuthRedirectUrl(request);

    request.oauth2Client = this.googleApiService.getOAuthClient(accessToken);

    return next.handle();
  }

  setOAuthRedirectUrl(request: _Request) {
    const appEnvironment = (request.headers['x-app-environment'] as 'web' | 'chrome') || 'web';

    if (appEnvironment === 'chrome') {
      this.config.oAuthRedirectUrl = `https://${this.config.chromeExtensionId}.chromiumapp.org/index.html/oauthcallback`;
    }
  }
}

import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Inject } from '@nestjs/common';
import { Observable } from 'rxjs';
import { _Request } from './interfaces';
import appConfig from 'src/config/env/app.config';
import { ConfigType } from '@nestjs/config';

/**
 * Called at every request to the API
 */
@Injectable()
export class RequestInterceptor implements NestInterceptor {
  constructor(@Inject(appConfig.KEY) private config: ConfigType<typeof appConfig>) {}

  async intercept(context: ExecutionContext, next: CallHandler<any>): Promise<Observable<any>> {
    const request: _Request = context.switchToHttp().getRequest();
    const appEnvironment = (request.headers['x-app-environment'] as 'web' | 'chrome') || 'web';

    if (appEnvironment === 'chrome') {
      this.config.oAuthRedirectUrl = `https://${this.config.chromeExtensionId}.chromiumapp.org/index.html/oauthcallback`;
    }

    return next.handle();
  }
}

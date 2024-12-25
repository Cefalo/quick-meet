import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Inject } from '@nestjs/common';
import { Observable } from 'rxjs';
import { GoogleApiService } from 'src/google-api/google-api.service';
import { IJwtPayload } from 'src/auth/dto';

@Injectable()
export class OAuthInterceptor implements NestInterceptor {
  constructor(@Inject('GoogleApiService') private readonly googleApiService: GoogleApiService) {}

  async intercept(context: ExecutionContext, next: CallHandler<any>): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const payload: IJwtPayload = request['payload'];
    const redirectUrl = request.headers['x-redirect-url'];

    let oauth2Client = this.createOauthClient(payload, redirectUrl);
    request['oauth2Client'] = oauth2Client;

    return next.handle();
  }

  private createOauthClient(payload: IJwtPayload, redirectUrl: string) {
    return this.googleApiService.getOAuthClient(redirectUrl, payload);
  }
}

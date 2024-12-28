import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Inject } from '@nestjs/common';
import { Observable } from 'rxjs';
import { GoogleApiService } from 'src/google-api/google-api.service';
import { IJwtPayload } from 'src/auth/dto';

/**
 * must be used after AuthGuard so that the req.payload is populated
 */
@Injectable()
export class OAuthInterceptor implements NestInterceptor {
  constructor(@Inject('GoogleApiService') private readonly googleApiService: GoogleApiService) {}

  async intercept(context: ExecutionContext, next: CallHandler<any>): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const payload: IJwtPayload = request['payload'];

    let oauth2Client = this.createOauthClient(payload);
    request['oauth2Client'] = oauth2Client;

    return next.handle();
  }

  private createOauthClient(payload: IJwtPayload) {
    return this.googleApiService.getOAuthClient(payload);
  }
}

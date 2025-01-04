import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Inject } from '@nestjs/common';
import { Observable } from 'rxjs';
import { _Request } from './interfaces';
import { GoogleApiService } from 'src/google-api/google-api.service';

/**
 * must be used after AuthGuard so that the req.accessToken is populated
 */
@Injectable()
export class OAuthInterceptor implements NestInterceptor {
  constructor(@Inject('GoogleApiService') private readonly googleApiService: GoogleApiService) {}

  async intercept(context: ExecutionContext, next: CallHandler<any>): Promise<Observable<any>> {
    const request: _Request = context.switchToHttp().getRequest();
    const accessToken = request.accessToken;

    request.oauth2Client = this.googleApiService.getOAuthClient(accessToken);

    return next.handle();
  }
}

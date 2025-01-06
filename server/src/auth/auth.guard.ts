import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { _Request } from './interfaces';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor() {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: _Request = context.switchToHttp().getRequest();

    const token = request.signedCookies.accessToken;
    if (!token) {
      throw new UnauthorizedException();
    }

    const refreshToken = request.signedCookies.refreshToken;
    if (refreshToken === false) {
      throw new UnauthorizedException();
    }

    request.accessToken = token;
    request.hd = request.signedCookies.hd;
    request.refreshToken = refreshToken;

    return true;
  }
}

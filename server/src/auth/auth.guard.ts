import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { _Request } from './interfaces';
import { EncryptionService } from './encryption.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private encryptionService: EncryptionService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: _Request = context.switchToHttp().getRequest();

    if (!request.cookies.accessToken) {
      throw new UnauthorizedException();
    }

    request.accessToken = request.cookies.accessToken;
    request.hd = request.cookies.hd;
    request.iv = request.cookies.iv;
    request.userId = request.cookies.userId;
    request.refreshToken = await this.encryptionService.decrypt(request.cookies.refreshToken, request.cookies.iv);

    return true;
  }
}

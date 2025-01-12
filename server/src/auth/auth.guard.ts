import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { _Request } from './interfaces';
import { EncryptionService } from './encryption.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private encryptionService: EncryptionService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: _Request = context.switchToHttp().getRequest();

    if (!request.cookies.accessToken || !request.cookies.accessTokenIv) {
      throw new UnauthorizedException('No access token found');
    }

    try {
      request.accessToken = await this.encryptionService.decrypt(request.cookies.accessToken, request.cookies.accessTokenIv);
      request.hd = request.cookies.hd;
      request.email = request.cookies.email;
    } catch (error) {
      throw new UnauthorizedException('Invalid access token');
    }

    return true;
  }
}

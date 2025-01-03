import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, Inject } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import appConfig from '../config/env/app.config';
import { IJwtPayload } from './dto';
import to from 'await-to-js';
import { EncryptionService } from './encryption.service';
import { _Request } from './interfaces';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private encryptionService: EncryptionService,
    private jwtService: JwtService,
    @Inject(appConfig.KEY) private config: ConfigType<typeof appConfig>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: _Request = context.switchToHttp().getRequest();
    const token = request.headers.authorization?.split(' ')[1];

    if (!token) {
      throw new UnauthorizedException();
    }

    const [err, _]: [Error, IJwtPayload] = await to(this.jwtService.verifyAsync(token, { secret: this.config.jwtSecret }));
    if (err) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    const decoded = await this.jwtService.decode(token);
    const decrypted = await this.encryptionService.decrypt(decoded.payload, decoded.iv);
    if (!decrypted) {
      throw new UnauthorizedException();
    }

    const decryptedPayload: IJwtPayload = JSON.parse(decrypted);

    request.access_token = decryptedPayload.accessToken;
    request.hd = decryptedPayload.hd;
    request.refresh_token = request.cookies.refreshToken;

    return true;
  }
}

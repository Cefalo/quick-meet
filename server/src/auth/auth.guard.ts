import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, Inject } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import appConfig from '../config/env/app.config';
import { Request } from 'express';
import { IJwtPayload } from './dto';
import to from 'await-to-js';
import { EncryptionService } from './encryption.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private encryptionService: EncryptionService,
    private jwtService: JwtService,
    @Inject(appConfig.KEY) private config: ConfigType<typeof appConfig>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: Request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException();
    }

    const [err, _]: [Error, IJwtPayload] = await to(
      this.jwtService.verifyAsync(token, {
        secret: this.config.jwtSecret,
      }),
    );

    if (err) {
      console.error(err);
      throw new UnauthorizedException('Invalid or expired token');
    }

    const decoded = await this.jwtService.decode(token);
    decoded.refreshToken = request.cookies.refreshToken;

    const decrypted = await this.encryptionService.decrypt(decoded.payload, decoded.iv);
    if (!decrypted) {
      throw new UnauthorizedException();
    }

    const decryptedPayload: IJwtPayload = JSON.parse(decrypted);

    request['payload'] = decryptedPayload;
    request['hd'] = decryptedPayload.hd;

    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}

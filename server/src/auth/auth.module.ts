import { Logger, Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { AuthGuard } from './auth.guard';
import { GoogleApiModule } from '../google-api/google-api.module';
import { EncryptionService } from './encryption.service';

@Module({
  imports: [GoogleApiModule],
  controllers: [AuthController],
  providers: [AuthService, JwtService, EncryptionService, AuthGuard, Logger],
  exports: [AuthService, AuthGuard, EncryptionService],
})
export class AuthModule {}

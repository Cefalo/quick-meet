import { Logger, Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { Auth, User } from './entities';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { AuthGuard } from './auth.guard';
import { GoogleApiModule } from '../google-api/google-api.module';

@Module({
  imports: [TypeOrmModule.forFeature([User, Auth]), GoogleApiModule],
  controllers: [AuthController],
  providers: [AuthService, JwtService, AuthGuard, Logger],
  exports: [AuthService, AuthGuard],
})
export class AuthModule {}

import { Logger, Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CalenderController } from './calender.controller';
import { CalenderService } from './calender.service';
import { JwtService } from '@nestjs/jwt';
import { GoogleApiModule } from '../google-api/google-api.module';

@Module({
  imports: [AuthModule, GoogleApiModule],
  controllers: [CalenderController],
  exports: [CalenderService],
  providers: [CalenderService, JwtService, Logger],
})
export class CalenderModule {}

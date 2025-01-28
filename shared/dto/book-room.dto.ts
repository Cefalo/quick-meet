import { Transform } from 'class-transformer';
import { IsOptional, IsString, IsNumber, IsArray, IsBoolean, IsObject } from 'class-validator';
import type { IPeopleInformation } from 'interfaces';

export class BookRoomDto {
  @IsString()
  startTime: string; // A combined date-time value (formatted according to RFC3339A). Time zone offset is required

  @Transform(({ value }) => Number(value))
  @IsNumber()
  duration: number;

  @Transform(({ value }) => Number(value))
  @IsNumber()
  seats: number;

  @IsString()
  @IsOptional()
  timeZone: string;

  @IsString()
  room: string;

  @IsOptional()
  @IsBoolean()
  createConference?: boolean;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  floor?: string;

  @IsOptional()
  @IsArray()
  @IsObject({ each: true })
  attendees?: IPeopleInformation[];
}

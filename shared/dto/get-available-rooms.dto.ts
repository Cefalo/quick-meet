import { Transform } from 'class-transformer';
import { IsNumber, IsOptional, IsString, IsDateString, IsTimeZone, Min } from 'class-validator';

export class GetAvailableRoomsQueryDto {
  @IsDateString()
  startTime: string;

  @Transform(({ value }) => Number(value))
  @IsNumber()
  duration: number;

  @IsTimeZone()
  timeZone: string;

  @Transform(({ value }) => Number(value))
  @IsNumber()
  @Min(1, { message: 'Select min seat capacity' })
  seats: number;

  @IsOptional()
  @Transform(({ value }) => {
    return value.trim() === '' ? undefined : value;
  })
  @IsString()
  floor?: string;

  @IsOptional()
  @IsString()
  eventId?: string;
}

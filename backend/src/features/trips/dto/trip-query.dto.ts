import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { TripStatus } from '@prisma/client';

export class TripQueryDto {
  @IsOptional()
  @IsEnum(TripStatus)
  status?: TripStatus;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : 'start_date'))
  sort: string = 'start_date';

  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' && value.toLowerCase() === 'desc' ? 'desc' : 'asc'))
  order: 'asc' | 'desc' = 'asc';

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Transform(({ value }) => (value ? Number(value) : 20))
  limit: number = 20;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Transform(({ value }) => (value ? Number(value) : 0))
  offset: number = 0;
}

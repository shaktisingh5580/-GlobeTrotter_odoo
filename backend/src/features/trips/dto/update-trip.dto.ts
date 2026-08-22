import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { TripStatus } from '@prisma/client';

export class UpdateTripDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  title?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  description?: string;

  @IsOptional()
  @IsDateString({}, { message: 'start_date must be a valid ISO date.' })
  start_date?: string;

  @IsOptional()
  @IsDateString({}, { message: 'end_date must be a valid ISO date.' })
  end_date?: string;

  @IsOptional()
  @IsNumber({}, { message: 'budget_limit must be a number.' })
  @Min(0, { message: 'budget_limit must be greater than or equal to 0.' })
  @Transform(({ value }) => (value !== undefined && value !== null ? Number(value) : undefined))
  budget_limit?: number;

  @IsOptional()
  @IsString()
  @MaxLength(3)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toUpperCase() : undefined))
  currency?: string;

  @IsOptional()
  @IsUUID('4', { message: 'cover_file_id must be a valid UUIDv4.' })
  cover_file_id?: string;

  @IsOptional()
  @IsEnum(TripStatus, {
    message: 'status must be one of: DRAFT, PLANNED, ONGOING, COMPLETED.',
  })
  status?: TripStatus;
}

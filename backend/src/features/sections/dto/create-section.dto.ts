import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { SectionType } from '@prisma/client';

export class CreateSectionDto {
  @IsString()
  @IsNotEmpty({ message: 'Section title is required.' })
  @MaxLength(200)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  title!: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  description?: string;

  @IsOptional()
  @IsEnum(SectionType, {
    message: 'section_type must be one of: TRAVEL, STAY, ACTIVITY, FOOD, TRANSPORT, CUSTOM.',
  })
  section_type?: SectionType;

  @IsDateString({}, { message: 'start_date must be a valid ISO date (YYYY-MM-DD).' })
  @IsNotEmpty({ message: 'start_date is required.' })
  start_date!: string;

  @IsDateString({}, { message: 'end_date must be a valid ISO date (YYYY-MM-DD).' })
  @IsNotEmpty({ message: 'end_date is required.' })
  end_date!: string;

  @IsOptional()
  @IsNumber({}, { message: 'planned_budget must be a number.' })
  @Min(0, { message: 'planned_budget must be greater than or equal to 0.' })
  @Transform(({ value }) => (value !== undefined && value !== null ? Number(value) : undefined))
  planned_budget?: number;

  @IsOptional()
  @IsString()
  @MaxLength(3)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toUpperCase() : 'INR'))
  currency?: string;

  @IsOptional()
  @IsUUID('4', { message: 'trip_stop_id must be a valid UUIDv4.' })
  trip_stop_id?: string;

  @IsOptional()
  @IsInt({ message: 'section_order must be an integer.' })
  @Min(1, { message: 'section_order must be at least 1.' })
  @Transform(({ value }) => (value !== undefined && value !== null ? Number(value) : undefined))
  section_order?: number;
}

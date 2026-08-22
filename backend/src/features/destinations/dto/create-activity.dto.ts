import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ActivityCategory } from '@prisma/client';

export class CreateActivityDto {
  @IsString()
  @IsNotEmpty({ message: 'Activity name is required.' })
  @MaxLength(300)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(ActivityCategory, {
    message: 'category must be one of: SIGHTSEEING, FOOD, ADVENTURE, CULTURE, NIGHTLIFE, SHOPPING, NATURE, OTHER.',
  })
  category?: ActivityCategory;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => (value !== undefined && value !== null ? Number(value) : undefined))
  estimated_cost?: number;

  @IsOptional()
  @IsString()
  @MaxLength(3)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toUpperCase() : 'INR'))
  currency?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  duration_minutes?: number;

  @IsOptional()
  @IsString()
  image_url?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(5)
  rating?: number;
}

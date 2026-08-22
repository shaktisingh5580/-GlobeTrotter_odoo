import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class DestinationQueryDto {
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : undefined))
  search?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toUpperCase() : undefined))
  country?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : undefined))
  tag?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : 'popularity_score'))
  sort: string = 'popularity_score';

  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' && value.toLowerCase() === 'asc' ? 'asc' : 'desc'))
  order: 'asc' | 'desc' = 'desc';

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

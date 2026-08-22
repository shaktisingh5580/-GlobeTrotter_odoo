import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class PostQueryDto {
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  q?: string;

  @IsOptional()
  @IsUUID(4, { message: 'destination_id must be a valid UUID v4' })
  destination_id?: string;

  @IsOptional()
  @IsUUID(4, { message: 'activity_id must be a valid UUID v4' })
  activity_id?: string;

  @IsOptional()
  @IsUUID(4, { message: 'user_id must be a valid UUID v4' })
  user_id?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.toLowerCase() : 'recent'))
  sort: string = 'recent';

  @IsOptional()
  @IsEnum(['asc', 'desc'], { message: 'order must be asc or desc.' })
  @Transform(({ value }) => (typeof value === 'string' ? value.toLowerCase() : 'desc'))
  order: 'asc' | 'desc' = 'desc';

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'limit must be an integer.' })
  @Min(1, { message: 'limit must be at least 1.' })
  @Max(100, { message: 'limit cannot exceed 100.' })
  limit: number = 20;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'offset must be an integer.' })
  @Min(0, { message: 'offset cannot be negative.' })
  offset: number = 0;
}

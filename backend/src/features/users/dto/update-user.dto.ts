import {
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  first_name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  last_name?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  bio?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  city?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  country?: string;

  @IsOptional()
  @IsUUID('4', { message: 'avatar_file_id must be a valid UUIDv4' })
  avatar_file_id?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  language?: string;
}

import {
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { PostVisibility } from '@prisma/client';

export class UpdatePostDto {
  @IsOptional()
  @IsString()
  @MaxLength(300)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  title?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  content?: string;

  @IsOptional()
  @IsEnum(PostVisibility, {
    message: 'visibility must be one of: PUBLIC, PRIVATE, FRIENDS.',
  })
  visibility?: PostVisibility;
}

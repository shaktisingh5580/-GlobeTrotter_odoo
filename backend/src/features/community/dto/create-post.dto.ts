import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { PostVisibility } from '@prisma/client';

export class CreatePostDto {
  @IsString()
  @IsNotEmpty({ message: 'Title is required.' })
  @MaxLength(300)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  title!: string;

  @IsString()
  @IsNotEmpty({ message: 'Content is required.' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  content!: string;

  @IsOptional()
  @IsUUID(4, { message: 'trip_id must be a valid UUID v4' })
  trip_id?: string;

  @IsOptional()
  @IsUUID(4, { message: 'destination_id must be a valid UUID v4' })
  destination_id?: string;

  @IsOptional()
  @IsUUID(4, { message: 'activity_id must be a valid UUID v4' })
  activity_id?: string;

  @IsOptional()
  @IsEnum(PostVisibility, {
    message: 'visibility must be one of: PUBLIC, PRIVATE, FRIENDS.',
  })
  visibility?: PostVisibility;
}

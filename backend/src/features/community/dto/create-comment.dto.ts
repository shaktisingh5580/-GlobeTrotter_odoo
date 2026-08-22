import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateCommentDto {
  @IsString()
  @IsNotEmpty({ message: 'Comment content is required.' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  content!: string;

  @IsOptional()
  @IsUUID(4, { message: 'parent_comment_id must be a valid UUID v4' })
  parent_comment_id?: string;
}

export class UpdateCommentDto {
  @IsString()
  @IsNotEmpty({ message: 'Comment content is required.' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  content!: string;
}

import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  Min,
} from 'class-validator';
import { ReactionType } from '@prisma/client';

export class ReactPostDto {
  @IsOptional()
  @IsEnum(ReactionType, {
    message: 'reaction_type must be one of: LIKE, LOVE, INSPIRE, HELPFUL.',
  })
  reaction_type?: ReactionType;
}

export class AttachMediaDto {
  @IsUUID(4, { message: 'media_file_id must be a valid UUID v4' })
  @IsNotEmpty({ message: 'media_file_id is required' })
  media_file_id!: string;

  @IsInt({ message: 'display_order must be an integer' })
  @Min(0, { message: 'display_order must be at least 0' })
  display_order!: number;
}

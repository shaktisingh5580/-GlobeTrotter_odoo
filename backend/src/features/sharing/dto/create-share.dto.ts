import {
  IsEnum,
  IsInt,
  IsOptional,
  Max,
  Min,
} from 'class-validator';
import { ShareVisibility } from '@prisma/client';

export class CreateShareDto {
  @IsOptional()
  @IsEnum(ShareVisibility, {
    message: 'visibility must be either PUBLIC or LINK_ONLY.',
  })
  visibility?: ShareVisibility;

  @IsOptional()
  @IsInt({ message: 'expires_in_days must be an integer.' })
  @Min(1, { message: 'expires_in_days must be at least 1 day.' })
  @Max(365, { message: 'expires_in_days cannot exceed 365 days.' })
  expires_in_days?: number;
}
